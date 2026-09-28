import { PointTransactionSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserCustomer from '#models/user_customer'
import Establishment from '#models/establishment'
import Invoice from '#models/invoice'
import PointRule from '#models/point_rule'

export default class PointTransaction extends PointTransactionSchema {
  @belongsTo(() => UserCustomer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof UserCustomer>

  @belongsTo(() => Establishment, { foreignKey: 'establishmentId' })
  declare establishment: BelongsTo<typeof Establishment>

  @belongsTo(() => Invoice, { foreignKey: 'invoiceId' })
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => PointRule, { foreignKey: 'ruleId' })
  declare rule: BelongsTo<typeof PointRule>
}
