import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import CouponRedemption from '#models/coupon_redemption'
import ExpireCouponsService from '#services/expire_coupons_service'

test.group(
  'Functional & Unit | Expire Coupons Worker & Service (Task #13, RN09, ADR-001, ADR-003)',
  (group) => {
    group.each.setup(() => testUtils.db().truncate())

    async function createCustomer(email: string, fullName: string, suffix: string = '1') {
      const user = await User.create({
        email,
        password: 'password123',
        userType: 'CUSTOMER',
      })

      const customer = await UserCustomer.create({
        userId: user.id,
        fullName,
        cpf: `123456789${suffix.padStart(2, '0')}`,
      })

      return { user, customer }
    }

    async function createEstablishment(suffix: string) {
      return await Establishment.create({
        cnpj: `123456780001${suffix.padStart(2, '0')}`,
        legalName: `Lojista ${suffix} Ltda`,
        tradeName: `Loja ${suffix}`,
        status: 'ACTIVE',
        conversionFactor: 1.0,
      })
    }

    test('should expire multiple expired ACTIVE coupons in batch and refund points atomically', async ({
      assert,
    }) => {
      const { user: u1, customer: c1 } = await createCustomer('exp1@test.com', 'Cliente 1', '01')
      const { user: u2, customer: c2 } = await createCustomer('exp2@test.com', 'Cliente 2', '02')
      const establishment = await createEstablishment('1')

      // Saldos correntes dos clientes (após terem tido débito anterior)
      await PointBalance.create({
        customerId: c1.id,
        establishmentId: establishment.id,
        currentBalance: 50,
        totalAccumulated: 200,
      })

      await PointBalance.create({
        customerId: c2.id,
        establishmentId: establishment.id,
        currentBalance: 10,
        totalAccumulated: 100,
      })

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom 1',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: 100,
        stock: 5,
        status: 'ACTIVE',
      })

      // Cupom 1 de c1: Vencido há 2 dias
      const coupon1 = await CouponRedemption.create({
        customerId: u1.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-EXP-1',
        pointsCost: 100,
        status: 'ACTIVE',
        expiresAt: DateTime.now().minus({ days: 2 }),
      })

      // Cupom 2 de c2: Vencido há 1 hora
      const coupon2 = await CouponRedemption.create({
        customerId: u2.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-EXP-2',
        pointsCost: 80,
        status: 'ACTIVE',
        expiresAt: DateTime.now().minus({ hours: 1 }),
      })

      let emittedCount = 0
      emitter.on('coupon:expired', () => {
        emittedCount++
      })

      const service = new ExpireCouponsService()
      const result = await service.execute(50)

      assert.equal(result.processed, 2)
      assert.equal(result.expired, 2)
      assert.equal(result.failed, 0)
      assert.equal(emittedCount, 2)

      // Validação do cupom 1
      const fresh1 = await CouponRedemption.findOrFail(coupon1.id)
      assert.equal(fresh1.status, 'EXPIRED')
      assert.isNotNull(fresh1.cancelledAt)

      // Validação do saldo de c1: 50 + 100 = 150
      const b1 = await PointBalance.query()
        .where('customerId', c1.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(b1.currentBalance), 150)

      // Validação do ledger REVERSAL de c1
      const tx1 = await PointTransaction.query()
        .where('couponRedemptionId', coupon1.id)
        .where('type', 'REVERSAL')
        .firstOrFail()
      assert.equal(Number(tx1.points), 100)
      assert.include(tx1.description, 'Estorno por expiração de cupom')

      // Validação do cupom 2
      const fresh2 = await CouponRedemption.findOrFail(coupon2.id)
      assert.equal(fresh2.status, 'EXPIRED')
      assert.isNotNull(fresh2.cancelledAt)

      // Validação do saldo de c2: 10 + 80 = 90
      const b2 = await PointBalance.query()
        .where('customerId', c2.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(b2.currentBalance), 90)

      // Validação do estoque restaurado: 5 + 2 = 7
      const freshReward = await Reward.findOrFail(reward.id)
      assert.equal(freshReward.stock, 7)
    })

    test('should NOT expire coupons that are still valid (expires_at >= now)', async ({
      assert,
    }) => {
      const { user, customer } = await createCustomer('valid@test.com', 'Cliente Valido', '03')
      const establishment = await createEstablishment('2')

      await PointBalance.create({
        customerId: customer.id,
        establishmentId: establishment.id,
        currentBalance: 20,
        totalAccumulated: 100,
      })

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Valido',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: 50,
        status: 'ACTIVE',
      })

      const validCoupon = await CouponRedemption.create({
        customerId: user.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-VALID',
        pointsCost: 50,
        status: 'ACTIVE',
        expiresAt: DateTime.now().plus({ days: 3 }), // ainda valido
      })

      const service = new ExpireCouponsService()
      const result = await service.execute()

      assert.equal(result.processed, 0)
      assert.equal(result.expired, 0)

      const fresh = await CouponRedemption.findOrFail(validCoupon.id)
      assert.equal(fresh.status, 'ACTIVE')
      assert.isNull(fresh.cancelledAt)

      // Saldo inalterado
      const b = await PointBalance.query()
        .where('customerId', customer.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(b.currentBalance), 20)

      // Nenhum ledger REVERSAL gerado
      const tx = await PointTransaction.query().where('couponRedemptionId', validCoupon.id).first()
      assert.isNull(tx)
    })

    test('should NOT alter already USED or CANCELLED coupons even if expires_at is in the past', async ({
      assert,
    }) => {
      const { user, customer } = await createCustomer('used@test.com', 'Cliente Consumido', '04')
      const establishment = await createEstablishment('3')

      await PointBalance.create({
        customerId: customer.id,
        establishmentId: establishment.id,
        currentBalance: 0,
        totalAccumulated: 200,
      })

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Passado',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: 100,
        status: 'ACTIVE',
      })

      const usedCoupon = await CouponRedemption.create({
        customerId: user.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-USED-PAST',
        pointsCost: 100,
        status: 'USED',
        expiresAt: DateTime.now().minus({ days: 5 }),
        usedAt: DateTime.now().minus({ days: 6 }),
      })

      const cancelledCoupon = await CouponRedemption.create({
        customerId: user.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-CANC-PAST',
        pointsCost: 100,
        status: 'CANCELLED',
        expiresAt: DateTime.now().minus({ days: 4 }),
        cancelledAt: DateTime.now().minus({ days: 5 }),
      })

      const service = new ExpireCouponsService()
      const result = await service.execute()

      assert.equal(result.processed, 0)
      assert.equal(result.expired, 0)

      const freshUsed = await CouponRedemption.findOrFail(usedCoupon.id)
      assert.equal(freshUsed.status, 'USED')

      const freshCanc = await CouponRedemption.findOrFail(cancelledCoupon.id)
      assert.equal(freshCanc.status, 'CANCELLED')

      // Saldo permanece 0 (não foi reembolsado)
      const b = await PointBalance.query()
        .where('customerId', customer.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(b.currentBalance), 0)
    })

    test('should guarantee absolute idempotency when executing the worker repeatedly', async ({
      assert,
    }) => {
      const { user, customer } = await createCustomer('idem@test.com', 'Cliente Idempotente', '05')
      const establishment = await createEstablishment('4')

      await PointBalance.create({
        customerId: customer.id,
        establishmentId: establishment.id,
        currentBalance: 10,
        totalAccumulated: 100,
      })

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Idem',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: 60,
        status: 'ACTIVE',
      })

      const coupon = await CouponRedemption.create({
        customerId: user.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-IDEM',
        pointsCost: 60,
        status: 'ACTIVE',
        expiresAt: DateTime.now().minus({ days: 1 }),
      })

      const service = new ExpireCouponsService()

      // 1ª Execução -> expira o cupom e estorna 60 pontos
      const run1 = await service.execute()
      assert.equal(run1.processed, 1)
      assert.equal(run1.expired, 1)

      const bAfterRun1 = await PointBalance.query()
        .where('customerId', customer.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(bAfterRun1.currentBalance), 70) // 10 + 60 = 70

      // 2ª Execução consecutiva -> não deve encontrar nada e nem estornar de novo
      const run2 = await service.execute()
      assert.equal(run2.processed, 0)
      assert.equal(run2.expired, 0)

      // Tentativa direta com expireSingleCoupon no mesmo ID -> retorna false e não duplica pontos
      const directRun = await service.expireSingleCoupon(coupon.id)
      assert.isFalse(directRun)

      const bAfterRun2 = await PointBalance.query()
        .where('customerId', customer.id)
        .where('establishmentId', establishment.id)
        .firstOrFail()
      assert.equal(Number(bAfterRun2.currentBalance), 70) // Permanece 70, sem estorno duplo

      const reversals = await PointTransaction.query()
        .where('couponRedemptionId', coupon.id)
        .where('type', 'REVERSAL')
      assert.lengthOf(reversals, 1)
    })
  }
)
