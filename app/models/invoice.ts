import { InvoiceSchema } from '#database/schema'
import { belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import InvoiceItem from '#models/invoice_item'
import PointTransaction from '#models/point_transaction'

export default class Invoice extends InvoiceSchema {
  @belongsTo(() => UserCustomer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof UserCustomer>

  @belongsTo(() => Establishment, { foreignKey: 'establishmentId' })
  declare establishment: BelongsTo<typeof Establishment>

  @hasMany(() => InvoiceItem)
  declare items: HasMany<typeof InvoiceItem>

  @hasOne(() => PointTransaction, { foreignKey: 'invoiceId' })
  declare pointTransaction: HasOne<typeof PointTransaction>
}
