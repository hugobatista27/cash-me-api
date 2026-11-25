import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import PointRule from '#models/point_rule'
import PointTransaction from '#models/point_transaction'
import { DateTime } from 'luxon'

test.group('Functional | Establishment Loyalty Rules', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should return active loyalty rule with human readable summary for establishment admin', async ({
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

    const response = await client.get('/api/v1/establishment/loyalty-rule').loginAs(adminUser)

    console.log('GET 1 Status:', response.status())
    console.log('GET 1 Body:', JSON.stringify(response.body()))

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        establishmentId: establishment.id,
        version: 1,
        status: 'ACTIVE',
        pointsPerBase: 1,
      },
    })
    assert.isNotEmpty(response.body().data.humanReadableSummary)
  })

  test('should update and version loyalty rule and synchronize establishment conversion factor', async ({
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
      email: 'admin.update@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    // Cria v1 inicial
    await client.get('/api/v1/establishment/loyalty-rule').loginAs(adminUser)

    // Atualiza para R$ 10,00 = 1 ponto, compra mínima R$ 20,00 e teto de 100 pontos
    const updateRes = await client
      .put('/api/v1/establishment/loyalty-rule')
      .loginAs(adminUser)
      .json({
        baseAmount: 10.0,
        pointsPerBase: 1,
        minPurchaseAmount: 20.0,
        maxPointsPerPurchase: 100,
        name: '1 ponto a cada R$ 10',
      })

    console.log('PUT 2 Status:', updateRes.status())
    console.log('PUT 2 Body:', JSON.stringify(updateRes.body()))

    updateRes.assertStatus(200)
    updateRes.assertBodyContains({
      data: {
        version: 2,
        status: 'ACTIVE',
        baseAmount: 10,
        pointsPerBase: 1,
        minPurchaseAmount: 20,
        maxPointsPerPurchase: 100,
      },
    })

    // Verifica que a v1 foi inativada
    const v1 = await PointRule.query()
      .where('establishmentId', establishment.id)
      .where('version', 1)
      .first()
    assert.equal(v1!.status, 'INACTIVE')

    // Verifica que a v2 está ativa
    const v2 = await PointRule.query()
      .where('establishmentId', establishment.id)
      .where('version', 2)
      .first()
    assert.equal(v2!.status, 'ACTIVE')

    // Verifica sincronismo do conversionFactor (1 / 10 = 0.1)
    await establishment.refresh()
    assert.equal(Number(establishment.conversionFactor), 0.1)
  })

  test('should simulate points calculation in real-time', async ({ client }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const adminUser = await User.create({
      email: 'admin.sim@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    // Configura regra R$ 10 = 1 ponto
    await client.put('/api/v1/establishment/loyalty-rule').loginAs(adminUser).json({
      baseAmount: 10.0,
      pointsPerBase: 1,
      minPurchaseAmount: 0.0,
    })

    // Simula compra de R$ 157.80 -> 15 pontos
    const simRes = await client
      .get('/api/v1/establishment/loyalty-rule/simulate?amount=157.80')
      .loginAs(adminUser)

    simRes.assertStatus(200)
    simRes.assertBodyContains({
      data: {
        purchaseAmount: 157.8,
        calculatedPoints: 15,
      },
    })
  })

  test('should return version history of loyalty rules', async ({ client, assert }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const adminUser = await User.create({
      email: 'admin.hist@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    // Cria v1 e depois v2
    await client.get('/api/v1/establishment/loyalty-rule').loginAs(adminUser)
    await client.put('/api/v1/establishment/loyalty-rule').loginAs(adminUser).json({
      baseAmount: 10.0,
      pointsPerBase: 1,
    })

    const histRes = await client
      .get('/api/v1/establishment/loyalty-rule/history')
      .loginAs(adminUser)

    histRes.assertStatus(200)
    const history = histRes.body().data
    assert.lengthOf(history, 2)
    assert.equal(history[0].version, 2)
    assert.equal(history[0].status, 'ACTIVE')
    assert.equal(history[1].version, 1)
    assert.equal(history[1].status, 'INACTIVE')
  })

  test('points engine must apply active custom loyalty rule dynamically at runtime during NFC-e processing', async ({
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
      email: 'admin.runtime@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: adminUser.id,
      establishmentId: establishment.id,
      fullName: 'Gerente Admin',
      role: 'LOJISTA_ADMIN',
    })

    // Lojista configura regra: R$ 10 = 1 ponto, compra mínima R$ 30,00
    const ruleRes = await client.put('/api/v1/establishment/loyalty-rule').loginAs(adminUser).json({
      baseAmount: 10.0,
      pointsPerBase: 1,
      minPurchaseAmount: 30.0,
      name: 'Regra Especial 1 pt por R$ 10',
    })
    const ruleId = ruleRes.body().data.id

    // Consumidor autenticado envia NFC-e de R$ 95,00
    const customerUser = await User.create({
      email: 'customer.runtime@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: customerUser.id,
      fullName: 'Consumidor da Silva',
    })

    const invoiceRes = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(customerUser)
      .json({
        accessKey: '42230912345678000195650010000001231000007890',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=custom',
        issuerState: 'SC',
        issuerCnpj: '12345678000195',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 95.0,
      })

    invoiceRes.assertStatus(200)

    // Com R$ 95,00 sob a regra R$ 10 = 1 ponto -> devem ser concedidos 9 pontos (e NÃO 95 pontos do padrão antigo 1:1)
    invoiceRes.assertBodyContains({
      data: {
        status: 'PROCESSED',
        pointsAwarded: 9,
      },
    })

    // Verifica que o extrato de pontos salvou o ID e a versão da regra
    const tx = await PointTransaction.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()

    assert.isNotNull(tx)
    assert.equal(tx!.ruleId, ruleId)
    assert.equal(tx!.ruleVersion, 1)
    assert.equal(Number(tx!.points), 9)
  })

  test('should enforce RBAC: LOJISTA_OPERADOR cannot update rules and CUSTOMER is forbidden', async ({
    client,
  }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    // Operador
    const operatorUser = await User.create({
      email: 'operador@supermercado.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: operatorUser.id,
      establishmentId: establishment.id,
      fullName: 'Operador de Caixa',
      role: 'LOJISTA_OPERADOR',
    })

    // Operador pode consultar
    const getRes = await client.get('/api/v1/establishment/loyalty-rule').loginAs(operatorUser)
    getRes.assertStatus(200)

    // Operador é bloqueado ao tentar alterar (403)
    const putRes = await client
      .put('/api/v1/establishment/loyalty-rule')
      .loginAs(operatorUser)
      .json({
        baseAmount: 10.0,
        pointsPerBase: 1,
      })
    putRes.assertStatus(403)

    // Consumidor é bloqueado ao tentar consultar ou alterar (403)
    const customerUser = await User.create({
      email: 'customer.blocked@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await UserCustomer.create({
      userId: customerUser.id,
      fullName: 'Cliente Bloqueado',
    })

    const custGetRes = await client.get('/api/v1/establishment/loyalty-rule').loginAs(customerUser)
    custGetRes.assertStatus(403)
  })
})
