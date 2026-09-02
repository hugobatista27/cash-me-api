import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Functional | Auth Login', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should login user with valid credentials and return access token', async ({ client, assert }) => {
    await User.create({
      email: 'user@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/v1/auth/login').json({
      email: 'user@example.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'user@example.com',
        },
      },
    })
    assert.properties(response.body().data, ['token', 'user'])
  })

  test('should fail login with invalid password', async ({ client }) => {
    await User.create({
      email: 'user@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/v1/auth/login').json({
      email: 'user@example.com',
      password: 'wrongpassword',
    })

    response.assertStatus(400)
  })

  test('should fail login with non-existent email', async ({ client }) => {
    const response = await client.post('/api/v1/auth/login').json({
      email: 'nonexistent@example.com',
      password: 'password123',
    })

    response.assertStatus(400)
  })
})
