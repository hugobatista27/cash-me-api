import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import CouponRedemption from '#models/coupon_redemption'

test.group('Functional | Customer Coupons & Atomic Redemption (TASK-11 & ADR-003)', (group) => {
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

  test('GET /api/v1/customer/establishments/:id/rewards returns only ACTIVE rewards with stock > 0 or null', async ({
    client,
    assert,
  }) => {
    const { user } = await createConsumer('c1@test.com', 'Cliente 1')
    const establishment = await createActiveEstablishment('1')

    // Recompensa Ativa sem estoque definido (ilimitado / null)
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 1 - Ilimitado',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: null,
      status: 'ACTIVE',
    })

    // Recompensa Ativa com estoque positivo disponível
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 2 - Com Estoque',
      discountType: 'FIXED',
      discountValue: 20,
      pointsCost: 200,
      stock: 5,
      status: 'ACTIVE',
    })

    // Recompensa Ativa com estoque ZERADO (não deve ser retornada)
    await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom 3 - Esgotado',
      discountType: 'FIXED',
      discountValue: 30,
      pointsCost: 300,
      stock: 0,
      status: 'ACTIVE',
    })

    // Recompensa INACTIVE (não deve ser retornada)
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
    assert.isFalse(rewards.some((r: any) => r.title === 'Cupom 3 - Esgotado'))
    assert.isFalse(rewards.some((r: any) => r.title === 'Cupom 4 - Inativo'))
  })

  test('POST /api/v1/customer/rewards/:id/redeem blocks redemption if establishment is INACTIVE (RN11)', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c2@test.com', 'Cliente 2')
    const establishment = await createActiveEstablishment('2')
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

    // Saldo do cliente permanece inalterado
    const balance = await PointBalance.findByOrFail('customerId', customer.id)
    assert.equal(Number(balance.currentBalance), 500)
  })

  test('POST /api/v1/customer/rewards/:id/redeem blocks redemption if current_balance < points_cost', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c3@test.com', 'Cliente 3')
    const establishment = await createActiveEstablishment('3')

    // Saldo insuficiente: 50 pontos para cupom que custa 100
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

    // Nenhum cupom gerado
    const count = await CouponRedemption.query().count('* as total')
    assert.equal(Number(count[0].$extras.total), 0)
  })

  test('POST /api/v1/customer/rewards/:id/redeem blocks redemption if reward is out of stock (stock = 0)', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c4@test.com', 'Cliente 4')
    const establishment = await createActiveEstablishment('4')

    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 200,
      totalAccumulated: 200,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Sem Estoque',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: 0,
      status: 'ACTIVE',
    })

    const response = await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)

    response.assertStatus(400)
    assert.equal(response.body().code, 'E_REWARD_OUT_OF_STOCK')

    // Saldo preservado
    const balance = await PointBalance.findByOrFail('customerId', customer.id)
    assert.equal(Number(balance.currentBalance), 200)
  })

  test('POST /api/v1/customer/rewards/:id/redeem succeeds: debits balance, generates DEBIT ledger, creates ACTIVE coupon (8 chars) and decrements stock', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c5@test.com', 'Cliente 5')
    const establishment = await createActiveEstablishment('5')

    // Saldo inicial de 300 pontos
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 300,
      totalAccumulated: 300,
    })

    // Recompensa custa 100 pontos e possui estoque 3
    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'R$ 10 OFF',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: 3,
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
    assert.isNotNull(coupon.expiresAt)

    // 1. Verificar se o saldo foi debitado para 200
    const updatedBalance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .firstOrFail()
    assert.equal(Number(updatedBalance.currentBalance), 200)

    // 2. Verificar se o estoque foi decrementado de 3 para 2
    const updatedReward = await Reward.findOrFail(reward.id)
    assert.equal(updatedReward.stock, 2)

    // 3. Verificar se o registro DEBIT em point_transactions foi criado e vinculado ao cupom
    const transaction = await PointTransaction.query()
      .where('couponRedemptionId', coupon.id)
      .firstOrFail()
    assert.equal(transaction.type, 'DEBIT')
    assert.equal(Number(transaction.points), 100)
    assert.equal(transaction.customerId, customer.id)
    assert.equal(transaction.establishmentId, establishment.id)
  })

  test('POST /api/v1/customer/coupons/:id/cancel blocks cancellation if coupon does not belong to customer or is not ACTIVE', async ({
    client,
  }) => {
    const owner = await createConsumer('owner@test.com', 'Cliente Dono')
    const otherUser = await createConsumer('other@test.com', 'Outro Cliente')
    const establishment = await createActiveEstablishment('6')

    await PointBalance.create({
      customerId: owner.customer.id,
      establishmentId: establishment.id,
      currentBalance: 200,
      totalAccumulated: 200,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Protegido',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    // Resgata o cupom como owner
    const redeemRes = await client
      .post(`/api/v1/customer/rewards/${reward.id}/redeem`)
      .loginAs(owner.user)
    redeemRes.assertStatus(201)
    const coupon = redeemRes.body()

    // 1. Tentativa de cancelamento por outro consumidor -> 404 (isolamento de recurso)
    const forbiddenCancelRes = await client
      .post(`/api/v1/customer/coupons/${coupon.id}/cancel`)
      .loginAs(otherUser.user)
    forbiddenCancelRes.assertStatus(404)

    // 2. Cancelamento legítimo pelo dono
    const validCancelRes = await client
      .post(`/api/v1/customer/coupons/${coupon.id}/cancel`)
      .loginAs(owner.user)
    validCancelRes.assertStatus(200)

    // 3. Segunda tentativa de cancelamento do mesmo cupom (status agora é CANCELLED) -> 400
    const alreadyCancelledRes = await client
      .post(`/api/v1/customer/coupons/${coupon.id}/cancel`)
      .loginAs(owner.user)
    alreadyCancelledRes.assertStatus(400)
    alreadyCancelledRes.assertBodyContains({ code: 'E_COUPON_NOT_ACTIVE' })
  })

  test('POST /api/v1/customer/coupons/:id/cancel succeeds: transitions to CANCELLED, refunds points, records REVERSAL and restores stock', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c7@test.com', 'Cliente 7')
    const establishment = await createActiveEstablishment('7')

    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 150,
      totalAccumulated: 150,
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Reversível',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      stock: 5,
      status: 'ACTIVE',
    })

    // Resgate
    const redeemRes = await client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user)
    redeemRes.assertStatus(201)
    const coupon = redeemRes.body()

    // Cancelamento
    const cancelRes = await client
      .post(`/api/v1/customer/coupons/${coupon.id}/cancel`)
      .loginAs(user)
    cancelRes.assertStatus(200)

    const cancelledCoupon = cancelRes.body()
    assert.equal(cancelledCoupon.status, 'CANCELLED')
    assert.isNotNull(cancelledCoupon.cancelledAt)

    // 1. Saldo restabelecido (150 - 100 + 100 = 150)
    const restoredBalance = await PointBalance.findByOrFail('customerId', customer.id)
    assert.equal(Number(restoredBalance.currentBalance), 150)

    // 2. Estoque restabelecido para 5
    const restoredReward = await Reward.findOrFail(reward.id)
    assert.equal(restoredReward.stock, 5)

    // 3. Transação REVERSAL vinculada ao cupom
    const reversalTx = await PointTransaction.query()
      .where('couponRedemptionId', coupon.id)
      .where('type', 'REVERSAL')
      .firstOrFail()
    assert.equal(Number(reversalTx.points), 100)
    assert.equal(reversalTx.customerId, customer.id)
  })

  test('GET /api/v1/customer/coupons lists coupons of logged customer with optional filter ?status=ACTIVE and preloads', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('c8@test.com', 'Cliente 8')
    const establishment = await createActiveEstablishment('8')

    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 500,
      totalAccumulated: 500,
    })

    const reward1 = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Ativo 1',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    const reward2 = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Ativo 2',
      discountType: 'FIXED',
      discountValue: 20,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    // Resgata dois cupons
    const r1 = await client.post(`/api/v1/customer/rewards/${reward1.id}/redeem`).loginAs(user)
    const r2 = await client.post(`/api/v1/customer/rewards/${reward2.id}/redeem`).loginAs(user)

    // Cancela o segundo cupom
    await client.post(`/api/v1/customer/coupons/${r2.body().id}/cancel`).loginAs(user)

    // 1. Consulta sem filtro de status -> deve retornar 2 cupons
    const allRes = await client.get('/api/v1/customer/coupons').loginAs(user)
    allRes.assertStatus(200)
    assert.equal(allRes.body().length, 2)
    assert.isNotNull(allRes.body()[0].reward)
    assert.isNotNull(allRes.body()[0].establishment)

    // 2. Consulta filtrando por status=ACTIVE -> deve retornar apenas 1 cupom
    const activeRes = await client.get('/api/v1/customer/coupons?status=ACTIVE').loginAs(user)
    activeRes.assertStatus(200)
    const activeCoupons = activeRes.body()
    assert.equal(activeCoupons.length, 1)
    assert.equal(activeCoupons[0].id, r1.body().id)
    assert.equal(activeCoupons[0].status, 'ACTIVE')
  })

  test('CONCURRENCY / RACE CONDITION (ADR-003): customer with 100 points tries 2 simultaneous redemptions of 80 points', async ({
    client,
    assert,
  }) => {
    const { user, customer } = await createConsumer('race@test.com', 'Cliente Concorrência')
    const establishment = await createActiveEstablishment('9')

    // Saldo inicial: exatamente 100 pontos
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 100,
      totalAccumulated: 100,
    })

    // Recompensa custa 80 pontos
    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Recompensa de 80 Pontos',
      discountType: 'FIXED',
      discountValue: 15,
      pointsCost: 80,
      stock: 10,
      status: 'ACTIVE',
    })

    // Dispara duas requisições simultâneas concorrentes
    const [res1, res2] = await Promise.all([
      client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user),
      client.post(`/api/v1/customer/rewards/${reward.id}/redeem`).loginAs(user),
    ])

    const statuses = [res1.status(), res2.status()].sort()

    // Validação estrita: exatamente 1 com 201 (Created) e 1 com 400 (Bad Request - Saldo Insuficiente)
    assert.deepEqual(statuses, [201, 400])

    // Verifica que a requisição que falhou retornou o erro de saldo insuficiente
    const failedRes = res1.status() === 400 ? res1 : res2
    assert.equal(failedRes.body().code, 'E_INSUFFICIENT_POINTS')

    // Verifica que exatamente 1 cupom foi gerado no banco de dados
    const totalCoupons = await CouponRedemption.query()
      .where('customerId', user.id)
      .where('rewardId', reward.id)
      .count('* as total')
    assert.equal(Number(totalCoupons[0].$extras.total), 1)

    // Verifica que o saldo final é exatamente 20 pontos (100 - 80) e JAMAIS negativo (-60)
    const finalBalance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .firstOrFail()
    assert.equal(Number(finalBalance.currentBalance), 20)
  })
})
