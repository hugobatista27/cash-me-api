import { LoyaltyProgramSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Establishment from '#models/establishment'
import PointRule from '#models/point_rule'

export default class LoyaltyProgram extends LoyaltyProgramSchema {
  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>

  @hasMany(() => PointRule)
  declare rules: HasMany<typeof PointRule>
}
