import type { HttpContext } from '@adonisjs/core/http'
import Establishment from '#models/establishment'
import Reward from '#models/reward'
import { createRewardValidator, updateRewardValidator } from '#validators/reward'

export default class EstablishmentRewardsController {
  /**
   * Helper para carregar o estabelecimento vinculado ao lojista autenticado
   * Garante isolamento estrito de tenant (ADR-002)
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
   * @summary Lista catálogo de recompensas do lojista autenticado
   */
  async index(ctx: HttpContext) {
    const { response, request } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const status = request.input('status')

    const query = Reward.query()
      .where('establishmentId', establishment.id)
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const rewards = await query

    return response.ok(rewards)
  }

  /**
   * @store
   * @summary Cadastra nova recompensa vinculada ao estabelecimento do lojista
   */
  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(createRewardValidator)

    const reward = await Reward.create({
      establishmentId: establishment.id,
      title: payload.title,
      description: payload.description ?? null,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minPurchaseAmount: payload.minPurchaseAmount ?? null,
      maxDiscountAmount: payload.maxDiscountAmount ?? null,
      pointsCost: payload.pointsCost,
      stock: payload.stock ?? null,
      validityDays: payload.validityDays ?? 30,
      status: payload.status ?? 'ACTIVE',
    })

    return response.created(reward)
  }

  /**
   * @show
   * @summary Detalha uma recompensa garantindo isolamento estrito de tenant (ADR-002)
   */
  async show(ctx: HttpContext) {
    const { params, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const reward = await Reward.query()
      .where('id', params.id)
      .where('establishmentId', establishment.id)
      .first()

    if (!reward) {
      return response.notFound({ message: 'Recompensa não encontrada.' })
    }

    return response.ok(reward)
  }

  /**
   * @update
   * @summary Atualiza dados de uma recompensa do estabelecimento
   */
  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const reward = await Reward.query()
      .where('id', params.id)
      .where('establishmentId', establishment.id)
      .first()

    if (!reward) {
      return response.notFound({ message: 'Recompensa não encontrada.' })
    }

    const payload = await request.validateUsing(updateRewardValidator)

    const effectiveDiscountType = payload.discountType ?? reward.discountType
    const effectiveMaxDiscount =
      payload.maxDiscountAmount !== undefined ? payload.maxDiscountAmount : reward.maxDiscountAmount

    if (effectiveDiscountType === 'PERCENTAGE' && !effectiveMaxDiscount) {
      return response.badRequest({
        errors: [
          {
            field: 'maxDiscountAmount',
            message:
              'O teto de desconto (maxDiscountAmount) é obrigatório para descontos percentuais.',
          },
        ],
      })
    }

    reward.merge({
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.discountType !== undefined ? { discountType: payload.discountType } : {}),
      ...(payload.discountValue !== undefined ? { discountValue: payload.discountValue } : {}),
      ...(payload.minPurchaseAmount !== undefined
        ? { minPurchaseAmount: payload.minPurchaseAmount }
        : {}),
      ...(payload.maxDiscountAmount !== undefined
        ? { maxDiscountAmount: payload.maxDiscountAmount }
        : {}),
      ...(payload.pointsCost !== undefined ? { pointsCost: payload.pointsCost } : {}),
      ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
      ...(payload.validityDays !== undefined ? { validityDays: payload.validityDays } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    })

    await reward.save()

    return response.ok(reward)
  }

  /**
   * @toggleStatus
   * @summary Ativa ou desativa uma recompensa
   */
  async toggleStatus(ctx: HttpContext) {
    const { params, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const reward = await Reward.query()
      .where('id', params.id)
      .where('establishmentId', establishment.id)
      .first()

    if (!reward) {
      return response.notFound({ message: 'Recompensa não encontrada.' })
    }

    reward.status = reward.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await reward.save()

    return response.ok(reward)
  }
}
