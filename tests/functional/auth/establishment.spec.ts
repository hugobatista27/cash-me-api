import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import UserEstablishment from '#models/user_establishment'

test.group('Functional | Establishment Auth & Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should register new establishment user account with profile and return access token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/establishment/signup').json({
      fullName: 'Manager User',
      email: 'manager@store.com',
      password: 'password123',
      passwordConfirmation: 'password123',
      role: 'LOJISTA_ADMIN',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'manager@store.com',
          userType: 'ESTABLISHMENT',
        },
        profile: {
          fullName: 'Manager User',
          role: 'LOJISTA_ADMIN',
        },
      },
    })
    assert.properties(response.body().data, ['token', 'user', 'profile'])

    const user = await User.findBy('email', 'manager@store.com')
    assert.isNotNull(user)
    const profile = await UserEstablishment.findBy('userId', user!.id)
    assert.isNotNull(profile)
    assert.equal(profile!.fullName, 'Manager User')
  })

  test('should fetch establishment user profile for authenticated user', async ({ client }) => {
    const user = await User.create({
      email: 'operator@store.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    await UserEstablishment.create({
      userId: user.id,
      fullName: 'Operator User',
      role: 'LOJISTA_OPERADOR',
    })

    const response = await client
      .get('/api/v1/account/establishment/profile')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        profile: {
          fullName: 'Operator User',
          role: 'LOJISTA_OPERADOR',
        },
      },
    })
  })

  test('should update establishment user profile details', async ({ client, assert }) => {
    const user = await User.create({
      email: 'update@store.com',
      password: 'password123',
      userType: 'ESTABLISHMENT',
    })
    const profile = await UserEstablishment.create({
      userId: user.id,
      fullName: 'Initial Name',
      role: 'LOJISTA_OPERADOR',
    })

    const response = await client
      .put('/api/v1/account/establishment/profile')
      .loginAs(user)
      .json({
        fullName: 'Updated Name',
        role: 'LOJISTA_ADMIN',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        profile: {
          fullName: 'Updated Name',
          role: 'LOJISTA_ADMIN',
        },
      },
    })

    await profile.refresh()
    assert.equal(profile.fullName, 'Updated Name')
    assert.equal(profile.role, 'LOJISTA_ADMIN')
  })
})
