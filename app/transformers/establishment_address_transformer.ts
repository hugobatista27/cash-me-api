import type EstablishmentAddress from '#models/establishment_address'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class EstablishmentAddressTransformer extends BaseTransformer<EstablishmentAddress> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'establishmentId',
      'postalCode',
      'state',
      'city',
      'neighborhood',
      'street',
      'number',
      'complement',
      'reference',
      'latitude',
      'longitude',
      'createdAt',
      'updatedAt',
    ])
  }
}
