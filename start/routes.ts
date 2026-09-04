/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'

router.get('/', () => {
  return { hello: 'world' }
})

// Retorna a especificação OpenAPI (JSON)
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Interface gráfica do Swagger UI
router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('customer/signup', [controllers.UserCustomers, 'store'])
        router.post('establishment/signup', [controllers.UserEstablishments, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.get('customer/profile', [controllers.UserCustomers, 'show'])
        router.put('customer/profile', [controllers.UserCustomers, 'update'])
        router.get('establishment/profile', [controllers.UserEstablishments, 'show'])
        router.put('establishment/profile', [controllers.UserEstablishments, 'update'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
