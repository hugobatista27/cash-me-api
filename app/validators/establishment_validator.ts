import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const uniqueCleanCnpjRule = vine.createRule(async (value, _options, field) => {
  if (typeof value !== 'string') {
    return
  }
  const clean = value.replace(/\D/g, '')
  if (clean.length !== 14) {
    field.report('O CNPJ deve conter 14 dígitos numéricos.', 'cnpj.invalid', field)
    return
  }
  const existing = await db.from('establishments').where('cnpj', clean).first()
  if (existing) {
    field.report('Este CNPJ já está cadastrado no sistema.', 'cnpj.unique', field)
  }
})

export const addressSchema = vine.object({
  postalCode: vine.string().trim().minLength(8).maxLength(9),
  state: vine.string().trim().minLength(2).maxLength(2),
  city: vine.string().trim().maxLength(100),
  neighborhood: vine.string().trim().maxLength(100),
  street: vine.string().trim().maxLength(255),
  number: vine.string().trim().maxLength(20),
  complement: vine.string().trim().maxLength(100).optional(),
  reference: vine.string().trim().maxLength(255).optional(),
  latitude: vine.number().min(-90).max(90).optional(),
  longitude: vine.number().min(-180).max(180).optional(),
})

export const createEstablishmentValidator = vine.create({
  cnpj: vine.string().trim().minLength(14).maxLength(18).use(uniqueCleanCnpjRule()),
  legalName: vine.string().trim().minLength(2).maxLength(255),
  tradeName: vine.string().trim().minLength(2).maxLength(255),
  status: vine.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  conversionFactor: vine.number().positive().optional(),
  phone: vine.string().trim().maxLength(20).optional(),
  whatsapp: vine.string().trim().maxLength(20).optional(),
  email: vine.string().trim().email().maxLength(254).optional(),
  website: vine.string().trim().url().maxLength(255).optional(),
  instagram: vine.string().trim().maxLength(100).optional(),
  socialLinks: vine.record(vine.any()).optional(),
  address: addressSchema.optional(),
})

export const updateEstablishmentValidator = vine.create({
  legalName: vine.string().trim().minLength(2).maxLength(255).optional(),
  tradeName: vine.string().trim().minLength(2).maxLength(255).optional(),
  status: vine.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  conversionFactor: vine.number().positive().optional(),
  phone: vine.string().trim().maxLength(20).optional(),
  whatsapp: vine.string().trim().maxLength(20).optional(),
  email: vine.string().trim().email().maxLength(254).optional(),
  website: vine.string().trim().url().maxLength(255).optional(),
  instagram: vine.string().trim().maxLength(100).optional(),
  socialLinks: vine.record(vine.any()).optional(),
  address: addressSchema.optional(),
})

export const updateAddressValidator = vine.create({
  postalCode: vine.string().trim().minLength(8).maxLength(9).optional(),
  state: vine.string().trim().minLength(2).maxLength(2).optional(),
  city: vine.string().trim().maxLength(100).optional(),
  neighborhood: vine.string().trim().maxLength(100).optional(),
  street: vine.string().trim().maxLength(255).optional(),
  number: vine.string().trim().maxLength(20).optional(),
  complement: vine.string().trim().maxLength(100).optional(),
  reference: vine.string().trim().maxLength(255).optional(),
  latitude: vine.number().min(-90).max(90).optional(),
  longitude: vine.number().min(-180).max(180).optional(),
})

export const onboardingEstablishmentValidator = vine.create({
  user: vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(255),
    email: email().unique({ table: 'users', column: 'email' }),
    password: password(),
    passwordConfirmation: password().sameAs('password'),
  }),
  establishment: vine.object({
    cnpj: vine.string().trim().minLength(14).maxLength(18).use(uniqueCleanCnpjRule()),
    legalName: vine.string().trim().minLength(2).maxLength(255),
    tradeName: vine.string().trim().minLength(2).maxLength(255),
    conversionFactor: vine.number().positive().optional(),
    contact: vine
      .object({
        phone: vine.string().trim().maxLength(20).optional(),
        whatsapp: vine.string().trim().maxLength(20).optional(),
        email: vine.string().trim().email().maxLength(254).optional(),
        website: vine.string().trim().url().maxLength(255).optional(),
        instagram: vine.string().trim().maxLength(100).optional(),
        socialLinks: vine.record(vine.any()).optional(),
      })
      .optional(),
  }),
  address: addressSchema.optional(),
})

export const approveEstablishmentValidator = vine.create({
  status: vine.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  rejectionReason: vine.string().trim().maxLength(255).optional(),
})
