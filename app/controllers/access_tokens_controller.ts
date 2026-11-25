import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import UserCustomerTransformer from '#transformers/user_customer_transformer'
import UserEstablishmentTransformer from '#transformers/user_establishment_transformer'
import EstablishmentTransformer from '#transformers/establishment_transformer'

export default class AccessTokensController {
  /**
   * @store
   * @summary Autenticar usuário (Login)
   * @requestBody {"email": "user@example.com", "password": "password123"}
   * @responseBody 200 - {"user": {"id": 1, "email": "user@example.com", "userType": "CUSTOMER", "status": "ACTIVE"}, "token": "oat_..."}
   */
  async store({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    if (user.status !== 'ACTIVE') {
      return response.forbidden({
        message: 'Sua conta está inativa ou bloqueada.',
      })
    }

    const token = await User.accessTokens.create(user)

    let profile:
      | ReturnType<typeof UserCustomerTransformer.transform>
      | ReturnType<typeof UserEstablishmentTransformer.transform>
      | null = null
    let establishment: ReturnType<typeof EstablishmentTransformer.transform> | null = null

    if (user.userType === 'CUSTOMER') {
      await user.load((loader) => loader.load('customerProfile'))
      if (user.customerProfile) {
        profile = UserCustomerTransformer.transform(user.customerProfile)
      }
    } else if (user.userType === 'ESTABLISHMENT') {
      await user.load((loader) => loader.load('establishmentProfile'))
      if (user.establishmentProfile) {
        if (user.establishmentProfile.establishmentId) {
          await user.establishmentProfile.load('establishment', (query) => {
            query.preload('address')
          })
          if (user.establishmentProfile.establishment) {
            establishment = EstablishmentTransformer.transform(
              user.establishmentProfile.establishment
            )
          }
        }
        profile = UserEstablishmentTransformer.transform(user.establishmentProfile)
      }
    }

    return serialize({
      user: UserTransformer.transform(user),
      ...(profile ? { profile } : {}),
      ...(establishment ? { establishment } : {}),
      token: token.value!.release(),
    })
  }

  /**
   * @destroy
   * @summary Encerrar sessão (Logout)
   * @responseBody 200 - {"message": "Logged out successfully"}
   */
  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
