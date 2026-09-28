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
        'baseAmount',
        'pointsPerBase',
        'minPurchaseAmount',
        'maxPointsPerPurchase',
        'createdAt',
        'updatedAt',
      ]),
      humanReadableSummary: this.resource.humanReadableSummary,
    }
  }
}
