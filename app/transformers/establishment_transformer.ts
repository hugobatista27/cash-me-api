import type Establishment from '#models/establishment'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class EstablishmentTransformer extends BaseTransformer<Establishment> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'cnpj',
      'legalName',
      'tradeName',
      'status',
      'conversionFactor',
      'createdAt',
      'updatedAt',
    ])
  }
}
