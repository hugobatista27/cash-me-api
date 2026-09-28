import User from '#models/user'
import UserEstablishment from '#models/user_establishment'
import { signupEstablishmentValidator, updateEstablishmentValidator } from '#validators/user_establishment'
import { onboardingEstablishmentValidator } from '#validators/establishment_validator'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import UserEstablishmentTransformer from '#transformers/user_establishment_transformer'
import EstablishmentTransformer from '#transformers/establishment_transformer'
import EstablishmentOnboardingService from '#services/establishment_onboarding_service'

export default class UserEstablishmentsController {
  private onboardingService = new EstablishmentOnboardingService()

  /**
   * @register
   * @summary Cadastro e criação de conta do comércio (Onboarding Atômico)
   * @requestBody {"user": {"fullName": "Mariana Souza", "email": "mariana@loja.com", "password": "password123", "passwordConfirmation": "password123"}, "establishment": {"cnpj": "12345678000195", "legalName": "Loja Ltda", "tradeName": "Minha Loja", "conversionFactor": 1.0, "contact": {"phone": "4832220000", "whatsapp": "48999990000", "email": "contato@loja.com", "website": "https://loja.com", "instagram": "@minhaloja"}}, "address": {"postalCode": "88010000", "state": "SC", "city": "Florianópolis", "neighborhood": "Centro", "street": "Rua Felipe Schmidt", "number": "100"}}
   * @responseBody 201 - {"message": "Comércio cadastrado com sucesso. Sua conta está pendente de homologação.", "user": {"id": 1, "email": "mariana@loja.com", "userType": "ESTABLISHMENT", "status": "ACTIVE"}, "profile": {"id": 1, "fullName": "Mariana Souza", "role": "LOJISTA_ADMIN"}, "establishment": {"id": 1, "cnpj": "12345678000195", "tradeName": "Minha Loja", "status": "PENDING"}, "token": "oat_..."}
   */
  async register({ request, serialize, response }: HttpContext) {
    const payload = await request.validateUsing(onboardingEstablishmentValidator)
    const result = await this.onboardingService.register(payload)

    response.status(201)
    return serialize({
      message: 'Comércio cadastrado com sucesso. Sua conta está pendente de homologação.',
      user: UserTransformer.transform(result.user),
      profile: UserEstablishmentTransformer.transform(result.profile),
      establishment: EstablishmentTransformer.transform(result.establishment),
      token: result.token,
    })
  }

  /**
   * @store
   * @summary Cadastrar novo usuário Lojista ou Onboarding Completo do Comércio
   * @requestBody {"fullName": "Carlos Lojista", "email": "carlos@loja.com", "password": "password123", "passwordConfirmation": "password123", "role": "LOJISTA_ADMIN"}
   * @responseBody 201 - {"user": {"id": 1, "email": "carlos@loja.com", "userType": "ESTABLISHMENT", "status": "ACTIVE"}, "profile": {"id": 1, "fullName": "Carlos Lojista", "role": "LOJISTA_ADMIN"}, "token": "oat_..."}
   */
  async store({ request, serialize, response }: HttpContext) {
    // Se a requisição contiver a chave "establishment", executa o onboarding completo
    if (request.input('establishment')) {
      const payload = await request.validateUsing(onboardingEstablishmentValidator)
      const result = await this.onboardingService.register(payload)

      response.status(201)
      return serialize({
        message: 'Comércio cadastrado com sucesso. Sua conta está pendente de homologação.',
        user: UserTransformer.transform(result.user),
        profile: UserEstablishmentTransformer.transform(result.profile),
        establishment: EstablishmentTransformer.transform(result.establishment),
        token: result.token,
      })
    }

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
   * @show
   * @summary Obter perfil do Lojista autenticado
   * @responseBody 200 - {"user": {"id": 1, "email": "carlos@loja.com"}, "profile": {"id": 1, "fullName": "Carlos Lojista", "role": "LOJISTA_ADMIN"}}
   */
  async show({ auth, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('establishmentProfile')

    if (!user.establishmentProfile) {
      return response.notFound({ message: 'Establishment profile not found' })
    }

    if (user.establishmentProfile.establishmentId) {
      await user.establishmentProfile.load('establishment', (query) => {
        query.preload('address')
      })
    }

    return serialize({
      user: UserTransformer.transform(user),
      profile: UserEstablishmentTransformer.transform(user.establishmentProfile),
    })
  }

  /**
   * @update
   * @summary Atualizar perfil do Lojista autenticado
   * @requestBody {"fullName": "Carlos Silva Lojista", "role": "LOJISTA_ADMIN"}
   * @responseBody 200 - {"profile": {"id": 1, "fullName": "Carlos Silva Lojista", "role": "LOJISTA_ADMIN"}}
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