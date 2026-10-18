import vine from '@vinejs/vine'

/**
 * Validador para criação de recompensa
 * Regras de aceitação:
 * - points_cost > 0
 * - discount_value > 0
 * - validity_days >= 1
 * - teto obrigatório se percentual (maxDiscountAmount quando discountType === 'PERCENTAGE')
 */
export const createRewardValidator = vine.create({
  title: vine.string().trim().minLength(3).maxLength(255),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  discountType: vine.enum(['FIXED', 'FIXED_AMOUNT', 'PERCENTAGE'] as const),
  discountValue: vine.number().positive(),
  minPurchaseAmount: vine.number().min(0).nullable().optional(),
  maxDiscountAmount: vine
    .number()
    .positive()
    .nullable()
    .optional()
    .requiredWhen('discountType', '=', 'PERCENTAGE'),
  pointsCost: vine.number().min(1),
  stock: vine.number().min(0).nullable().optional(),
  validityDays: vine.number().min(1).optional(),
  status: vine.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).optional(),
})

/**
 * Validador para atualização de recompensa
 */
export const updateRewardValidator = vine.create({
  title: vine.string().trim().minLength(3).maxLength(255).optional(),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  discountType: vine.enum(['FIXED', 'FIXED_AMOUNT', 'PERCENTAGE'] as const).optional(),
  discountValue: vine.number().positive().optional(),
  minPurchaseAmount: vine.number().min(0).nullable().optional(),
  maxDiscountAmount: vine
    .number()
    .positive()
    .nullable()
    .optional()
    .requiredWhen('discountType', '=', 'PERCENTAGE'),
  pointsCost: vine.number().min(1).optional(),
  stock: vine.number().min(0).nullable().optional(),
  validityDays: vine.number().min(1).optional(),
  status: vine.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).optional(),
})
