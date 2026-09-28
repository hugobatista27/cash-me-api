import { EstablishmentSchema } from '#database/schema'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import UserEstablishment from '#models/user_establishment'
import Invoice from '#models/invoice'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import LoyaltyProgram from '#models/loyalty_program'
import PointRule from '#models/point_rule'
import EstablishmentAddress from '#models/establishment_address'

export default class Establishment extends EstablishmentSchema {
  @hasOne(() => EstablishmentAddress)
  declare address: HasOne<typeof EstablishmentAddress>

  @hasMany(() => UserEstablishment)
  declare users: HasMany<typeof UserEstablishment>

  @hasMany(() => Invoice)
  declare invoices: HasMany<typeof Invoice>

  @hasMany(() => PointBalance)
  declare pointBalances: HasMany<typeof PointBalance>

  @hasMany(() => PointTransaction)
  declare pointTransactions: HasMany<typeof PointTransaction>

  @hasOne(() => LoyaltyProgram)
  declare loyaltyProgram: HasOne<typeof LoyaltyProgram>

  @hasMany(() => PointRule)
  declare pointRules: HasMany<typeof PointRule>
}

