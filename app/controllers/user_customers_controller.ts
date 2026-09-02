import User from '#models/user'
import UserCustomer from '#models/user_customer'
import { signupCustomerValidator, updateCustomerValidator } from '#validators/user_customer'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import UserCustomerTransformer from '#transformers/user_customer_transformer'
import { DateTime } from 'luxon'

export default class UserCustomersController {
  /**
   * Register a new consumer account (User + UserCustomer profile)
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
   * Get current authenticated consumer profile
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
   * Update authenticated consumer profile
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