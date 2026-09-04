import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  /**
   * @show
   * @summary Obter perfil do usuário autenticado
   * @responseBody 200 - {"id": 1, "email": "user@example.com", "userType": "CUSTOMER", "status": "ACTIVE"}
   */
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
}
