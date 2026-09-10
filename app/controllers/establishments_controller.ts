import type { HttpContext } from '@adonisjs/core/http'
import Establishment from '#models/establishment'
import {
  createEstablishmentValidator,
  updateEstablishmentValidator,
} from '#validators/establishment_validator'
import EstablishmentTransformer from '#transformers/establishment_transformer'

export default class EstablishmentsController {
  /**
   * @index
   * @summary Listar estabelecimentos
   * @responseBody 200 - [{"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real", "status": "ACTIVE"}]
   */
  async index({ serialize }: HttpContext) {
    const establishments = await Establishment.query().orderBy('tradeName', 'asc')
    return serialize(EstablishmentTransformer.transform(establishments))
  }

  /**
   * @show
   * @summary Detalhes de um estabelecimento
   * @responseBody 200 - {"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real"}
   */
  async show({ params, serialize, response }: HttpContext) {
    const establishment = await Establishment.find(params.id)
    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }
    return serialize(EstablishmentTransformer.transform(establishment))
  }

  /**
   * @store
   * @summary Cadastrar novo estabelecimento
   * @requestBody {"cnpj": "12345678000195", "legalName": "Padaria Real Ltda", "tradeName": "Padaria Real", "status": "ACTIVE", "conversionFactor": 1.0}
   * @responseBody 201 - {"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real"}
   */
  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createEstablishmentValidator)
    const cleanCnpj = payload.cnpj.replace(/\D/g, '')

    const establishment = await Establishment.create({
      cnpj: cleanCnpj,
      legalName: payload.legalName,
      tradeName: payload.tradeName,
      status: payload.status || 'PENDING',
      conversionFactor: payload.conversionFactor || 1.0,
    })

    return serialize(EstablishmentTransformer.transform(establishment))
  }

  /**
   * @update
   * @summary Atualizar estabelecimento
   * @requestBody {"status": "ACTIVE", "conversionFactor": 2.0}
   * @responseBody 200 - {"id": 1, "status": "ACTIVE"}
   */
  async update({ params, request, serialize, response }: HttpContext) {
    const establishment = await Establishment.find(params.id)
    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(updateEstablishmentValidator)
    establishment.merge(payload)
    await establishment.save()

    return serialize(EstablishmentTransformer.transform(establishment))
  }
}
