import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Functional | Profile & Logout', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should return authenticated user profile when token is provided', async ({ client }) => {
    const user = await User.create({
      email: 'profile@example.com',
      password: 'password123',
    })

    const response = await client
      .get('/api/v1/account/profile')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        email: 'profile@example.com',
      },
    })
  })

  test('should return 401 unauthorized when accessing profile without token', async ({ client }) => {
    const response = await client.get('/api/v1/account/profile')

    response.assertStatus(401)
  })

  test('should logout authenticated user and revoke access token', async ({ client, assert }) => {
    const user = await User.create({
      email: 'logout@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/account/logout')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Logged out successfully',
    })

    const tokens = await User.accessTokens.all(user)
    assert.lengthOf(tokens, 0)
  })
})
