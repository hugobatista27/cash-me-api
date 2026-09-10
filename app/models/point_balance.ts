import { PointBalanceSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'

export default class PointBalance extends PointBalanceSchema {
  @belongsTo(() => UserCustomer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof UserCustomer>

  @belongsTo(() => Establishment, { foreignKey: 'establishmentId' })
  declare establishment: BelongsTo<typeof Establishment>
}
