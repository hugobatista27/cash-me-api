import { PointRuleSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LoyaltyProgram from '#models/loyalty_program'
import Establishment from '#models/establishment'
import User from '#models/user'

export default class PointRule extends PointRuleSchema {
  @belongsTo(() => LoyaltyProgram)
  declare loyaltyProgram: BelongsTo<typeof LoyaltyProgram>

  @belongsTo(() => Establishment)
  declare establishment: BelongsTo<typeof Establishment>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  /**
   * Retorna um resumo humano amigável da regra para exibição nos painéis.
   */
  get humanReadableSummary(): string {
    const base = Number(this.baseAmount).toFixed(2).replace('.', ',')
    const pts = this.pointsPerBase
    const ptsText = pts === 1 ? '1 ponto' : `${pts} pontos`

    let text = `A cada R$ ${base}, você ganha ${ptsText}`

    if (Number(this.minPurchaseAmount) > 0) {
      const min = Number(this.minPurchaseAmount).toFixed(2).replace('.', ',')
      text += ` (compra mínima de R$ ${min})`
    }

    if (this.maxPointsPerPurchase && this.maxPointsPerPurchase > 0) {
      text += ` (máximo de ${this.maxPointsPerPurchase} pontos por compra)`
    }

    return `${text}.`
  }
}
