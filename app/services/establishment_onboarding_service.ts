import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Establishment from '#models/establishment'
import EstablishmentAddress from '#models/establishment_address'
import UserEstablishment from '#models/user_establishment'
import LoyaltyProgram from '#models/loyalty_program'
import PointRule from '#models/point_rule'

export interface OnboardingPayload {
  user: {
    fullName: string
    email: string
    password: string
  }
  establishment: {
    cnpj: string
    legalName: string
    tradeName: string
    conversionFactor?: number
    contact?: {
      phone?: string
      whatsapp?: string
      email?: string
      website?: string
      instagram?: string
      socialLinks?: Record<string, any>
    }
  }
  address?: {
    postalCode: string
    state: string
    city: string
    neighborhood: string
    street: string
    number: string
    complement?: string
    reference?: string
    latitude?: number
    longitude?: number
  }
}

export default class EstablishmentOnboardingService {
  /**
   * Realiza o cadastro atômico completo do comércio:
   * 1. Usuário de autenticação (users)
   * 2. Estabelecimento com status PENDING (establishments)
   * 3. Endereço da loja física (establishment_addresses), se fornecido
   * 4. Programa de fidelidade e regra inicial de pontuação (loyalty_programs & point_rules)
   * 5. Perfil de LOJISTA_ADMIN (user_establishments)
   * 6. Token de acesso para login imediato
   */
  async register(payload: OnboardingPayload) {
    const trx = await db.transaction()

    try {
      const user = await User.create(
        {
          email: payload.user.email,
          password: payload.user.password,
          userType: 'ESTABLISHMENT',
          status: 'ACTIVE',
        },
        { client: trx }
      )

      const cleanCnpj = payload.establishment.cnpj.replace(/\D/g, '')
      const contact = payload.establishment.contact || {}

      const establishment = await Establishment.create(
        {
          cnpj: cleanCnpj,
          legalName: payload.establishment.legalName,
          tradeName: payload.establishment.tradeName,
          status: 'PENDING', // RN06: Onboarding pendente de aprovação
          conversionFactor: payload.establishment.conversionFactor || 1.0,
          phone: contact.phone || null,
          whatsapp: contact.whatsapp || null,
          email: contact.email || null,
          website: contact.website || null,
          instagram: contact.instagram || null,
          socialLinks: contact.socialLinks || null,
        },
        { client: trx }
      )

      let address: EstablishmentAddress | null = null
      if (payload.address) {
        const cleanCep = payload.address.postalCode.replace(/\D/g, '')
        address = await EstablishmentAddress.create(
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
      }

      // Inicializa programa de fidelidade padrão para o tenant
      const loyaltyProgram = await LoyaltyProgram.create(
        {
          establishmentId: establishment.id,
          name: 'Programa de Fidelidade',
          status: 'ACTIVE',
          pointsCurrency: 'pontos',
        },
        { client: trx }
      )

      // Inicializa a primeira regra de pontuação (versão 1)
      await PointRule.create(
        {
          loyaltyProgramId: loyaltyProgram.id,
          establishmentId: establishment.id,
          createdBy: user.id,
          version: 1,
          name: 'Regra Padrão R$ 1 = 1 Ponto',
          status: 'ACTIVE',
          baseAmount: 1.0,
          pointsPerBase: 1,
          minPurchaseAmount: 0.0,
        },
        { client: trx }
      )

      // Vincula perfil de gestor da loja
      const profile = await UserEstablishment.create(
        {
          userId: user.id,
          establishmentId: establishment.id,
          fullName: payload.user.fullName,
          role: 'LOJISTA_ADMIN',
        },
        { client: trx }
      )

      await trx.commit()

      const token = await User.accessTokens.create(user)

      if (address) {
        establishment.$setRelated('address', address)
      }

      return {
        user,
        profile,
        establishment,
        address,
        token: token.value!.release(),
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
