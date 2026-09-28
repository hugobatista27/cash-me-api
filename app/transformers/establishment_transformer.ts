import type Establishment from '#models/establishment'
import { BaseTransformer } from '@adonisjs/core/transformers'
import EstablishmentAddressTransformer from '#transformers/establishment_address_transformer'

export default class EstablishmentTransformer extends BaseTransformer<Establishment> {
  toObject() {
    const data = this.pick(this.resource, [
      'id',
      'cnpj',
      'legalName',
      'tradeName',
      'status',
      'conversionFactor',
      'phone',
      'whatsapp',
      'email',
      'website',
      'instagram',
      'socialLinks',
      'createdAt',
      'updatedAt',
    ])

    if (this.resource.address) {
      return {
        ...data,
        address: EstablishmentAddressTransformer.transform(this.resource.address),
      }
    }

    return data
  }
}
