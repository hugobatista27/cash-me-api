import vine from '@vinejs/vine'

export const createEstablishmentValidator = vine.create({
  cnpj: vine
    .string()
    .trim()
    .minLength(14)
    .maxLength(18)
    .unique({ table: 'establishments', column: 'cnpj' }),
  legalName: vine.string().trim().minLength(2).maxLength(255),
  tradeName: vine.string().trim().minLength(2).maxLength(255),
  status: vine.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  conversionFactor: vine.number().positive().optional(),
})

export const updateEstablishmentValidator = vine.create({
  legalName: vine.string().trim().minLength(2).maxLength(255).optional(),
  tradeName: vine.string().trim().minLength(2).maxLength(255).optional(),
  status: vine.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  conversionFactor: vine.number().positive().optional(),
})
