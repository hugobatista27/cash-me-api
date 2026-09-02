import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupEstablishmentValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  establishmentId: vine.number().nullable().optional(),
  role: vine.enum(['SUPER_ADMIN', 'LOJISTA_ADMIN', 'LOJISTA_OPERADOR']).optional(),
})

export const updateEstablishmentValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
  role: vine.enum(['SUPER_ADMIN', 'LOJISTA_ADMIN', 'LOJISTA_OPERADOR']).optional(),
})