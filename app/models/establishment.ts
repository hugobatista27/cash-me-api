import { EstablishmentSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import UserEstablishment from '#models/user_establishment'
import Invoice from '#models/invoice'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'

export default class Establishment extends EstablishmentSchema {
  @hasMany(() => UserEstablishment)
  declare users: HasMany<typeof UserEstablishment>

  @hasMany(() => Invoice)
  declare invoices: HasMany<typeof Invoice>

  @hasMany(() => PointBalance)
  declare pointBalances: HasMany<typeof PointBalance>

  @hasMany(() => PointTransaction)
  declare pointTransactions: HasMany<typeof PointTransaction>
}
