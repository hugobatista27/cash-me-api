import User from '#models/user'
import UserCustomer from '#models/user_customer'
import { signupCustomerValidator, updateCustomerValidator } from '#validators/user_customer'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import UserCustomerTransformer from '#transformers/user_customer_transformer'
import { DateTime } from 'luxon'

export default class UserCustomersController {
  /**
   * @store
   * @summary Cadastrar novo Consumidor (Customer)
   * @requestBody {"fullName": "Maria Silva", "email": "maria@example.com", "password": "password123", "passwordConfirmation": "password123", "cpf": "12345678901", "phone": "11999999999", "termsAccepted": true}
   * @responseBody 201 - {"user": {"id": 1, "email": "maria@example.com", "userType": "CUSTOMER", "status": "ACTIVE"}, "profile": {"id": 1, "fullName": "Maria Silva", "cpf": "12345678901", "phone": "11999999999"}, "token": "oat_..."}
   */
  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(signupCustomerValidator)

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      userType: 'CUSTOMER',
      status: 'ACTIVE',
    })

    const customerProfile = await UserCustomer.create({
      userId: user.id,
      fullName: payload.fullName,
      cpf: payload.cpf,
      phone: payload.phone,
      authProvider: 'LOCAL',
      termsAcceptedAt: payload.termsAccepted ? DateTime.now() : null,
      deviceToken: payload.deviceToken,
    })

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      profile: UserCustomerTransformer.transform(customerProfile),
      token: token.value!.release(),
    })
  }

  /**
   * @show
   * @summary Obter perfil do Consumidor autenticado
   * @responseBody 200 - {"user": {"id": 1, "email": "maria@example.com"}, "profile": {"id": 1, "fullName": "Maria Silva"}}
   */
  async show({ auth, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('customerProfile')

    if (!user.customerProfile) {
      return response.notFound({ message: 'Customer profile not found' })
    }

    return serialize({
      user: UserTransformer.transform(user),
      profile: UserCustomerTransformer.transform(user.customerProfile),
    })
  }

  /**
   * @update
   * @summary Atualizar perfil do Consumidor autenticado
   * @requestBody {"fullName": "Maria Silva Santos", "phone": "11988888888"}
   * @responseBody 200 - {"profile": {"id": 1, "fullName": "Maria Silva Santos", "phone": "11988888888"}}
   */
  async update({ auth, request, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('customerProfile')

    if (!user.customerProfile) {
      return response.notFound({ message: 'Customer profile not found' })
    }

    const payload = await request.validateUsing(updateCustomerValidator)
    user.customerProfile.merge(payload)
    await user.customerProfile.save()

    return serialize({
      profile: UserCustomerTransformer.transform(user.customerProfile),
    })
  }
}