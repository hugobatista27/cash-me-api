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

const CustomerInvoicesController = () => import('#controllers/customer_invoices_controller')
const CustomerPointsController = () => import('#controllers/customer_points_controller')
const EstablishmentsController = () => import('#controllers/establishments_controller')
const EstablishmentRulesController = () => import('#controllers/establishment_rules_controller')

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

    // Rotas do Consumidor (NFC-e e Pontos)
    router
      .group(() => {
        router.post('invoices/process', [CustomerInvoicesController, 'process'])
        router.get('invoices', [CustomerInvoicesController, 'index'])
        router.get('invoices/:id', [CustomerInvoicesController, 'show'])
        router.get('balances', [CustomerPointsController, 'balances'])
        router.get('establishments/:establishmentId/statement', [CustomerPointsController, 'statement'])
      })
      .prefix('customer')
      .as('customer')
      .use(middleware.auth())

    // Rotas de Estabelecimentos
    router
      .group(() => {
        router.get('/', [EstablishmentsController, 'index'])
        router.get('/:id', [EstablishmentsController, 'show'])
        router.post('/', [EstablishmentsController, 'store'])
        router.put('/:id', [EstablishmentsController, 'update'])
      })
      .prefix('establishments')
      .as('establishments')

    // Rotas de Regras de Fidelidade do Lojista (Task #6)
    router
      .group(() => {
        router.get('loyalty-rule', [EstablishmentRulesController, 'show'])
        router.get('loyalty-rule/simulate', [EstablishmentRulesController, 'simulate'])
        router.get('loyalty-rule/history', [EstablishmentRulesController, 'history'])
        router
          .put('loyalty-rule', [EstablishmentRulesController, 'update'])
          .use(middleware.role(['LOJISTA_ADMIN', 'SUPER_ADMIN']))
      })
      .prefix('establishment')
      .as('establishment')
      .use([middleware.auth(), middleware.role(['LOJISTA_ADMIN', 'LOJISTA_OPERADOR', 'SUPER_ADMIN'])])
  })
  .prefix('/api/v1')

