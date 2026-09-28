import type PointBalance from '#models/point_balance'
import { BaseTransformer } from '@adonisjs/core/transformers'
import EstablishmentTransformer from '#transformers/establishment_transformer'

export default class PointBalanceTransformer extends BaseTransformer<PointBalance> {
  toObject() {
    const data: Record<string, any> = this.pick(this.resource, [
      'id',
      'customerId',
      'establishmentId',
      'currentBalance',
      'totalAccumulated',
      'createdAt',
      'updatedAt',
    ])

    if (this.resource.establishment) {
      data.establishment = EstablishmentTransformer.transform(this.resource.establishment)
    }

    return data
  }
}
