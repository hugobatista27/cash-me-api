import type { HttpContext } from '@adonisjs/core/http'
import Establishment from '#models/establishment'
import PointBalance from '#models/point_balance'

export default class EstablishmentCustomersController {
  /**
   * Carrega o estabelecimento vinculado ao lojista autenticado (ADR-002).
   */
  private async getEstablishment(ctx: HttpContext) {
    const user = ctx.auth.getUserOrFail()
    await user.load((loader) => loader.load('establishmentProfile'))

    if (!user.establishmentProfile || !user.establishmentProfile.establishmentId) {
      return null
    }

    return await Establishment.find(user.establishmentProfile.establishmentId)
  }

  /**
   * @index
   * @summary Lista consumidores fidelizados que já pontuaram no estabelecimento (RN08 / ADR-002)
   * @responseBody 200 - [{"id": 1, "fullName": "Maria Silva", "email": "maria@email.com", "phone": "48999990000", "currentBalance": 150, "totalAccumulated": 200}]
   */
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const search = String(request.input('search', '')).trim().toLowerCase()

    const balances = await PointBalance.query()
      .where('establishmentId', establishment.id)
      .preload('customer', (query) => {
        query.preload('user')
      })
      .orderBy('updatedAt', 'desc')

    // RN08: projeta apenas dados demográficos permitidos (nome, email, telefone) + saldos na loja
    // Nunca expõe CPF, deviceToken ou dados de outras lojas
    const customers = balances
      .filter((balance) => Boolean(balance.customer))
      .map((balance) => ({
        id: balance.customer.id,
        fullName: balance.customer.fullName,
        email: balance.customer.user?.email ?? null,
        phone: balance.customer.phone ?? null,
        currentBalance: Number(balance.currentBalance),
        totalAccumulated: Number(balance.totalAccumulated),
        lastActivityAt: balance.updatedAt ?? balance.createdAt,
      }))
      .filter((item) => {
        if (!search) return true
        return (
          item.fullName.toLowerCase().includes(search) ||
          (item.email && item.email.toLowerCase().includes(search))
        )
      })

    return response.ok({ data: customers })
  }
}
