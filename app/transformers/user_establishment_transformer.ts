import type UserEstablishment from '#models/user_establishment'
import { BaseTransformer } from '@adonisjs/core/transformers'
import EstablishmentTransformer from '#transformers/establishment_transformer'

export default class UserEstablishmentTransformer extends BaseTransformer<UserEstablishment> {
  toObject() {
    const data = this.pick(this.resource, [
      'id',
      'userId',
      'establishmentId',
      'fullName',
      'role',
      'createdAt',
      'updatedAt',
    ])

    if (this.resource.establishment) {
      return {
        ...data,
        establishment: EstablishmentTransformer.transform(this.resource.establishment),
      }
    }

    return data
  }
}
