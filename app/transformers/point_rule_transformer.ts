import type PointRule from '#models/point_rule'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PointRuleTransformer extends BaseTransformer<PointRule> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'loyaltyProgramId',
        'establishmentId',
        'version',
        'name',
        'status',
        'pointsPerBase',
        'maxPointsPerPurchase',
        'createdAt',
        'updatedAt',
      ]),
      baseAmount: Number(this.resource.baseAmount),
      minPurchaseAmount: Number(this.resource.minPurchaseAmount),
      humanReadableSummary: this.resource.humanReadableSummary,
    }
  }
}
