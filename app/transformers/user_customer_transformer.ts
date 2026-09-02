import type UserCustomer from '#models/user_customer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserCustomerTransformer extends BaseTransformer<UserCustomer> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'userId',
      'fullName',
      'cpf',
      'phone',
      'authProvider',
      'socialId',
      'termsAcceptedAt',
      'deviceToken',
      'createdAt',
      'updatedAt',
    ])
  }
}