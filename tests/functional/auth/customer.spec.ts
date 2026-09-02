import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserCustomer from '#models/user_customer'

test.group('Functional | Customer Auth & Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should register new customer account with profile and return access token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/customer/signup').json({
      fullName: 'Maria Silva',
      email: 'maria@gmail.com',
      password: 'password123',
      passwordConfirmation: 'password123',
      cpf: '12345678901',
      phone: '47999991111',
      termsAccepted: true,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'maria@gmail.com',
          userType: 'CUSTOMER',
        },
        profile: {
          fullName: 'Maria Silva',
          cpf: '12345678901',
        },
      },
    })
    assert.properties(response.body().data, ['token', 'user', 'profile'])

    const user = await User.findBy('email', 'maria@gmail.com')
    assert.isNotNull(user)
    const profile = await UserCustomer.findBy('userId', user!.id)
    assert.isNotNull(profile)
    assert.equal(profile!.fullName, 'Maria Silva')
  })

  test('should fetch customer profile for authenticated user', async ({ client }) => {
    const user = await User.create({
      email: 'customer@gmail.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    await UserCustomer.create({
      userId: user.id,
      fullName: 'Carlos Santos',
    })

    const response = await client
      .get('/api/v1/account/customer/profile')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        profile: {
          fullName: 'Carlos Santos',
        },
      },
    })
  })

  test('should update customer profile details', async ({ client, assert }) => {
    const user = await User.create({
      email: 'customer.update@gmail.com',
      password: 'password123',
      userType: 'CUSTOMER',
    })
    const profile = await UserCustomer.create({
      userId: user.id,
      fullName: 'Old Name',
    })

    const response = await client
      .put('/api/v1/account/customer/profile')
      .loginAs(user)
      .json({
        fullName: 'New Name',
        phone: '47988887777',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        profile: {
          fullName: 'New Name',
          phone: '47988887777',
        },
      },
    })

    await profile.refresh()
    assert.equal(profile.fullName, 'New Name')
  })
})
