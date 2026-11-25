import type { HttpContext } from '@adonisjs/core/http'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import PointBalanceTransformer from '#transformers/point_balance_transformer'
import PointTransactionTransformer from '#transformers/point_transaction_transformer'

export default class CustomerPointsController {
  /**
   * @balances
   * @summary Consultar saldos de pontos do consumidor em todos os estabelecimentos
   * @responseBody 200 - [{"id": 1, "currentBalance": 150, "totalAccumulated": 150, "establishment": {"id": 1, "tradeName": "Padaria Real"}}]
   */
  async balances({ auth, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return response.forbidden({ message: 'Apenas consumidores possuem saldo de pontos.' })
    }

    const balances = await PointBalance.query()
      .where('customerId', user.customerProfile.id)
      .preload('establishment')
      .orderBy('updatedAt', 'desc')

    return serialize(PointBalanceTransformer.transform(balances))
  }

  /**
   * @statement
   * @summary Consultar extrato de movimentações de pontos em um estabelecimento específico
   * @responseBody 200 - [{"id": 1, "type": "CREDIT", "points": 150, "description": "Pontos por compra..."}]
   */
  async statement({ auth, params, serialize, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((loader) => loader.load('customerProfile'))

    if (!user.customerProfile) {
      return response.forbidden({ message: 'Acesso negado.' })
    }

    const transactions = await PointTransaction.query()
      .where('customerId', user.customerProfile.id)
      .where('establishmentId', params.establishmentId)
      .orderBy('createdAt', 'desc')

    return serialize(PointTransactionTransformer.transform(transactions))
  }
}
