import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  /**
   * @store
   * @summary Cadastrar nova conta (básico)
   * @requestBody {"email": "user@example.com", "password": "password123", "passwordConfirmation": "password123"}
   * @responseBody 201 - {"user": {"id": 1, "email": "user@example.com", "userType": "CUSTOMER", "status": "ACTIVE"}, "token": "oat_..."}
   */
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({ email, password })
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
