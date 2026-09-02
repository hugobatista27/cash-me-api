import type UserEstablishment from '#models/user_establishment'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserEstablishmentTransformer extends BaseTransformer<UserEstablishment> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'userId',
      'establishmentId',
      'fullName',
      'role',
      'createdAt',
      'updatedAt',
    ])
  }
}