import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupCustomerValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  cpf: vine.string().fixedLength(11).unique({ table: 'user_customers', column: 'cpf' }).nullable().optional(),
  phone: vine.string().maxLength(20).nullable().optional(),
  termsAccepted: vine.boolean(),
  deviceToken: vine.string().maxLength(255).nullable().optional(),
})

export const updateCustomerValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
  phone: vine.string().maxLength(20).nullable().optional(),
  deviceToken: vine.string().maxLength(255).nullable().optional(),
})