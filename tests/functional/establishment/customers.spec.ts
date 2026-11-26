import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import UserEstablishment from '#models/user_establishment'
import Establishment from '#models/establishment'
import PointBalance from '#models/point_balance'

test.group('Functional | Establishment Customers Privacy Filter (Task #8 & RN08)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should list only customers who scored at the authenticated establishment without exposing CPF', async ({
    client,
    assert,
  }) => {
    const estA = await Establishment.create({
      cnpj: '11111111000111',
      legalName: 'Loja A Ltda',
      tradeName: 'Loja A',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const estB = await Establishment.create({
      cnpj: '22222222000122',
      legalName: 'Loja B Ltda',
      tradeName: 'Loja B',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const merchantUserA = await User.create({
      email: 'lojista.a@test.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
    })
    await UserEstablishment.create({
      userId: merchantUserA.id,
      establishmentId: estA.id,
      fullName: 'Gestor A',
      role: 'LOJISTA_ADMIN',
    })

    const c1User = await User.create({
      email: 'maria@test.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
    })
    const c1 = await UserCustomer.create({
      userId: c1User.id,
      fullName: 'Maria Silva',
      cpf: '12345678901',
      phone: '48999991111',
      deviceToken: 'secret_fcm_token',
    })

    const c2User = await User.create({
      email: 'joao@test.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
    })
    const c2 = await UserCustomer.create({
      userId: c2User.id,
      fullName: 'João Souza',
      cpf: '98765432100',
      phone: '41988882222',
    })

    await PointBalance.create({
      customerId: c1.id,
      establishmentId: estA.id,
      currentBalance: 120,
      totalAccumulated: 200,
    })

    await PointBalance.create({
      customerId: c2.id,
      establishmentId: estB.id,
      currentBalance: 50,
      totalAccumulated: 50,
    })

    const response = await client.get('/api/v1/establishment/customers').loginAs(merchantUserA)

    response.assertStatus(200)
    const data = response.body().data as any[]
    assert.lengthOf(data, 1)
    assert.equal(data[0].fullName, 'Maria Silva')
    assert.equal(data[0].email, 'maria@test.com')
    assert.equal(data[0].phone, '48999991111')
    assert.equal(data[0].currentBalance, 120)
    assert.equal(data[0].totalAccumulated, 200)
    assert.notProperty(data[0], 'cpf')
    assert.notProperty(data[0], 'deviceToken')
  })

  test('should support ?search= filter and block non-establishment users', async ({
    client,
    assert,
  }) => {
    const est = await Establishment.create({
      cnpj: '33333333000133',
      legalName: 'Loja C Ltda',
      tradeName: 'Loja C',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const merchant = await User.create({
      email: 'lojista.c@test.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
    })
    await UserEstablishment.create({
      userId: merchant.id,
      establishmentId: est.id,
      fullName: 'Operador C',
      role: 'LOJISTA_OPERADOR',
    })

    const u1 = await User.create({
      email: 'ana@test.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
    })
    const c1 = await UserCustomer.create({ userId: u1.id, fullName: 'Ana Clara' })

    const u2 = await User.create({
      email: 'bruno@test.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
    })
    const c2 = await UserCustomer.create({ userId: u2.id, fullName: 'Bruno Lima' })

    await PointBalance.create({
      customerId: c1.id,
      establishmentId: est.id,
      currentBalance: 10,
      totalAccumulated: 10,
    })
    await PointBalance.create({
      customerId: c2.id,
      establishmentId: est.id,
      currentBalance: 20,
      totalAccumulated: 20,
    })

    const searchRes = await client
      .get('/api/v1/establishment/customers?search=ana')
      .loginAs(merchant)
    searchRes.assertStatus(200)
    assert.lengthOf(searchRes.body().data, 1)
    assert.equal(searchRes.body().data[0].fullName, 'Ana Clara')

    const customerForbidden = await client.get('/api/v1/establishment/customers').loginAs(u1)
    customerForbidden.assertStatus(403)

    const unauth = await client.get('/api/v1/establishment/customers')
    unauth.assertStatus(401)
  })
})
