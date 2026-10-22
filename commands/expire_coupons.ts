import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ExpireCouponsService from '#services/expire_coupons_service'

export default class ExpireCoupons extends BaseCommand {
  static commandName = 'coupons:expire'
  static description =
    'Varre e expira cupons vencidos (status = ACTIVE e expires_at < now) com estorno atômico de pontos (REVERSAL)'

  static aliases = ['expire:coupons']

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({
    description: 'Quantidade máxima de cupons a processar no lote',
    default: 100,
  })
  declare batch: number

  async run() {
    this.logger.info(`[Worker] Iniciando rotina de expiração de cupons (batch: ${this.batch})...`)

    const service = new ExpireCouponsService()
    const result = await service.execute(this.batch)

    this.logger.info(
      `[Worker] Finalizado: ${result.processed} cupons elegíveis encontrados, ${result.expired} expirados com estorno com sucesso, ${result.failed} falhas.`
    )

    if (result.errors.length > 0) {
      this.logger.error(`[Worker] Detalhes dos erros:`)
      for (const err of result.errors) {
        this.logger.error(` - Cupom #${err.couponId}: ${err.error}`)
      }
    }
  }
}
