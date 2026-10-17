import { RewardSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Establishment from '#models/establishment'

export default class Reward extends RewardSchema {
  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>
}
