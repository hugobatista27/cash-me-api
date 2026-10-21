import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import crypto from 'node:crypto'
import Reward from '#models/reward'
import Establishment from '#models/establishment'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import CouponRedemption from '#models/coupon_redemption'

export default class CustomerCouponsController {
  /**
   * Helper para carregar o perfil de consumidor do usuário autenticado
   */
  private async getCustomer(ctx: HttpContext) {
    const user = ctx.auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return null
    }

    return { user, customer: user.customerProfile }
  }

  /**
   * Gera um código alfanumérico curto único (8 caracteres, maiúsculas)
   */
  private async generateUniqueCode(trx: any): Promise<string> {
    let code = ''
    let exists = true
    let attempts = 0

    while (exists && attempts < 10) {
      attempts++
      code = crypto.randomBytes(4).toString('hex').toUpperCase()

      const existing = await CouponRedemption.query({ client: trx }).where('code', code).first()

      if (!existing) {
        exists = false
      }
    }

    if (exists) {
      throw new Error('Falha ao gerar código único de cupom.')
    }

    return code
  }

  /**
   * @rewards
   * @summary Retorna as recompensas ACTIVE do estabelecimento com estoque disponível (> 0 ou nulo)
   */
  async rewards(ctx: HttpContext) {
    const { params, response } = ctx
    const authData = await this.getCustomer(ctx)

    if (!authData) {
      return response.forbidden({ message: 'Apenas consumidores podem acessar as recompensas.' })
    }

    const establishment = await Establishment.find(params.id)
    if (!establishment) {
      return response.notFound({ message: 'Estabelecimento não encontrado.' })
    }

    const rewards = await Reward.query()
      .where('establishmentId', establishment.id)
      .where('status', 'ACTIVE')
      .where((query) => {
        query.whereNull('stock').orWhere('stock', '>', 0)
      })
      .orderBy('pointsCost', 'asc')

    return response.ok(rewards)
  }

  /**
   * @redeem
   * @summary Resgatar cupom de recompensa com débito atômico de pontos (ADR-003)
   */
  async redeem(ctx: HttpContext) {
    const { params, response } = ctx
    const authData = await this.getCustomer(ctx)

    if (!authData) {
      return response.forbidden({ message: 'Apenas consumidores podem resgatar cupons.' })
    }

    const { user, customer } = authData

    const reward = await Reward.query().where('id', params.id).preload('establishment').first()

    if (!reward) {
      return response.notFound({ message: 'Recompensa não encontrada.' })
    }

    // RN11: Rejeitar com erro 400 se o estabelecimento estiver com status = 'INACTIVE'
    if (!reward.establishment || reward.establishment.status === 'INACTIVE') {
      return response.badRequest({
        message: 'O estabelecimento encontra-se inativo e não aceita resgates no momento.',
        code: 'E_ESTABLISHMENT_INACTIVE',
      })
    }

    if (reward.status !== 'ACTIVE') {
      return response.badRequest({
        message: 'Esta recompensa não está mais ativa.',
        code: 'E_REWARD_INACTIVE',
      })
    }

    // Executa transação atômica (db.transaction)
    const trx = await db.transaction()

    try {
      // 1. SELECT FOR UPDATE em point_balances do consumidor no estabelecimento
      const balance = await PointBalance.query({ client: trx })
        .where('customerId', customer.id)
        .where('establishmentId', reward.establishmentId)
        .forUpdate()
        .first()

      const currentBalance = balance ? Number(balance.currentBalance) : 0
      const pointsCost = Number(reward.pointsCost)

      // Rejeitar se saldo insuficiente
      if (!balance || currentBalance < pointsCost) {
        await trx.rollback()
        return response.badRequest({
          message: 'Saldo insuficiente de pontos para resgatar esta recompensa.',
          code: 'E_INSUFFICIENT_POINTS',
          currentBalance,
          pointsCost,
        })
      }

      // 2. Lock e verificação de estoque na recompensa
      const lockedReward = await Reward.query({ client: trx })
        .where('id', reward.id)
        .forUpdate()
        .firstOrFail()

      if (lockedReward.stock !== null && lockedReward.stock <= 0) {
        await trx.rollback()
        return response.badRequest({
          message: 'Estoque esgotado para esta recompensa.',
          code: 'E_REWARD_OUT_OF_STOCK',
        })
      }

      // Decrementar estoque se controlado
      if (lockedReward.stock !== null) {
        lockedReward.stock = lockedReward.stock - 1
        await lockedReward.useTransaction(trx).save()
      }

      // Decrementar saldo
      const balanceAfter = currentBalance - pointsCost
      balance.currentBalance = balanceAfter
      await balance.useTransaction(trx).save()

      // 3. Gerar código alfanumérico curto único
      const code = await this.generateUniqueCode(trx)

      // 4. Calcular expires_at com base na validade
      const validityDays = reward.validityDays > 0 ? reward.validityDays : 30
      const expiresAt = DateTime.now().plus({ days: validityDays })

      // 5. Persistir CouponRedemption com status ACTIVE
      const coupon = await CouponRedemption.create(
        {
          customerId: user.id,
          establishmentId: reward.establishmentId,
          rewardId: reward.id,
          code,
          pointsCost,
          status: 'ACTIVE',
          expiresAt,
        },
        { client: trx }
      )

      // 6. Inserir point_transactions com tipo DEBIT vinculado ao coupon_redemption_id
      await PointTransaction.create(
        {
          customerId: customer.id,
          establishmentId: reward.establishmentId,
          couponRedemptionId: coupon.id,
          type: 'DEBIT',
          points: pointsCost,
          description: `Resgate de cupom: ${reward.title}`,
          metadata: {
            couponId: coupon.id,
            couponCode: coupon.code,
            rewardId: reward.id,
            balanceAfter,
          },
        },
        { client: trx }
      )

      await trx.commit()

      // Preload para retornar payload completo
      await coupon.load('reward')
      await coupon.load('establishment')

      return response.created(coupon)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * @cancel
   * @summary Cancelar cupom ativo com estorno atômico de pontos (REVERSAL) (ADR-003)
   */
  async cancel(ctx: HttpContext) {
    const { params, response } = ctx
    const authData = await this.getCustomer(ctx)

    if (!authData) {
      return response.forbidden({ message: 'Apenas consumidores podem cancelar cupons.' })
    }

    const { user, customer } = authData

    const trx = await db.transaction()

    try {
      // Lock no cupom para evitar race conditions no cancelamento
      const coupon = await CouponRedemption.query({ client: trx })
        .where('id', params.id)
        .where('customerId', user.id)
        .forUpdate()
        .first()

      if (!coupon) {
        await trx.rollback()
        return response.notFound({ message: 'Cupom não encontrado.' })
      }

      if (coupon.status !== 'ACTIVE') {
        await trx.rollback()
        return response.badRequest({
          message: 'Apenas cupons com status ACTIVE podem ser cancelados.',
          code: 'E_COUPON_NOT_ACTIVE',
          status: coupon.status,
        })
      }

      // Transicionar para CANCELLED
      coupon.status = 'CANCELLED'
      coupon.cancelledAt = DateTime.now()
      await coupon.useTransaction(trx).save()

      // Lock no saldo do cliente no estabelecimento
      const balance = await PointBalance.query({ client: trx })
        .where('customerId', customer.id)
        .where('establishmentId', coupon.establishmentId)
        .forUpdate()
        .first()

      const refundPoints = Number(coupon.pointsCost)
      let balanceAfter = refundPoints

      if (balance) {
        balance.currentBalance = Number(balance.currentBalance) + refundPoints
        balanceAfter = Number(balance.currentBalance)
        await balance.useTransaction(trx).save()
      } else {
        await PointBalance.create(
          {
            customerId: customer.id,
            establishmentId: coupon.establishmentId,
            currentBalance: refundPoints,
            totalAccumulated: refundPoints,
          },
          { client: trx }
        )
      }

      // Devolver estoque se controlado
      const reward = await Reward.query({ client: trx })
        .where('id', coupon.rewardId)
        .forUpdate()
        .first()

      if (reward && reward.stock !== null) {
        reward.stock = reward.stock + 1
        await reward.useTransaction(trx).save()
      }

      // Inserir point_transactions com tipo REVERSAL vinculado ao coupon_redemption_id
      await PointTransaction.create(
        {
          customerId: customer.id,
          establishmentId: coupon.establishmentId,
          couponRedemptionId: coupon.id,
          type: 'REVERSAL',
          points: refundPoints,
          description: `Estorno por cancelamento de cupom: ${coupon.code}`,
          metadata: {
            couponId: coupon.id,
            couponCode: coupon.code,
            refundPoints,
            balanceAfter,
          },
        },
        { client: trx }
      )

      await trx.commit()

      await coupon.load('reward')
      await coupon.load('establishment')

      return response.ok(coupon)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * @index
   * @summary Listar cupons do consumidor autenticado com filtro opcional por status
   */
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const authData = await this.getCustomer(ctx)

    if (!authData) {
      return response.forbidden({ message: 'Apenas consumidores podem consultar cupons.' })
    }

    const { user } = authData
    const status = request.input('status')

    const query = CouponRedemption.query()
      .where('customerId', user.id)
      .preload('reward')
      .preload('establishment')
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const coupons = await query

    return response.ok(coupons)
  }
}
