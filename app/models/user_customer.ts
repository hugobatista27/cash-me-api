import { UserCustomerSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Invoice from '#models/invoice'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'

export default class UserCustomer extends UserCustomerSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Invoice, { foreignKey: 'customerId' })
  declare invoices: HasMany<typeof Invoice>

  @hasMany(() => PointBalance, { foreignKey: 'customerId' })
  declare pointBalances: HasMany<typeof PointBalance>

  @hasMany(() => PointTransaction, { foreignKey: 'customerId' })
  declare pointTransactions: HasMany<typeof PointTransaction>
}
