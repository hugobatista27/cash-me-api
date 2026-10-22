import { CouponRedemptionSchema } from '#database/schema'
import { belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import PointTransaction from '#models/point_transaction'

export default class CouponRedemption extends CouponRedemptionSchema {
  @belongsTo(() => User, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof User>

  @belongsTo(() => Establishment, { foreignKey: 'establishmentId' })
  declare establishment: BelongsTo<typeof Establishment>

  @belongsTo(() => Reward, { foreignKey: 'rewardId' })
  declare reward: BelongsTo<typeof Reward>

  @belongsTo(() => User, { foreignKey: 'usedByUserId' })
  declare usedByUser: BelongsTo<typeof User>

  @hasOne(() => PointTransaction, { foreignKey: 'couponRedemptionId' })
  declare pointTransaction: HasOne<typeof PointTransaction>
}
