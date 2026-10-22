import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import emitter from '@adonisjs/core/services/emitter'
import CouponRedemption from '#models/coupon_redemption'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import UserCustomer from '#models/user_customer'
import Reward from '#models/reward'
import CouponExpiredEvent from '#events/coupon_expired_event'

export interface ExpireResult {
  processed: number
  expired: number
  failed: number
  errors: Array<{ couponId: number; error: string }>
}

export default class ExpireCouponsService {
  /**
   * Processa a expiração em lote de cupons com status ACTIVE cuja validade expirou (expires_at < now()).
   * Utiliza consulta otimizada em lote e processamento transacional com lock pessimista (ADR-003).
   *
   * @param batchSize Quantidade máxima de cupons a processar por execução (padrão: 100)
   */
  async execute(batchSize: number = 100): Promise<ExpireResult> {
    const now = DateTime.now()

    // Consulta otimizada em lote utilizando o índice (status, expires_at)
    const expiredCoupons = await CouponRedemption.query()
      .where('status', 'ACTIVE')
      .where('expiresAt', '<', now.toSQL()!)
      .limit(batchSize)

    const result: ExpireResult = {
      processed: expiredCoupons.length,
      expired: 0,
      failed: 0,
      errors: [],
    }

    for (const coupon of expiredCoupons) {
      try {
        const wasExpired = await this.expireSingleCoupon(coupon.id)
        if (wasExpired) {
          result.expired++
        }
      } catch (err: any) {
        result.failed++
        result.errors.push({
          couponId: coupon.id,
          error: err.message || 'Erro desconhecido ao expirar cupom',
        })
      }
    }

    return result
  }

  /**
   * Processa a expiração atômica e idempotente de um único cupom.
   * Retorna true se expirou com sucesso, false se já não estava mais ACTIVE (idempotência).
   */
  async expireSingleCoupon(couponId: number): Promise<boolean> {
    const trx = await db.transaction()

    try {
      // 1. Lock pessimista no cupom para revalidar status
      const coupon = await CouponRedemption.query({ client: trx })
        .where('id', couponId)
        .forUpdate()
        .first()

      // Idempotência absoluta: se não existir ou já não for ACTIVE, ignora com segurança
      if (!coupon || coupon.status !== 'ACTIVE') {
        await trx.rollback()
        return false
      }

      // Revalida se realmente está expirado
      const now = DateTime.now()
      if (coupon.expiresAt >= now) {
        await trx.rollback()
        return false
      }

      // 2. Transiciona status do cupom para EXPIRED e registra cancelled_at
      coupon.status = 'EXPIRED'
      coupon.cancelledAt = now
      await coupon.useTransaction(trx).save()

      // 3. Localiza o customer_profile (user_customers) para vincular o saldo e transações
      const customer = await UserCustomer.query({ client: trx })
        .where('userId', coupon.customerId)
        .first()

      const customerId = customer ? customer.id : coupon.customerId

      // 4. Lock pessimista (SELECT FOR UPDATE) no registro de saldo (point_balances)
      const balance = await PointBalance.query({ client: trx })
        .where('customerId', customerId)
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
            customerId,
            establishmentId: coupon.establishmentId,
            currentBalance: refundPoints,
            totalAccumulated: refundPoints,
          },
          { client: trx }
        )
      }

      // 5. Restaura estoque da recompensa se controlado
      const reward = await Reward.query({ client: trx })
        .where('id', coupon.rewardId)
        .forUpdate()
        .first()

      if (reward && reward.stock !== null) {
        reward.stock = reward.stock + 1
        await reward.useTransaction(trx).save()
      }

      // 6. Registro no ledger imutável (point_transactions) com type = 'REVERSAL'
      await PointTransaction.create(
        {
          customerId,
          establishmentId: coupon.establishmentId,
          couponRedemptionId: coupon.id,
          type: 'REVERSAL',
          points: refundPoints,
          description: `Estorno por expiração de cupom: ${coupon.code}`,
          metadata: {
            couponId: coupon.id,
            couponCode: coupon.code,
            reason: 'EXPIRED',
            refundPoints,
            balanceAfter,
          },
        },
        { client: trx }
      )

      await trx.commit()

      // 7. Dispara evento de notificação / FCM
      emitter.emit('coupon:expired', new CouponExpiredEvent(coupon, refundPoints))

      return true
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
