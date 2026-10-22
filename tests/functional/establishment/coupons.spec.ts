import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import CouponRedemption from '#models/coupon_redemption'

test.group(
  'Functional | Establishment Coupons Validation & Consumption (Task #12, RN10, ADR-002, ADR-003)',
  (group) => {
    group.each.setup(() => testUtils.db().truncate())

    async function createEstablishmentWithOperator(suffix: string) {
      const establishment = await Establishment.create({
        cnpj: `123456780001${suffix.padStart(2, '0')}`,
        legalName: `Lojista ${suffix} Ltda`,
        tradeName: `Loja ${suffix}`,
        status: 'ACTIVE',
        conversionFactor: 1.0,
      })

      const operatorUser = await User.create({
        email: `operador${suffix}@loja.com`,
        password: 'password123',
        userType: 'ESTABLISHMENT',
      })

      await UserEstablishment.create({
        userId: operatorUser.id,
        establishmentId: establishment.id,
        fullName: `Operador Caixa ${suffix}`,
        role: 'LOJISTA_OPERADOR',
      })

      return { establishment, operatorUser }
    }

    async function createCustomer(email: string, fullName: string) {
      const user = await User.create({
        email,
        password: 'password123',
        userType: 'CUSTOMER',
      })

      const customer = await UserCustomer.create({
        userId: user.id,
        fullName,
        cpf: '12345678901',
      })

      return { user, customer }
    }

    test('should successfully verify an active valid coupon without altering its status', async ({
      client,
      assert,
    }) => {
      const { establishment, operatorUser } = await createEstablishmentWithOperator('1')
      const { user: customerUser } = await createCustomer('cli1@test.com', 'Maria Oliveira')

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Desconto de R$ 15,00',
        description: 'Válido para compras acima de R$ 60',
        discountType: 'FIXED',
        discountValue: 15.0,
        minPurchaseAmount: 60.0,
        pointsCost: 150,
        validityDays: 30,
        status: 'ACTIVE',
      })

      const coupon = await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-1234',
        pointsCost: 150,
        status: 'ACTIVE',
        expiresAt: DateTime.now().plus({ days: 10 }),
      })

      const response = await client
        .post('/api/v1/establishments/coupons/verify')
        .loginAs(operatorUser)
        .json({ code: 'CSH-1234' })

      response.assertStatus(200)
      const body = response.body()

      assert.equal(body.code, 'CSH-1234')
      assert.equal(body.status, 'ACTIVE')
      assert.equal(body.reward.title, 'Desconto de R$ 15,00')
      assert.equal(body.reward.discountValue, 15)
      assert.equal(body.reward.minPurchaseAmount, 60)
      assert.equal(body.customer.fullName, 'Maria Oliveira')

      // Garante que o status no banco permanece ACTIVE
      const recheck = await CouponRedemption.findOrFail(coupon.id)
      assert.equal(recheck.status, 'ACTIVE')
      assert.isNull(recheck.usedAt)
    })

    test('should successfully consume an active valid coupon with lock and record used_at and used_by_user_id', async ({
      client,
      assert,
    }) => {
      const { establishment, operatorUser } = await createEstablishmentWithOperator('2')
      const { user: customerUser } = await createCustomer('cli2@test.com', 'João da Silva')

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom 10% OFF',
        discountType: 'PERCENTAGE',
        discountValue: 10.0,
        maxDiscountAmount: 30.0,
        pointsCost: 100,
        validityDays: 15,
        status: 'ACTIVE',
      })

      const coupon = await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-5678',
        pointsCost: 100,
        status: 'ACTIVE',
        expiresAt: DateTime.now().plus({ days: 5 }),
      })

      const response = await client
        .post('/api/v1/establishments/coupons/consume')
        .loginAs(operatorUser)
        .json({ code: 'CSH-5678' })

      response.assertStatus(200)
      const body = response.body()

      assert.equal(body.code, 'CSH-5678')
      assert.equal(body.status, 'USED')
      assert.isNotNull(body.usedAt)
      assert.equal(body.usedByUserId, operatorUser.id)

      // Verifica atualização definitiva no banco de dados
      const updatedCoupon = await CouponRedemption.findOrFail(coupon.id)
      assert.equal(updatedCoupon.status, 'USED')
      assert.isNotNull(updatedCoupon.usedAt)
      assert.equal(updatedCoupon.usedByUserId, operatorUser.id)
    })

    test('should reject verify and consume when coupon is expired (expires_at < now)', async ({
      client,
      assert,
    }) => {
      const { establishment, operatorUser } = await createEstablishmentWithOperator('3')
      const { user: customerUser } = await createCustomer('cli3@test.com', 'Ana Paula')

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Expirado',
        discountType: 'FIXED',
        discountValue: 20.0,
        pointsCost: 200,
        status: 'ACTIVE',
      })

      const expiredCoupon = await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-EXPI',
        pointsCost: 200,
        status: 'ACTIVE',
        expiresAt: DateTime.now().minus({ days: 1 }), // expirou ontem
      })

      // Tentativa de verificação
      const verifyRes = await client
        .post('/api/v1/establishments/coupons/verify')
        .loginAs(operatorUser)
        .json({ code: 'CSH-EXPI' })

      verifyRes.assertStatus(400)
      assert.equal(verifyRes.body().code, 'E_COUPON_EXPIRED')

      // Tentativa de consumo
      const consumeRes = await client
        .post('/api/v1/establishments/coupons/consume')
        .loginAs(operatorUser)
        .json({ code: 'CSH-EXPI' })

      consumeRes.assertStatus(400)
      assert.equal(consumeRes.body().code, 'E_COUPON_EXPIRED')

      // Garante que não foi consumido
      const freshCoupon = await CouponRedemption.findOrFail(expiredCoupon.id)
      assert.equal(freshCoupon.status, 'ACTIVE')
      assert.isNull(freshCoupon.usedAt)
    })

    test('should reject consume when coupon is already USED (prevenção de reuso)', async ({
      client,
      assert,
    }) => {
      const { establishment, operatorUser } = await createEstablishmentWithOperator('4')
      const { user: customerUser } = await createCustomer('cli4@test.com', 'Lucas Santos')

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Reuso',
        discountType: 'FIXED',
        discountValue: 10.0,
        pointsCost: 100,
        status: 'ACTIVE',
      })

      await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-USED',
        pointsCost: 100,
        status: 'USED',
        expiresAt: DateTime.now().plus({ days: 5 }),
        usedAt: DateTime.now().minus({ hours: 2 }),
        usedByUserId: operatorUser.id,
      })

      // Verificação de cupom já utilizado
      const verifyRes = await client
        .post('/api/v1/establishments/coupons/verify')
        .loginAs(operatorUser)
        .json({ code: 'CSH-USED' })

      verifyRes.assertStatus(400)
      assert.equal(verifyRes.body().code, 'E_COUPON_ALREADY_USED')

      // Tentativa de re-consumo
      const consumeRes = await client
        .post('/api/v1/establishments/coupons/consume')
        .loginAs(operatorUser)
        .json({ code: 'CSH-USED' })

      consumeRes.assertStatus(400)
      assert.equal(consumeRes.body().code, 'E_COUPON_ALREADY_USED')
    })

    test('should strictly block cross-tenant verification and consumption (ADR-002)', async ({
      client,
      assert,
    }) => {
      // Estabelecimento A e seu operador
      const establishmentA = await createEstablishmentWithOperator('5')
      // Estabelecimento B e seu operador
      const establishmentB = await createEstablishmentWithOperator('6')

      const { user: customerUser } = await createCustomer('cli5@test.com', 'Cliente Multi')

      // Cupom criado para o Estabelecimento A
      const rewardA = await Reward.create({
        establishmentId: establishmentA.establishment.id,
        title: 'Cupom Exclusivo Loja A',
        discountType: 'FIXED',
        discountValue: 25.0,
        pointsCost: 250,
        status: 'ACTIVE',
      })

      await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishmentA.establishment.id,
        rewardId: rewardA.id,
        code: 'CSH-LOJA-A',
        pointsCost: 250,
        status: 'ACTIVE',
        expiresAt: DateTime.now().plus({ days: 10 }),
      })

      // Operador da Loja B tenta verificar o cupom da Loja A
      const verifyCross = await client
        .post('/api/v1/establishments/coupons/verify')
        .loginAs(establishmentB.operatorUser)
        .json({ code: 'CSH-LOJA-A' })

      verifyCross.assertStatus(403)
      assert.equal(verifyCross.body().code, 'E_COUPON_OTHER_ESTABLISHMENT')

      // Operador da Loja B tenta consumir o cupom da Loja A
      const consumeCross = await client
        .post('/api/v1/establishments/coupons/consume')
        .loginAs(establishmentB.operatorUser)
        .json({ code: 'CSH-LOJA-A' })

      consumeCross.assertStatus(403)
      assert.equal(consumeCross.body().code, 'E_COUPON_OTHER_ESTABLISHMENT')

      // Garante que o cupom na Loja A continua intacto
      const freshCoupon = await CouponRedemption.findByOrFail('code', 'CSH-LOJA-A')
      assert.equal(freshCoupon.status, 'ACTIVE')
      assert.isNull(freshCoupon.usedAt)
    })

    test('should handle concurrent consumption with pessimistic lock (ADR-003): exactly one succeeds', async ({
      client,
      assert,
    }) => {
      const { establishment, operatorUser } = await createEstablishmentWithOperator('7')
      const { user: customerUser } = await createCustomer('cli6@test.com', 'Carlos Concorrente')

      const reward = await Reward.create({
        establishmentId: establishment.id,
        title: 'Cupom Concorrência',
        discountType: 'FIXED',
        discountValue: 50.0,
        pointsCost: 500,
        status: 'ACTIVE',
      })

      await CouponRedemption.create({
        customerId: customerUser.id,
        establishmentId: establishment.id,
        rewardId: reward.id,
        code: 'CSH-RACE',
        pointsCost: 500,
        status: 'ACTIVE',
        expiresAt: DateTime.now().plus({ days: 10 }),
      })

      // Dispara duas requisições de consumo simultâneas para o mesmo código
      const [res1, res2] = await Promise.all([
        client
          .post('/api/v1/establishments/coupons/consume')
          .loginAs(operatorUser)
          .json({ code: 'CSH-RACE' }),
        client
          .post('/api/v1/establishments/coupons/consume')
          .loginAs(operatorUser)
          .json({ code: 'CSH-RACE' }),
      ])

      const statuses = [res1.status(), res2.status()]
      assert.include(statuses, 200)
      assert.include(statuses, 400)

      const successRes = res1.status() === 200 ? res1 : res2
      const failedRes = res1.status() === 400 ? res1 : res2

      assert.equal(successRes.body().status, 'USED')
      assert.equal(failedRes.body().code, 'E_COUPON_ALREADY_USED')

      // Confirma que no banco o cupom foi usado apenas uma vez
      const finalCoupon = await CouponRedemption.findByOrFail('code', 'CSH-RACE')
      assert.equal(finalCoupon.status, 'USED')
      assert.isNotNull(finalCoupon.usedAt)
      assert.equal(finalCoupon.usedByUserId, operatorUser.id)
    })
  }
)
