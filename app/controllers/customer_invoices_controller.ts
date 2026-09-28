import type { HttpContext } from '@adonisjs/core/http'
import PointsEngineService, { DuplicateInvoiceException } from '#services/points_engine_service'
import { processInvoiceValidator } from '#validators/invoice_validator'
import InvoiceTransformer from '#transformers/invoice_transformer'
import PointBalanceTransformer from '#transformers/point_balance_transformer'
import EstablishmentTransformer from '#transformers/establishment_transformer'
import Invoice from '#models/invoice'
import { inject } from '@adonisjs/core'

@inject()
export default class CustomerInvoicesController {
  constructor(protected pointsEngine: PointsEngineService) {}

  /**
   * @process
   * @summary Processar NFC-e extraída no front-end para cômputo de pontos
   * @requestBody {"accessKey": "42230912345678000195650010000001231000001234", "qrCodeUrl": "https://sat.sef.sc.gov.br/nfce/qrcode?p=...", "issuerState": "SC", "issuerCnpj": "12345678000195", "issuedAt": "2026-09-09T10:00:00Z", "totalAmount": 150.00}
   * @responseBody 200 - {"invoice": {}, "pointsAwarded": 150, "status": "PROCESSED", "balance": {}}
   */
  async process({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return response.forbidden({ message: 'Apenas consumidores podem submeter notas fiscais.' })
    }

    const payload = await request.validateUsing(processInvoiceValidator)

    try {
      const result = await this.pointsEngine.processInvoice(user.customerProfile, payload)

      return serialize({
        invoice: InvoiceTransformer.transform(result.invoice),
        pointsAwarded: result.pointsAwarded,
        status: result.status,
        rejectionReason: result.rejectionReason,
        balance: result.balance ? PointBalanceTransformer.transform(result.balance) : null,
        establishment: result.establishment
          ? EstablishmentTransformer.transform(result.establishment)
          : null,
      })
    } catch (error) {
      if (error instanceof DuplicateInvoiceException) {
        return response.conflict({
          message: error.message,
          code: 'E_DUPLICATE_INVOICE',
        })
      }
      throw error
    }
  }

  /**
   * @index
   * @summary Listar histórico de notas fiscais do consumidor autenticado
   * @responseBody 200 - [{"id": 1, "accessKey": "...", "status": "PROCESSED", "pointsAwarded": 150}]
   */
  async index({ auth, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return response.forbidden({ message: 'Apenas consumidores possuem histórico de notas.' })
    }

    const invoices = await Invoice.query()
      .where('customerId', user.customerProfile.id)
      .orderBy('createdAt', 'desc')

    return serialize(InvoiceTransformer.transform(invoices))
  }

  /**
   * @show
   * @summary Detalhes de uma nota fiscal específica do consumidor
   * @responseBody 200 - {"id": 1, "accessKey": "...", "items": []}
   */
  async show({ auth, params, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return response.forbidden({ message: 'Acesso negado.' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('customerId', user.customerProfile.id)
      .preload('items')
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Nota fiscal não encontrada.' })
    }

    return serialize(InvoiceTransformer.transform(invoice))
  }
}
