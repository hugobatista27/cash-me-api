import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import { signupEstablishmentValidator, updateEstablishmentValidator } from '#validators/user_establishment'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import UserEstablishmentTransformer from '#transformers/user_establishment_transformer'

export default class UserEstablishmentsController {
  /**
   * Register a new establishment user account (User + UserEstablishment profile)
   */
  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(signupEstablishmentValidator)

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
    })

    const establishmentProfile = await UserEstablishment.create({
      userId: user.id,
      fullName: payload.fullName,
      establishmentId: payload.establishmentId,
      role: payload.role || 'LOJISTA_ADMIN',
    })

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      profile: UserEstablishmentTransformer.transform(establishmentProfile),
      token: token.value!.release(),
    })
  }

  /**
   * Get current authenticated establishment user profile
   */
  async show({ auth, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('establishmentProfile')

    if (!user.establishmentProfile) {
      return response.notFound({ message: 'Establishment profile not found' })
    }

    return serialize({
      user: UserTransformer.transform(user),
      profile: UserEstablishmentTransformer.transform(user.establishmentProfile),
    })
  }

  /**
   * Update authenticated establishment user profile
   */
  async update({ auth, request, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('establishmentProfile')

    if (!user.establishmentProfile) {
      return response.notFound({ message: 'Establishment profile not found' })
    }

    const payload = await request.validateUsing(updateEstablishmentValidator)
    user.establishmentProfile.merge(payload)
    await user.establishmentProfile.save()

    return serialize({
      profile: UserEstablishmentTransformer.transform(user.establishmentProfile),
    })
  }
}