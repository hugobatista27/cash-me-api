import { RewardSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Establishment from '#models/establishment'
import CouponRedemption from '#models/coupon_redemption'

export default class Reward extends RewardSchema {
  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>

  @hasMany(() => CouponRedemption, { foreignKey: 'rewardId' })
  declare redemptions: HasMany<typeof CouponRedemption>
}
