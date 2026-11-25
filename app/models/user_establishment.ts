import { UserEstablishmentSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Establishment from '#models/establishment'

export default class UserEstablishment extends UserEstablishmentSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>
}
