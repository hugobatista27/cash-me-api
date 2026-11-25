import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import UserEstablishment from '#models/user_establishment'
import Establishment from '#models/establishment'
import PointBalance from '#models/point_balance'
import { DateTime } from 'luxon'

test.group('Functional | Customer Invoices & Points Engine', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should process valid NFC-e, compute points and update customer balance for establishment', async ({
    client,
    assert,
  }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Padaria Central Ltda',
      tradeName: 'Padaria Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'customer@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Carlos Alberto',
    })

    const response = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230912345678000195650010000001231000001234',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=123',
        issuerState: 'SC',
        issuerCnpj: '12.345.678/0001-95',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 85.5,
        items: [
          { rawDescription: 'Pão Francês', quantity: 1, unitPrice: 15.5, totalPrice: 15.5 },
          { rawDescription: 'Café Expresso', quantity: 2, unitPrice: 35.0, totalPrice: 70.0 },
        ],
      })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        status: 'PROCESSED',
        pointsAwarded: 85,
        rejectionReason: null,
        invoice: {
          accessKey: '42230912345678000195650010000001231000001234',
          status: 'PROCESSED',
        },
        balance: {
          currentBalance: 85,
          totalAccumulated: 85,
        },
        establishment: {
          id: establishment.id,
          tradeName: 'Padaria Central',
        },
      },
    })

    // Checagem no banco de dados
    const balance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()
    assert.isNotNull(balance)
    assert.equal(Number(balance!.currentBalance), 85)
  })

  test('should guarantee strict multi-tenant isolation across establishments (ADR-002)', async ({
    client,
    assert,
  }) => {
    const shopA = await Establishment.create({
      cnpj: '11111111000111',
      legalName: 'Loja A Ltda',
      tradeName: 'Loja A',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const shopB = await Establishment.create({
      cnpj: '22222222000122',
      legalName: 'Loja B Ltda',
      tradeName: 'Loja B',
      status: 'ACTIVE',
      conversionFactor: 2.0, // 2 pontos por real
    })

    const user = await User.create({
      email: 'multitenant@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await UserCustomer.create({
      userId: user.id,
      fullName: 'Beatriz Costa',
    })

    // Compra de R$ 50 na Loja A -> 50 pontos
    await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230911111111000111650010000001111000001111',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=shopA',
        issuerState: 'SC',
        issuerCnpj: '11111111000111',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 50.0,
      })

    // Compra de R$ 40 na Loja B -> 80 pontos
    await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230922222222000122650010000002221000002222',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=shopB',
        issuerState: 'SC',
        issuerCnpj: '22222222000122',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 40.0,
      })

    // Consultar saldos consolidados do consumidor (App Mobile)
    const balancesResponse = await client.get('/api/v1/customer/balances').loginAs(user)

    balancesResponse.assertStatus(200)
    const balancesData = balancesResponse.body().data
    assert.lengthOf(balancesData, 2)

    const balanceA = balancesData.find((b: any) => b.establishmentId === shopA.id)
    const balanceB = balancesData.find((b: any) => b.establishmentId === shopB.id)

    assert.isDefined(balanceA)
    assert.isDefined(balanceB)
    assert.equal(balanceA!.currentBalance, 50)
    assert.equal(balanceA!.establishment.tradeName, 'Loja A')

    assert.equal(balanceB!.currentBalance, 80)
    assert.equal(balanceB!.establishment.tradeName, 'Loja B')

    // Extrato da Loja A deve trazer apenas transações da Loja A
    const statementAResponse = await client
      .get(`/api/v1/customer/establishments/${shopA.id}/statement`)
      .loginAs(user)

    statementAResponse.assertStatus(200)
    const statementA = statementAResponse.body().data
    assert.lengthOf(statementA, 1)
    assert.equal(statementA[0].establishmentId, shopA.id)
    assert.equal(statementA[0].points, 50)
  })

  test('should return 409 Conflict when submitting duplicate access key (RN02)', async ({
    client,
  }) => {
    await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Padaria Central Ltda',
      tradeName: 'Padaria Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'duplicate@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas duplicate',
    })

    const payload = {
      accessKey: '42230912345678000195650010000001231000009999',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=dup',
      issuerState: 'SC',
      issuerCnpj: '12345678000195',
      issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
      totalAmount: 60.0,
    }

    // Primeira submissão com sucesso
    const first = await client.post('/api/v1/customer/invoices/process').loginAs(user).json(payload)
    first.assertStatus(200)

    // Segunda submissão da mesma nota
    const second = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json(payload)
    second.assertStatus(409)
    second.assertBodyContains({
      code: 'E_DUPLICATE_INVOICE',
    })
  })

  test('should reject invoice if older than 48 hours and not add points (RN01)', async ({
    client,
    assert,
  }) => {
    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Padaria Central Ltda',
      tradeName: 'Padaria Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'expired@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Expired',
    })

    const response = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230912345678000195650010000001231000007777',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=exp',
        issuerState: 'SC',
        issuerCnpj: '12345678000195',
        issuedAt: DateTime.now().minus({ hours: 55 }).toISO(),
        totalAmount: 100.0,
      })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        status: 'REJECTED',
        rejectionReason: 'EXPIRED_48H',
        pointsAwarded: 0,
      },
    })

    const balance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()
    assert.isNull(balance)
  })

  test('should list invoice history and show single invoice details', async ({ client }) => {
    await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Padaria Central Ltda',
      tradeName: 'Padaria Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'history@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas History',
    })

    const processRes = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230912345678000195650010000001231000004444',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=hist',
        issuerState: 'SC',
        issuerCnpj: '12345678000195',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 30.0,
        items: [
          { rawDescription: 'Bolo de Cenoura', quantity: 1, unitPrice: 30.0, totalPrice: 30.0 },
        ],
      })

    const invoiceId = processRes.body().data.invoice.id

    // Lista todas
    const listRes = await client.get('/api/v1/customer/invoices').loginAs(user)
    listRes.assertStatus(200)
    listRes.assertBodyContains({
      data: [{ id: invoiceId, status: 'PROCESSED' }],
    })

    // Mostra detalhes
    const showRes = await client.get(`/api/v1/customer/invoices/${invoiceId}`).loginAs(user)
    showRes.assertStatus(200)
    showRes.assertBodyContains({
      data: {
        id: invoiceId,
        items: [{ rawDescription: 'Bolo de Cenoura' }],
      },
    })
  })

  test('should block establishment users from submitting customer invoices', async ({ client }) => {
    const user = await User.create({
      email: 'lojista@example.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: user.id,
      fullName: 'Lojista Dono',
    })

    const response = await client
      .post('/api/v1/customer/invoices/process')
      .loginAs(user)
      .json({
        accessKey: '42230912345678000195650010000001231000003333',
        qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=333',
        issuerState: 'SC',
        issuerCnpj: '12345678000195',
        issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
        totalAmount: 50.0,
      })

    response.assertStatus(403)
  })
})
