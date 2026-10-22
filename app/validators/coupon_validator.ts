import vine from '@vinejs/vine'

/**
 * Validador para consulta/verificação de cupom no caixa
 */
export const verifyCouponValidator = vine.create({
  code: vine.string().trim().toUpperCase().minLength(4).maxLength(20),
})

/**
 * Validador para consumo de cupom no caixa
 */
export const consumeCouponValidator = vine.create({
  code: vine.string().trim().toUpperCase().minLength(4).maxLength(20),
})
