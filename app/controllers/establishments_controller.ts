import type { HttpContext } from '@adonisjs/core/http'
import Establishment from '#models/establishment'
import EstablishmentAddress from '#models/establishment_address'
import {
  createEstablishmentValidator,
  updateEstablishmentValidator,
  updateAddressValidator,
  approveEstablishmentValidator,
} from '#validators/establishment_validator'
import EstablishmentTransformer from '#transformers/establishment_transformer'
import EstablishmentAddressTransformer from '#transformers/establishment_address_transformer'
import db from '@adonisjs/lucid/services/db'

export default class EstablishmentsController {
  /**
   * @index
   * @summary Listar estabelecimentos parceiros
   * @responseBody 200 - [{"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real", "status": "ACTIVE"}]
   */
  async index({ serialize }: HttpContext) {
    const establishments = await Establishment.query()
      .preload('address')
      .orderBy('tradeName', 'asc')
    return serialize(EstablishmentTransformer.transform(establishments))
  }

  /**
   * @show
   * @summary Detalhes de um estabelecimento
   * @responseBody 200 - {"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real"}
   */
  async show({ params, serialize, response }: HttpContext) {
    const establishment = await Establishment.query()
      .where('id', params.id)
      .preload('address')
      .first()

    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }
    return serialize(EstablishmentTransformer.transform(establishment))
  }

  /**
   * @store
   * @summary Cadastrar novo estabelecimento com endereço opcional
   * @requestBody {"cnpj": "12345678000195", "legalName": "Padaria Real Ltda", "tradeName": "Padaria Real", "status": "ACTIVE", "conversionFactor": 1.0}
   * @responseBody 201 - {"id": 1, "cnpj": "12345678000195", "tradeName": "Padaria Real"}
   */
  async store({ request, serialize, response }: HttpContext) {
    const payload = await request.validateUsing(createEstablishmentValidator)
    const cleanCnpj = payload.cnpj.replace(/\D/g, '')

    const trx = await db.transaction()

    try {
      const establishment = await Establishment.create(
        {
          cnpj: cleanCnpj,
          legalName: payload.legalName,
          tradeName: payload.tradeName,
          status: payload.status || 'PENDING',
          conversionFactor: payload.conversionFactor || 1.0,
          phone: payload.phone || null,
          whatsapp: payload.whatsapp || null,
          email: payload.email || null,
          website: payload.website || null,
          instagram: payload.instagram || null,
          socialLinks: payload.socialLinks || null,
        },
        { client: trx }
      )

      if (payload.address) {
        const cleanCep = payload.address.postalCode.replace(/\D/g, '')
        const address = await EstablishmentAddress.create(
          {
            establishmentId: establishment.id,
            postalCode: cleanCep,
            state: payload.address.state.toUpperCase(),
            city: payload.address.city,
            neighborhood: payload.address.neighborhood,
            street: payload.address.street,
            number: payload.address.number,
            complement: payload.address.complement || null,
            reference: payload.address.reference || null,
            latitude: payload.address.latitude ?? null,
            longitude: payload.address.longitude ?? null,
          },
          { client: trx }
        )
        establishment.address = address
      }

      await trx.commit()

      response.status(201)
      return serialize(EstablishmentTransformer.transform(establishment))
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * @update
   * @summary Atualizar estabelecimento
   * @requestBody {"tradeName": "Padaria Real Nova", "status": "ACTIVE", "conversionFactor": 2.0}
   * @responseBody 200 - {"id": 1, "status": "ACTIVE"}
   */
  async update({ params, request, serialize, response }: HttpContext) {
    const establishment = await Establishment.query()
      .where('id', params.id)
      .preload('address')
      .first()

    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(updateEstablishmentValidator)

    const { address: addressPayload, ...establishmentPayload } = payload
    establishment.merge(establishmentPayload)
    await establishment.save()

    if (addressPayload) {
      const cleanCep = addressPayload.postalCode.replace(/\D/g, '')
      if (establishment.address) {
        establishment.address.merge({
          ...addressPayload,
          postalCode: cleanCep,
          state: addressPayload.state.toUpperCase(),
        })
        await establishment.address.save()
      } else {
        establishment.address = await EstablishmentAddress.create({
          ...addressPayload,
          establishmentId: establishment.id,
          postalCode: cleanCep,
          state: addressPayload.state.toUpperCase(),
        })
      }
    }

    return serialize(EstablishmentTransformer.transform(establishment))
  }

  /**
   * @approve
   * @summary Aprovar ou alterar status do lojista (Super Admin - Task #1 / RN06)
   * @requestBody {"status": "ACTIVE"}
   * @responseBody 200 - {"id": 1, "status": "ACTIVE"}
   */
  async approve({ params, request, serialize, response }: HttpContext) {
    const establishment = await Establishment.query()
      .where('id', params.id)
      .preload('address')
      .first()

    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(approveEstablishmentValidator)
    establishment.status = payload.status
    await establishment.save()

    return serialize(EstablishmentTransformer.transform(establishment))
  }

  /**
   * @showAddress
   * @summary Obter o endereço do estabelecimento
   * @responseBody 200 - {"id": 1, "establishmentId": 1, "postalCode": "88010000", "city": "Florianópolis"}
   */
  async showAddress({ params, serialize, response }: HttpContext) {
    const address = await EstablishmentAddress.findBy('establishmentId', params.id)
    if (!address) {
      return response.notFound({ message: 'Endereço do estabelecimento não encontrado.' })
    }
    return serialize(EstablishmentAddressTransformer.transform(address))
  }

  /**
   * @updateAddress
   * @summary Atualizar endereço do estabelecimento
   * @requestBody {"city": "Florianópolis", "state": "SC"}
   * @responseBody 200 - {"id": 1, "city": "Florianópolis"}
   */
  async updateAddress({ params, request, serialize, response }: HttpContext) {
    const establishment = await Establishment.find(params.id)
    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }

    let address = await EstablishmentAddress.findBy('establishmentId', params.id)
    const payload = await request.validateUsing(updateAddressValidator)

    if (payload.postalCode) {
      payload.postalCode = payload.postalCode.replace(/\D/g, '')
    }
    if (payload.state) {
      payload.state = payload.state.toUpperCase()
    }

    if (address) {
      address.merge(payload)
      await address.save()
    } else {
      if (!payload.postalCode || !payload.state || !payload.city || !payload.neighborhood || !payload.street || !payload.number) {
        return response.badRequest({ message: 'Campos obrigatórios de endereço ausentes para criação.' })
      }
      address = await EstablishmentAddress.create({
        establishmentId: establishment.id,
        postalCode: payload.postalCode,
        state: payload.state,
        city: payload.city,
        neighborhood: payload.neighborhood,
        street: payload.street,
        number: payload.number,
        complement: payload.complement || null,
        reference: payload.reference || null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      })
    }

    return serialize(EstablishmentAddressTransformer.transform(address))
  }
}
