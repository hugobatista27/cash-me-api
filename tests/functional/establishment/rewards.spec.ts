import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import Establishment from '#models/establishment'
import Reward from '#models/reward'

test.group('Functional | Establishment Rewards (Task #10 & ADR-002)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should create a reward successfully when authenticated as establishment admin', async ({
    client,
    assert,
  }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const adminUser = await User.create({
      email: 'admin@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })

    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    const payload = {
      title: 'Cupom R$ 10 OFF',
      description: 'Válido em compras acima de R$ 50',
      discountType: 'FIXED',
      discountValue: 10.0,
      minPurchaseAmount: 50.0,
      pointsCost: 100,
      stock: 50,
      validityDays: 30,
    }

    const response = await client
      .post('/api/v1/establishments/rewards')
      .loginAs(adminUser)
      .json(payload)

    response.assertStatus(201)
    response.assertBodyContains({
      establishmentId: establishment.id,
      title: 'Cupom R$ 10 OFF',
      discountType: 'FIXED',
      discountValue: 10,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    const createdInDb = await Reward.findByOrFail('title', 'Cupom R$ 10 OFF')
    assert.equal(createdInDb.establishmentId, establishment.id)
    assert.equal(createdInDb.pointsCost, 100)
    assert.equal(createdInDb.status, 'ACTIVE')
  })

  test('should reject creation when discount_type is invalid or points_cost is negative or zero', async ({
    client,
  }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const adminUser = await User.create({
      email: 'admin@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })

    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    // Caso 1: tipo de desconto inválido
    const invalidTypeRes = await client
      .post('/api/v1/establishments/rewards')
      .loginAs(adminUser)
      .json({
        title: 'Cupom Invalido',
        discountType: 'INVALID_TYPE',
        discountValue: 10,
        pointsCost: 100,
      })
    invalidTypeRes.assertStatus(422)

    // Caso 2: custo de pontos negativo
    const negativePointsRes = await client
      .post('/api/v1/establishments/rewards')
      .loginAs(adminUser)
      .json({
        title: 'Cupom Pontos Negativos',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: -50,
      })
    negativePointsRes.assertStatus(422)

    // Caso 3: custo de pontos zero (points_cost > 0)
    const zeroPointsRes = await client
      .post('/api/v1/establishments/rewards')
      .loginAs(adminUser)
      .json({
        title: 'Cupom Pontos Zero',
        discountType: 'FIXED',
        discountValue: 10,
        pointsCost: 0,
      })
    zeroPointsRes.assertStatus(422)

    // Caso 4: PERCENTAGE sem teto de desconto (maxDiscountAmount)
    const percentageWithoutMaxRes = await client
      .post('/api/v1/establishments/rewards')
      .loginAs(adminUser)
      .json({
        title: 'Desconto 15%',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        pointsCost: 80,
      })
    percentageWithoutMaxRes.assertStatus(422)
  })

  test('should enforce strict multi-tenant isolation (ADR-002) - Merchant B cannot view or update Merchant A reward', async ({
    client,
    assert,
  }) => {
    // Estabelecimento A
    const establishmentA = await Establishment.create({
      cnpj: '11111111000111',
      legalName: 'Loja A Ltda',
      tradeName: 'Loja A',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })
    const userA = await User.create({
      email: 'merchantA@test.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: userA.id,
      establishmentId: establishmentA.id,
      fullName: 'Gerente A',
      role: 'LOJISTA_ADMIN',
    })

    // Estabelecimento B
    const establishmentB = await Establishment.create({
      cnpj: '22222222000122',
      legalName: 'Loja B Ltda',
      tradeName: 'Loja B',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })
    const userB = await User.create({
      email: 'merchantB@test.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: userB.id,
      establishmentId: establishmentB.id,
      fullName: 'Gerente B',
      role: 'LOJISTA_ADMIN',
    })

    // Cria recompensa para o Estabelecimento A
    const rewardA = await Reward.create({
      establishmentId: establishmentA.id,
      title: 'Desconto Especial Loja A',
      discountType: 'FIXED',
      discountValue: 20.0,
      pointsCost: 150,
      validityDays: 30,
      status: 'ACTIVE',
    })

    // Lojista B tenta visualizar a recompensa de A via GET /:id -> 404 Not Found
    const showResponse = await client
      .get(`/api/v1/establishments/rewards/${rewardA.id}`)
      .loginAs(userB)

    showResponse.assertStatus(404)

    // Lojista B tenta alterar a recompensa de A via PUT /:id -> 404 Not Found
    const updateResponse = await client
      .put(`/api/v1/establishments/rewards/${rewardA.id}`)
      .loginAs(userB)
      .json({
        title: 'Hacked Title by B',
        pointsCost: 1,
      })

    updateResponse.assertStatus(404)

    // Lojista B tenta alternar status da recompensa de A via PATCH /:id/toggle-status -> 404 Not Found
    const toggleResponse = await client
      .patch(`/api/v1/establishments/rewards/${rewardA.id}/toggle-status`)
      .loginAs(userB)

    toggleResponse.assertStatus(404)

    // Garante no banco que a recompensa de A não foi modificada
    await rewardA.refresh()
    assert.equal(rewardA.title, 'Desconto Especial Loja A')
    assert.equal(rewardA.pointsCost, 150)
    assert.equal(rewardA.status, 'ACTIVE')
  })

  test('should list only rewards belonging to the authenticated establishment', async ({
    client,
    assert,
  }) => {
    // Estabelecimento A
    const establishmentA = await Establishment.create({
      cnpj: '11111111000111',
      legalName: 'Padaria A Ltda',
      tradeName: 'Padaria A',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })
    const userA = await User.create({
      email: 'padariaA@test.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: userA.id,
      establishmentId: establishmentA.id,
      fullName: 'Dono Padaria A',
      role: 'LOJISTA_ADMIN',
    })

    // Estabelecimento B
    const establishmentB = await Establishment.create({
      cnpj: '22222222000122',
      legalName: 'Farmácia B Ltda',
      tradeName: 'Farmácia B',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    // Recompensas de A
    await Reward.create({
      establishmentId: establishmentA.id,
      title: 'Pão de Queijo Grátis',
      discountType: 'FIXED',
      discountValue: 5.0,
      pointsCost: 50,
      status: 'ACTIVE',
    })
    await Reward.create({
      establishmentId: establishmentA.id,
      title: 'Café Expresso Grátis',
      discountType: 'FIXED',
      discountValue: 7.0,
      pointsCost: 70,
      status: 'INACTIVE',
    })

    // Recompensa de B
    await Reward.create({
      establishmentId: establishmentB.id,
      title: 'Desconto em Vitaminas',
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      maxDiscountAmount: 30.0,
      pointsCost: 100,
      status: 'ACTIVE',
    })

    // Consulta de A sem filtro -> deve trazer 2 recompensas de A e nenhuma de B
    const listRes = await client.get('/api/v1/establishments/rewards').loginAs(userA)
    listRes.assertStatus(200)

    const listBody = listRes.body()
    assert.equal(listBody.length, 2)
    assert.isTrue(listBody.every((r: any) => r.establishmentId === establishmentA.id))

    // Consulta de A filtrando por status=ACTIVE -> deve trazer apenas a recompensa ativa de A
    const listActiveRes = await client
      .get('/api/v1/establishments/rewards?status=ACTIVE')
      .loginAs(userA)
    listActiveRes.assertStatus(200)

    const activeList = listActiveRes.body()
    assert.equal(activeList.length, 1)
    assert.equal(activeList[0].title, 'Pão de Queijo Grátis')
  })

  test('should toggle reward status between ACTIVE and INACTIVE', async ({ client, assert }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Loja Roupas Ltda',
      tradeName: 'Loja Roupas',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const adminUser = await User.create({
      email: 'admin@lojaroupas.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })

    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Roupas',
      role: 'LOJISTA_ADMIN',
    })

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: 'Cupom Camiseta 20% OFF',
      discountType: 'PERCENTAGE',
      discountValue: 20.0,
      maxDiscountAmount: 50.0,
      pointsCost: 120,
      status: 'ACTIVE',
    })

    // 1º Toggle: ACTIVE -> INACTIVE
    const toggle1 = await client
      .patch(`/api/v1/establishments/rewards/${reward.id}/toggle-status`)
      .loginAs(adminUser)

    toggle1.assertStatus(200)
    toggle1.assertBodyContains({
      id: reward.id,
      status: 'INACTIVE',
    })

    await reward.refresh()
    assert.equal(reward.status, 'INACTIVE')

    // 2º Toggle: INACTIVE -> ACTIVE
    const toggle2 = await client
      .patch(`/api/v1/establishments/rewards/${reward.id}/toggle-status`)
      .loginAs(adminUser)

    toggle2.assertStatus(200)
    toggle2.assertBodyContains({
      id: reward.id,
      status: 'ACTIVE',
    })

    await reward.refresh()
    assert.equal(reward.status, 'ACTIVE')
  })
})
