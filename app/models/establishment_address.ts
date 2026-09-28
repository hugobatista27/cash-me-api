import { EstablishmentAddressSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Establishment from '#models/establishment'

export default class EstablishmentAddress extends EstablishmentAddressSchema {
  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>
}
