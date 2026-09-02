import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import UserCustomer from '#models/user_customer'

test.group('Unit | User models', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should create user identity with default user_type and status', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await user.refresh()

    assert.isNotNull(user.id)
    assert.equal(user.email, 'test@example.com')
    assert.equal(user.userType, 'CUSTOMER')
    assert.equal(user.status, 'ACTIVE')
  })

  test('should create user establishment profile linked to user identity', async ({ assert }) => {
    const user = await User.create({
      email: 'owner@establishment.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })

    const establishmentProfile = await UserEstablishment.create({
      userId: user.id,
      fullName: 'John Owner',
      role: 'LOJISTA_ADMIN',
    })

    assert.isNotNull(establishmentProfile.id)
    assert.equal(establishmentProfile.userId, user.id)
    assert.equal(establishmentProfile.fullName, 'John Owner')

    await user.load('establishmentProfile')
    assert.equal(user.establishmentProfile.fullName, 'John Owner')
  })

  test('should create user customer profile linked to user identity', async ({ assert }) => {
    const user = await User.create({
      email: 'customer@gmail.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })

    const customerProfile = await UserCustomer.create({
      userId: user.id,
      fullName: 'Jane Customer',
      cpf: '12345678901',
      phone: '47999998888',
      authProvider: 'LOCAL',
    })

    assert.isNotNull(customerProfile.id)
    assert.equal(customerProfile.userId, user.id)
    assert.equal(customerProfile.fullName, 'Jane Customer')
    assert.equal(customerProfile.cpf, '12345678901')

    await user.load('customerProfile')
    assert.equal(user.customerProfile.fullName, 'Jane Customer')
  })
})
