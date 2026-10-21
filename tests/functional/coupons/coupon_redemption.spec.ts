import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import CouponRedemption from '#models/coupon_redemption'

test.group('Functional | Customer Coupon Redemption & Lifecyle (TASK-11 & ADR-003)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  async function createConsumer(email: string, fullName: string) {
    const user = await User.create({
      email,
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName,
    })
    return { user, customer }
  }

  async function createActiveEstablishment(suffix: string) {
    return await Establishment.create({
      cnpj: `123456780001${suffix.padStart(2, '0')}`,
      legalName: `Loja ${suffix} Ltda`,
      tradeName: `Loja ${suffix}`,
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })
  }

  test('should list only ACTIVE rewards with stock > 0 or null for establishment', async ({
    client,
    assert,
  }) => {
    const { user } = await createConsumer('c1@test.com', 'Cliente 1')
    const establishment = await createActiveEstablishment('1')

    // Recompensa Ativa sem estoque definido (ilimitado)
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 1 - Ilimitado',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: null,
      status: 'ACTIVE',
    })

    // Recompensa Ativa com estoque disponível
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 2 - Com Estoque',
      discountType: 'FIXED',
      discountValue: 20,
      pointsCost: 200,
      stock: 5,
      status: 'ACTIVE',
    })

    // Recompensa Ativa com estoque ZERADO (não deve aparecer)
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 3 - Esgotado',
      discountType: 'FIXED',
      discountValue: 30,
      pointsCost: 300,
      stock: 0,
      status: 'ACTIVE',
    })

    // Recompensa INACTIVE (não deve aparecer)
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 4 - Inativo',
      discountType: 'FIXED',
      discountValue: 40,
      pointsCost: 400,
      stock: 10,
      status: 'INACTIVE',
    })

    const response = await client
      .get(`/api/v1/customer/establishments/${establishment.id}/rewards`)
      .loginAs(user)

    response.assertStatus(200)
    const rewards = response.body()
    assert.equal(rewards.length, 2)
    assert.isTrue(rewards.some((r: any) => r.title === 'Cupom 1 - Ilimitado'))
    assert.isTrue(rewards.some((r: any) => r.title === 'Cupom 2 - Com Estoque'))
  })

  test('should redeem coupon atomically: debit points, decrement stock, generate code and ledger', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c2@test.com', 'Cliente 2')
    const establishment = await createActiveEstablishment('2')

    // Saldo inicial de 300 pontos
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 300,
      totalAccumulated: 300,
    })

    // Recompensa custa 100 pontos e tem estoque 2
    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'R$ 10 OFF',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: 2,
      validityDays: 15,
      status: 'ACTIVE',
    })

    const response = await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)

    response.assertStatus(201)
    const coupon = response.body()

    assert.equal(coupon.customerId, user.id)
    assert.equal(coupon.establishmentId, establishment.id)
    assert.equal(coupon.rewardId, reward.id)
    assert.equal(coupon.pointsCost, 100)
    assert.equal(coupon.status, 'ACTIVE')
    assert.isNotNull(coupon.code)
    assert.equal(coupon.code.length, 8)

    // Verificar saldo atualizado para 200
    const updatedBalance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .firstOrFail()
    assert.equal(Number(updatedBalance.currentBalance), 200)

    // Verificar estoque atualizado para 1
    const updatedReward = await Reward.findOrFail(reward.id)
    assert.equal(updatedReward.stock, 1)

    // Verificar ledger de transação (DEBIT)
    const transaction = await PointTransaction.query()
      .where('couponRedemptionId', coupon.id)
      .firstOrFail()
    assert.equal(transaction.type, 'DEBIT')
    assert.equal(Number(transaction.points), 100)
    assert.equal(transaction.customerId, customer.id)
  })

  test('should reject redemption if establishment is INACTIVE (RN11)', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c3@test.com', 'Cliente 3')
    const establishment = await createActiveEstablishment('3')
    establishment.status = 'INACTIVE'
    await establishment.save()

    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 500,
      totalAccumulated: 500,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Bloqueado',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    const response = await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)

    response.assertStatus(400)
    assert.equal(response.body().code, 'E_ESTABLISHMENT_INACTIVE')

    // Saldo inalterado
    const balance = await PointBalance.findByOrFail('customerId', customer.id)
    assert.equal(Number(balance.currentBalance), 500)
  })

  test('should reject redemption if customer has insufficient points', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c4@test.com', 'Cliente 4')
    const establishment = await createActiveEstablishment('4')

    // Saldo de 50 pontos para cupom que custa 100
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 50,
      totalAccumulated: 50,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 100 Pontos',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    const response = await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)

    response.assertStatus(400)
    assert.equal(response.body().code, 'E_INSUFFICIENT_POINTS')

    const redemptionsCount = await CouponRedemption.query().count('* as total')
    assert.equal(Number(redemptionsCount[0].$extras.total), 0)
  })

  test('should cancel coupon: transition to CANCELLED, refund points and stock, insert REVERSAL ledger', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c5@test.com', 'Cliente 5')
    const establishment = await createActiveEstablishment('5')

    // 100 pontos de saldo inicial
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 100,
      totalAccumulated: 100,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Desconto Cancelável',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: 5,
      status: 'ACTIVE',
    })

    // Resgata primeiro
    const redeemRes = await client
      .post(`/api/v1/customer/rewards/${reward.id}/redeem`)
      .loginAs(user)
    redeemRes.assertStatus(201)
    const coupon = redeemRes.body()

    // Cancela o cupom
    const cancelRes = await client
      .post(`/api/v1/customer/coupons/${coupon.id}/cancel`)
      .loginAs(user)

    cancelRes.assertStatus(200)
    const cancelledCoupon = cancelRes.body()
    assert.equal(cancelledCoupon.status, 'CANCELLED')
    assert.isNotNull(cancelledCoupon.cancelledAt)

    // Saldo restaurado para 100
    const restoredBalance = await PointBalance.findByOrFail('customerId', customer.id)
    assert.equal(Number(restoredBalance.currentBalance), 100)

    // Estoque restaurado para 5
    const restoredReward = await Reward.findOrFail(reward.id)
    assert.equal(restoredReward.stock, 5)

    // Transação REVERSAL inserida
    const reversalTx = await PointTransaction.query()
      .where('couponRedemptionId', coupon.id)
      .where('type', 'REVERSAL')
      .firstOrFail()
    assert.equal(Number(reversalTx.points), 100)
  })

  test('should list customer redeemed coupons with relations preloaded', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c6@test.com', 'Cliente 6')
    const establishment = await createActiveEstablishment('6')

    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 500,
      totalAccumulated: 500,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Listagem',
      discountType: 'FIXED',
      discountValue: 15,
      pointsCost: 150,
      status: 'ACTIVE',
    })

    await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)

    const listRes = await client.get('/api/v1/customer/coupons').loginAs(user)

    listRes.assertStatus(200)
    const coupons = listRes.body()
    assert.equal(coupons.length, 1)
    assert.equal(coupons[0].reward.title, 'Cupom Listagem')
    assert.equal(coupons[0].establishment.tradeName, establishment.tradeName)
  })
})
