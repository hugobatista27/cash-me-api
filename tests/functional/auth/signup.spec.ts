import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Functional | Auth Signup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('should create a new user account and return access token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/signup').json({
      email: 'newuser@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'newuser@example.com',
        },
      },
    })
    assert.properties(response.body().data, ['token', 'user'])

    const createdUser = await User.findBy('email', 'newuser@example.com')
    assert.isNotNull(createdUser)
  })

  test('should fail signup when email is already taken', async ({ client }) => {
    await User.create({
      email: 'existing@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/v1/auth/signup').json({
      email: 'existing@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    response.assertStatus(422)
  })

  test('should fail signup when password confirmation does not match', async ({ client }) => {
    const response = await client.post('/api/v1/auth/signup').json({
      email: 'mismatch@example.com',
      password: 'password123',
      passwordConfirmation: 'differentpassword',
    })

    response.assertStatus(422)
  })
})
