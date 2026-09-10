import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Roles válidas na plataforma, mapeadas aos valores das colunas
 * `users.user_type` e `user_establishments.role`.
 */
export type AllowedRole = 'SUPER_ADMIN' | 'LOJISTA_ADMIN' | 'LOJISTA_OPERADOR' | 'CUSTOMER'

/**
 * RoleMiddleware
 *
 * Primeira barreira de autorização por papel (RBAC) aplicada diretamente
 * nos grupos de rotas. Deve ser usado APÓS o middleware `auth`, pois
 * depende do usuário autenticado estar disponível em `ctx.auth.user`.
 *
 * Lógica de verificação:
 *  - `SUPER_ADMIN` → verifica `user.userType === 'SUPER_ADMIN'`
 *  - `CUSTOMER`    → verifica `user.userType === 'CUSTOMER'`
 *  - `LOJISTA_*`   → verifica `user.userType === 'ESTABLISHMENT'` E
 *                    `user.establishmentProfile.role` está na lista permitida.
 *
 * Uso no `start/routes.ts`:
 * ```ts
 * .use([middleware.auth(), middleware.role(['LOJISTA_ADMIN', 'LOJISTA_OPERADOR'])])
 * ```
 *
 * Em caso de falha, lança uma exceção `E_AUTHORIZATION_FAILURE` (403).
 */
export default class RoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: AllowedRole[] | { roles: AllowedRole[] } = []
  ) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({ message: 'Autenticação necessária.' })
    }

    const roles: AllowedRole[] = Array.isArray(options) ? options : (options?.roles ?? [])

    // Carrega o perfil de estabelecimento apenas se necessário para lojistas
    const needsEstablishmentProfile = roles.some(
      (r) => r === 'LOJISTA_ADMIN' || r === 'LOJISTA_OPERADOR'
    )

    if (needsEstablishmentProfile && user.userType === 'ESTABLISHMENT') {
      await user.load((loader) => loader.load('establishmentProfile'))
    }

    const isAuthorized = roles.some((allowedRole) => {
      switch (allowedRole) {
        case 'SUPER_ADMIN':
          return user.userType === 'SUPER_ADMIN'

        case 'CUSTOMER':
          return user.userType === 'CUSTOMER'

        case 'LOJISTA_ADMIN':
          return (
            user.userType === 'ESTABLISHMENT' && user.establishmentProfile?.role === 'LOJISTA_ADMIN'
          )

        case 'LOJISTA_OPERADOR':
          return (
            user.userType === 'ESTABLISHMENT' &&
            user.establishmentProfile?.role === 'LOJISTA_OPERADOR'
          )

        default:
          return false
      }
    })

    if (!isAuthorized) {
      return ctx.response.forbidden({
        errors: [
          {
            message: 'Acesso negado. Você não possui permissão para acessar este recurso.',
          },
        ],
      })
    }

    return next()
  }
}
