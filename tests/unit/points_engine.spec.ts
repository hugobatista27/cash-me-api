import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import PointsEngineService, { DuplicateInvoiceException } from '#services/points_engine_service'
import Establishment from '#models/establishment'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import Invoice from '#models/invoice'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import { DateTime } from 'luxon'

test.group('Unit | Points Engine Service', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('computePoints should calculate integer points rounded down', ({ assert }) => {
    const service = new PointsEngineService()

    // Regra R$ 1,00 = 1 Ponto (fator 1.0)
    assert.equal(service.computePoints(100.0, 1.0), 100)
    assert.equal(service.computePoints(99.99, 1.0), 99)

    // Regra R$ 10,00 = 1 Ponto (fator 0.1)
    assert.equal(service.computePoints(100.0, 0.1), 10)
    assert.equal(service.computePoints(99.0, 0.1), 9)
    assert.equal(service.computePoints(9.99, 0.1), 0)

    // Regra dobro de pontos (fator 2.0)
    assert.equal(service.computePoints(50.5, 2.0), 101)

    // Valores negativos ou nulos
    assert.equal(service.computePoints(0, 1.0), 0)
    assert.equal(service.computePoints(-10, 1.0), 0)
  })

  test('should process valid invoice and credit points atomically', async ({ assert }) => {
    const service = new PointsEngineService()

    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'customer.test@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })

    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Ana Clara',
    })

    const result = await service.processInvoice(customer, {
      accessKey: '42230912345678000195650010000001231000001234',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=123',
      issuerState: 'SC',
      issuerCnpj: '12.345.678/0001-95',
      issuedAt: DateTime.now().minus({ hours: 2 }).toISO(),
      totalAmount: 154.5,
      items: [
        { rawDescription: 'Arroz 5kg', quantity: 1, unitPrice: 30.0, totalPrice: 30.0 },
        { rawDescription: 'Azeite', quantity: 2, unitPrice: 62.25, totalPrice: 124.5 },
      ],
    })

    assert.equal(result.status, 'PROCESSED')
    assert.equal(result.pointsAwarded, 154)
    assert.isNull(result.rejectionReason)

    // Verifica invoice no banco
    const invoice = await Invoice.findBy(
      'accessKey',
      '42230912345678000195650010000001231000001234'
    )
    assert.isNotNull(invoice)
    assert.equal(invoice!.status, 'PROCESSED')
    assert.equal(Number(invoice!.pointsAwarded), 154)

    // Verifica itens
    await invoice!.load('items')
    assert.lengthOf(invoice!.items, 2)

    // Verifica saldo
    const balance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()
    assert.isNotNull(balance)
    assert.equal(Number(balance!.currentBalance), 154)
    assert.equal(Number(balance!.totalAccumulated), 154)

    // Verifica extrato
    const tx = await PointTransaction.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()
    assert.isNotNull(tx)
    assert.equal(tx!.type, 'CREDIT')
    assert.equal(Number(tx!.points), 154)
  })

  test('should reject invoice if issued more than 48 hours ago (RN01)', async ({ assert }) => {
    const service = new PointsEngineService()

    await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'customer.rn01@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Lima',
    })

    const result = await service.processInvoice(customer, {
      accessKey: '42230912345678000195650010000009991000009999',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=999',
      issuerState: 'SC',
      issuerCnpj: '12345678000195',
      issuedAt: DateTime.now().minus({ hours: 50 }).toISO(),
      totalAmount: 100.0,
    })

    assert.equal(result.status, 'REJECTED')
    assert.equal(result.rejectionReason, 'EXPIRED_48H')
    assert.equal(result.pointsAwarded, 0)

    const balances = await PointBalance.query().where('customerId', customer.id)
    assert.lengthOf(balances, 0)
  })

  test('should reject invoice if issuer state is outside SC or PR (RN07)', async ({ assert }) => {
    const service = new PointsEngineService()

    const user = await User.create({
      email: 'customer.rn07@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Lima',
    })

    const result = await service.processInvoice(customer, {
      accessKey: '35230912345678000195650010000009991000008888',
      qrCodeUrl: 'https://nfe.fazenda.sp.gov.br/nfce/qrcode?p=888',
      issuerState: 'SP',
      issuerCnpj: '12345678000195',
      issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
      totalAmount: 100.0,
    })

    assert.equal(result.status, 'REJECTED')
    assert.equal(result.rejectionReason, 'UNSUPPORTED_STATE')
    assert.equal(result.pointsAwarded, 0)
  })

  test('should reject invoice if establishment does not exist (RN03)', async ({ assert }) => {
    const service = new PointsEngineService()

    const user = await User.create({
      email: 'customer.rn03@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Lima',
    })

    const result = await service.processInvoice(customer, {
      accessKey: '42230900000000000195650010000009991000007777',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=777',
      issuerState: 'SC',
      issuerCnpj: '99999999000199',
      issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
      totalAmount: 100.0,
    })

    assert.equal(result.status, 'REJECTED')
    assert.equal(result.rejectionReason, 'ESTABLISHMENT_NOT_FOUND')
  })

  test('should reject invoice if establishment is inactive and keep previous balance (RN05)', async ({
    assert,
  }) => {
    const service = new PointsEngineService()

    const establishment = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Loja Inativa Ltda',
      tradeName: 'Loja Inativa',
      status: 'INACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'customer.rn05@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Lima',
    })

    // Insere um saldo prévio do consumidor nessa loja
    await PointBalance.create({
      customerId: customer.id,
      establishmentId: establishment.id,
      currentBalance: 50,
      totalAccumulated: 50,
    })

    const result = await service.processInvoice(customer, {
      accessKey: '42230912345678000195650010000009991000006666',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=666',
      issuerState: 'PR',
      issuerCnpj: '12345678000195',
      issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
      totalAmount: 200.0,
    })

    assert.equal(result.status, 'REJECTED')
    assert.equal(result.rejectionReason, 'INACTIVE_ESTABLISHMENT')

    // Saldo histórico não pode ter sido modificado (Direito Adquirido)
    const balance = await PointBalance.query()
      .where('customerId', customer.id)
      .where('establishmentId', establishment.id)
      .first()
    assert.equal(Number(balance!.currentBalance), 50)
    assert.equal(Number(balance!.totalAccumulated), 50)
  })

  test('should throw DuplicateInvoiceException on duplicate accessKey (RN02)', async ({
    assert,
  }) => {
    const service = new PointsEngineService()

    await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const user = await User.create({
      email: 'customer.rn02@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const customer = await UserCustomer.create({
      userId: user.id,
      fullName: 'Lucas Lima',
    })

    const payload = {
      accessKey: '42230912345678000195650010000001231000005555',
      qrCodeUrl: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=555',
      issuerState: 'SC',
      issuerCnpj: '12345678000195',
      issuedAt: DateTime.now().minus({ hours: 1 }).toISO(),
      totalAmount: 100.0,
    }

    await service.processInvoice(customer, payload)

    await assert.rejects(() => service.processInvoice(customer, payload), DuplicateInvoiceException)
  })
})
