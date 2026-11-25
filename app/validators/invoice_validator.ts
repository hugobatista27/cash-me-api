import vine from '@vinejs/vine'

export const processInvoiceValidator = vine.create({
  accessKey: vine
    .string()
    .trim()
    .regex(/^\d{44}$/),
  qrCodeUrl: vine.string().trim(),
  issuerState: vine.string().trim().fixedLength(2),
  issuerCnpj: vine.string().trim().minLength(14).maxLength(18),
  issuedAt: vine.string().trim(),
  totalAmount: vine.number().positive(),
  items: vine
    .array(
      vine.object({
        rawDescription: vine.string().trim().maxLength(255),
        quantity: vine.number().positive(),
        unitPrice: vine.number().min(0),
        totalPrice: vine.number().min(0),
      })
    )
    .optional(),
})
