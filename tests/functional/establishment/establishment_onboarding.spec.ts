import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Establishment from '#models/establishment'
import EstablishmentAddress from '#models/establishment_address'
import UserEstablishment from '#models/user_establishment'
import LoyaltyProgram from '#models/loyalty_program'
import PointRule from '#models/point_rule'

test.group('Functional | Establishment Onboarding & Management', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should register a new commerce atomically with user, establishment, address and initial loyalty program', async ({
    client,
    assert,
  }) => {
    const payload = {
      user: {
        fullName: 'Mariana Souza',
        email: 'mariana@padariapaoquentinho.com.br',
        password: 'Password@123',
        passwordConfirmation: 'Password@123',
      },
      establishment: {
        cnpj: '12.345.678/0001-95',
        legalName: 'Padaria Pão Quentinho Ltda',
        tradeName: 'Padaria Pão Quentinho',
        conversionFactor: 1.0,
        contact: {
          phone: '4832220000',
          whatsapp: '48999990000',
          email: 'contato@padariapaoquentinho.com.br',
          website: 'https://paoquentinho.com.br',
          instagram: '@paoquentinhofloripa',
          socialLinks: {
            facebook: 'https://facebook.com/paoquentinho',
          },
        },
      },
      address: {
        postalCode: '88010-000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Centro',
        street: 'Rua Felipe Schmidt',
        number: '515',
        complement: 'Loja 02',
        reference: 'Em frente à praça central',
        latitude: -27.5969,
        longitude: -48.5495,
      },
    }

    const response = await client.post('/api/v1/auth/establishment/register').json(payload)

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        message: 'Comércio cadastrado com sucesso. Sua conta está pendente de homologação.',
        user: {
          email: 'mariana@padariapaoquentinho.com.br',
          userType: 'ESTABLISHMENT',
          status: 'ACTIVE',
        },
        profile: {
          fullName: 'Mariana Souza',
          role: 'LOJISTA_ADMIN',
        },
        establishment: {
          cnpj: '12345678000195',
          legalName: 'Padaria Pão Quentinho Ltda',
          tradeName: 'Padaria Pão Quentinho',
          status: 'PENDING',
          conversionFactor: 1.0,
          phone: '4832220000',
          whatsapp: '48999990000',
          address: {
            postalCode: '88010000',
            state: 'SC',
            city: 'Florianópolis',
            street: 'Rua Felipe Schmidt',
            number: '515',
          },
        },
      },
    })

    assert.isNotNull(response.body().data.token)

    // Verificações no banco de dados
    const user = await User.findByOrFail('email', 'mariana@padariapaoquentinho.com.br')
    const establishment = await Establishment.findByOrFail('cnpj', '12345678000195')
    assert.equal(establishment.status, 'PENDING') // RN06

    const address = await EstablishmentAddress.findByOrFail('establishmentId', establishment.id)
    assert.equal(address.city, 'Florianópolis')
    assert.equal(address.state, 'SC')
    assert.equal(address.postalCode, '88010000')

    const profile = await UserEstablishment.findByOrFail('userId', user.id)
    assert.equal(profile.establishmentId, establishment.id)
    assert.equal(profile.role, 'LOJISTA_ADMIN')

    const loyaltyProgram = await LoyaltyProgram.findByOrFail('establishmentId', establishment.id)
    assert.equal(loyaltyProgram.status, 'ACTIVE')

    const pointRule = await PointRule.findByOrFail('loyaltyProgramId', loyaltyProgram.id)
    assert.equal(pointRule.version, 1)
  })

  test('should also register commerce via /api/v1/auth/establishment/signup when establishment payload is present', async ({
    client,
    assert,
  }) => {
    const payload = {
      user: {
        fullName: 'Carlos Lojista',
        email: 'carlos@minimercado.com',
        password: 'Password@123',
        passwordConfirmation: 'Password@123',
      },
      establishment: {
        cnpj: '98.765.432/0001-10',
        legalName: 'Mini Mercado Central Ltda',
        tradeName: 'Mini Mercado Central',
      },
    }

    const response = await client.post('/api/v1/auth/establishment/signup').json(payload)

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        establishment: {
          cnpj: '98765432000110',
          tradeName: 'Mini Mercado Central',
          status: 'PENDING',
        },
      },
    })

    const establishment = await Establishment.findBy('cnpj', '98765432000110')
    assert.isNotNull(establishment)
  })

  test('should prevent duplicate CNPJ registration', async ({ client }) => {
    await Establishment.create({
      cnpj: '11111111000111',
      legalName: 'Loja Exemplo Ltda',
      tradeName: 'Loja Exemplo',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    const payload = {
      user: {
        fullName: 'Outro Usuario',
        email: 'outro@loja.com',
        password: 'Password@123',
        passwordConfirmation: 'Password@123',
      },
      establishment: {
        cnpj: '11.111.111/0001-11',
        legalName: 'Loja Tentativa Ltda',
        tradeName: 'Loja Tentativa',
      },
    }

    const response = await client.post('/api/v1/auth/establishment/register').json(payload)
    response.assertStatus(422)
  })

  test('should allow SUPER_ADMIN to approve a pending establishment (RN06)', async ({ client, assert }) => {
    // 1. Cria usuário Super Admin
    const superAdminUser = await User.create({
      email: 'admin@cashme.com',
      password: 'Password@123',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE',
    })
    await UserEstablishment.create({
      userId: superAdminUser.id,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    })

    // 2. Cria usuário Lojista Comum (não admin)
    const lojistaUser = await User.create({
      email: 'lojista@store.com',
      password: 'Password@123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
    })
    await UserEstablishment.create({
      userId: lojistaUser.id,
      fullName: 'Lojista Comum',
      role: 'LOJISTA_ADMIN',
    })

    // 3. Cria estabelecimento pendente
    const establishment = await Establishment.create({
      cnpj: '22222222000122',
      legalName: 'Comercio Pendente Ltda',
      tradeName: 'Comercio Pendente',
      status: 'PENDING',
      conversionFactor: 1.0,
    })

    // 4. Tentativa de aprovação sem ser Super Admin -> 403 Forbidden
    const forbiddenResponse = await client
      .patch(`/api/v1/establishments/${establishment.id}/approve`)
      .loginAs(lojistaUser)
      .json({ status: 'ACTIVE' })

    forbiddenResponse.assertStatus(403)

    // 5. Aprovação com Super Admin -> 200 OK
    const approvalResponse = await client
      .patch(`/api/v1/establishments/${establishment.id}/approve`)
      .loginAs(superAdminUser)
      .json({ status: 'ACTIVE' })

    approvalResponse.assertStatus(200)
    approvalResponse.assertBodyContains({
      data: {
        id: establishment.id,
        status: 'ACTIVE',
      },
    })

    await establishment.refresh()
    assert.equal(establishment.status, 'ACTIVE')
  })

  test('should fetch and update establishment address directly', async ({ client, assert }) => {
    const establishment = await Establishment.create({
      cnpj: '33333333000133',
      legalName: 'Loja Local Ltda',
      tradeName: 'Loja Local',
      status: 'ACTIVE',
      conversionFactor: 1.0,
    })

    // Criação inicial do endereço via PUT
    const updateResponse = await client.put(`/api/v1/establishments/${establishment.id}/address`).json({
      postalCode: '88015-100',
      state: 'SC',
      city: 'Florianópolis',
      neighborhood: 'Agronômica',
      street: 'Rua Beira Mar Norte',
      number: '1000',
    })

    updateResponse.assertStatus(200)
    updateResponse.assertBodyContains({
      data: {
        city: 'Florianópolis',
        state: 'SC',
        postalCode: '88015100',
      },
    })

    // Consulta de endereço
    const getResponse = await client.get(`/api/v1/establishments/${establishment.id}/address`)
    getResponse.assertStatus(200)
    getResponse.assertBodyContains({
      data: {
        establishmentId: establishment.id,
        city: 'Florianópolis',
        street: 'Rua Beira Mar Norte',
      },
    })

    // Atualização parcial de endereço
    const patchResponse = await client.put(`/api/v1/establishments/${establishment.id}/address`).json({
      number: '2000',
      complement: 'Bloco B',
    })

    patchResponse.assertStatus(200)
    patchResponse.assertBodyContains({
      data: {
        number: '2000',
        complement: 'Bloco B',
      },
    })

    const address = await EstablishmentAddress.findByOrFail('establishmentId', establishment.id)
    assert.equal(address.number, '2000')
    assert.equal(address.complement, 'Bloco B')
  })
})
