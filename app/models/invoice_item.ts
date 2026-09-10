import { InvoiceItemSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'

export default class InvoiceItem extends InvoiceItemSchema {
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>
}
