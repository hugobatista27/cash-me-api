import vine from '@vinejs/vine'

export const updateLoyaltyRuleValidator = vine.create({
  baseAmount: vine.number().positive(),
  pointsPerBase: vine.number().min(1),
  minPurchaseAmount: vine.number().min(0).optional(),
  maxPointsPerPurchase: vine.number().min(1).nullable().optional(),
  name: vine.string().trim().maxLength(255).optional(),
})

export const simulateRuleValidator = vine.create({
  amount: vine.number().positive(),
  baseAmount: vine.number().positive().optional(),
  pointsPerBase: vine.number().min(1).optional(),
  minPurchaseAmount: vine.number().min(0).optional(),
  maxPointsPerPurchase: vine.number().min(1).nullable().optional(),
})
