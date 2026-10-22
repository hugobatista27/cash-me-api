import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Establishment from '#models/establishment'
import CouponRedemption from '#models/coupon_redemption'
import { verifyCouponValidator, consumeCouponValidator } from '#validators/coupon_validator'

export default class EstablishmentCouponsController {
  /**
   * Helper para carregar o estabelecimento vinculado ao usuário operador/admin autenticado
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
   * @verify
   * @summary Valida código de cupom no caixa sem alterar status (conferência)
   */
  async verify(ctx: HttpContext) {
    const { request, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(verifyCouponValidator)

    // Busca cupom pelo código
    const coupon = await CouponRedemption.query()
      .where('code', payload.code)
      .preload('reward')
      .preload('customer', (query) => query.preload('customerProfile'))
      .first()

    if (!coupon) {
      return response.notFound({
        message: 'Cupom não encontrado.',
        code: 'E_COUPON_NOT_FOUND',
      })
    }

    // Validação Multi-Tenant (ADR-002): O cupom deve pertencer ao estabelecimento autenticado
    if (coupon.establishmentId !== establishment.id) {
      return response.forbidden({
        message: 'Este cupom pertence a outro estabelecimento comercial.',
        code: 'E_COUPON_OTHER_ESTABLISHMENT',
      })
    }

    // Validação de Status (RN10 / ADR-003)
    if (coupon.status === 'USED') {
      return response.badRequest({
        message: 'Este cupom já foi utilizado.',
        code: 'E_COUPON_ALREADY_USED',
      })
    }

    if (coupon.status === 'CANCELLED') {
      return response.badRequest({
        message: 'Este cupom foi cancelado.',
        code: 'E_COUPON_CANCELLED',
      })
    }

    if (coupon.status !== 'ACTIVE') {
      return response.badRequest({
        message: 'Este cupom não está ativo.',
        code: 'E_COUPON_INACTIVE',
      })
    }

    // Validação de Expiração (expires_at >= now)
    const now = DateTime.now()
    if (coupon.expiresAt < now) {
      return response.badRequest({
        message: 'Este cupom está expirado.',
        code: 'E_COUPON_EXPIRED',
      })
    }

    const reward = coupon.reward
    const customer = coupon.customer

    return response.ok({
      id: coupon.id,
      code: coupon.code,
      status: coupon.status,
      pointsCost: coupon.pointsCost,
      expiresAt: coupon.expiresAt,
      reward: {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        discountType: reward.discountType,
        discountValue: Number(reward.discountValue),
        minPurchaseAmount: reward.minPurchaseAmount ? Number(reward.minPurchaseAmount) : null,
        maxDiscountAmount: reward.maxDiscountAmount ? Number(reward.maxDiscountAmount) : null,
      },
      customer: {
        id: customer.id,
        fullName: customer.customerProfile?.fullName ?? 'Consumidor',
        cpf: customer.customerProfile?.cpf ?? null,
      },
    })
  }

  /**
   * @consume
   * @summary Consome o cupom de forma atômica com lock pessimista (SELECT FOR UPDATE)
   */
  async consume(ctx: HttpContext) {
    const { request, response, auth } = ctx
    const user = auth.getUserOrFail()
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(consumeCouponValidator)

    const trx = await db.transaction()

    try {
      // Executa lock pessimista (SELECT FOR UPDATE) via Lucid
      const coupon = await CouponRedemption.query({ client: trx })
        .where('code', payload.code)
        .forUpdate()
        .first()

      if (!coupon) {
        await trx.rollback()
        return response.notFound({
          message: 'Cupom não encontrado.',
          code: 'E_COUPON_NOT_FOUND',
        })
      }

      // Validação Multi-Tenant (ADR-002)
      if (coupon.establishmentId !== establishment.id) {
        await trx.rollback()
        return response.forbidden({
          message: 'Este cupom pertence a outro estabelecimento comercial.',
          code: 'E_COUPON_OTHER_ESTABLISHMENT',
        })
      }

      // Revalidação de Status para concorrência/idempotência
      if (coupon.status === 'USED') {
        await trx.rollback()
        return response.badRequest({
          message: 'Este cupom já foi utilizado.',
          code: 'E_COUPON_ALREADY_USED',
        })
      }

      if (coupon.status !== 'ACTIVE') {
        await trx.rollback()
        return response.badRequest({
          message: 'Este cupom não está ativo para consumo.',
          code: 'E_COUPON_NOT_ACTIVE',
        })
      }

      // Revalidação de Expiração
      const now = DateTime.now()
      if (coupon.expiresAt < now) {
        await trx.rollback()
        return response.badRequest({
          message: 'Este cupom está expirado e não pode ser consumido.',
          code: 'E_COUPON_EXPIRED',
        })
      }

      // Transiciona para USED gravando used_at = now() e used_by_user_id = auth.user.id
      coupon.status = 'USED'
      coupon.usedAt = now
      coupon.usedByUserId = user.id

      await coupon.useTransaction(trx).save()
      await trx.commit()

      await coupon.load('reward')
      await coupon.load('customer', (q) => q.preload('customerProfile'))

      return response.ok({
        id: coupon.id,
        code: coupon.code,
        status: coupon.status,
        usedAt: coupon.usedAt,
        usedByUserId: coupon.usedByUserId,
        reward: {
          id: coupon.reward.id,
          title: coupon.reward.title,
          discountType: coupon.reward.discountType,
          discountValue: Number(coupon.reward.discountValue),
        },
        customer: {
          id: coupon.customer.id,
          fullName: coupon.customer.customerProfile?.fullName ?? 'Consumidor',
        },
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
