import type PointTransaction from '#models/point_transaction'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PointTransactionTransformer extends BaseTransformer<PointTransaction> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'customerId',
      'establishmentId',
      'invoiceId',
      'type',
      'points',
      'purchaseAmount',
      'appliedConversionFactor',
      'description',
      'metadata',
      'createdAt',
    ])
  }
}
