import type Invoice from '#models/invoice'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class InvoiceTransformer extends BaseTransformer<Invoice> {
  toObject() {
    const data: Record<string, any> = this.pick(this.resource, [
      'id',
      'customerId',
      'establishmentId',
      'accessKey',
      'qrCodeUrl',
      'issuerState',
      'issuerCnpj',
      'issuedAt',
      'totalAmount',
      'pointsAwarded',
      'status',
      'rejectionReason',
      'createdAt',
      'updatedAt',
    ])

    if (this.resource.items) {
      data.items = this.resource.items
    }

    return data
  }
}
