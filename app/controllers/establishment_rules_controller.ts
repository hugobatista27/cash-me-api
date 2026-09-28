import type { HttpContext } from '@adonisjs/core/http'
import Establishment from '#models/establishment'
import LoyaltyProgram from '#models/loyalty_program'
import PointRule from '#models/point_rule'
import PointsEngineService from '#services/points_engine_service'
import {
  updateLoyaltyRuleValidator,
  simulateRuleValidator,
} from '#validators/loyalty_rule_validator'
import PointRuleTransformer from '#transformers/point_rule_transformer'
import { inject } from '@adonisjs/core'

@inject()
export default class EstablishmentRulesController {
  constructor(protected pointsEngine: PointsEngineService) {}

  /**
   * Helper para carregar o perfil do estabelecimento autenticado
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
   * @show
   * @summary Obter regra de fidelidade ativa do estabelecimento autenticado
   * @responseBody 200 - {"id": 1, "version": 1, "baseAmount": 10.00, "pointsPerBase": 1, "humanReadableSummary": "A cada R$ 10,00 você ganha 1 ponto."}
   */
  async show(ctx: HttpContext) {
    const { serialize, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    let program = await LoyaltyProgram.findBy('establishmentId', establishment.id)
    if (!program) {
      program = await LoyaltyProgram.create({
        establishmentId: establishment.id,
        name: 'Programa de Fidelidade',
        status: 'ACTIVE',
        pointsCurrency: 'pontos',
      })
    }

    let activeRule = await PointRule.query()
      .where('establishmentId', establishment.id)
      .where('status', 'ACTIVE')
      .orderBy('version', 'desc')
      .first()

    if (!activeRule) {
      // Cria a versão 1 inicial herdando o fator de conversão do estabelecimento
      const factor = Number(establishment.conversionFactor) || 1.0
      const baseAmount = factor < 1 ? Math.round(1 / factor) : 1.0
      const pointsPerBase = factor >= 1 ? Math.round(factor) : 1

      activeRule = await PointRule.create({
        loyaltyProgramId: program.id,
        establishmentId: establishment.id,
        version: 1,
        name: 'Regra Base Inicial',
        status: 'ACTIVE',
        baseAmount,
        pointsPerBase,
        minPurchaseAmount: 0.0,
        maxPointsPerPurchase: null,
      })
    }

    return serialize(PointRuleTransformer.transform(activeRule))
  }

  /**
   * @update
   * @summary Atualizar e versionar regra de conversão de pontos do estabelecimento
   * @requestBody {"baseAmount": 10.00, "pointsPerBase": 1, "minPurchaseAmount": 0.00, "maxPointsPerPurchase": 500, "name": "1 ponto a cada R$ 10"}
   * @responseBody 200 - {"id": 2, "version": 2, "baseAmount": 10.00, "pointsPerBase": 1, "status": "ACTIVE"}
   */
  async update(ctx: HttpContext) {
    const { request, serialize, response, auth } = ctx
    const user = auth.getUserOrFail()
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(updateLoyaltyRuleValidator)

    let program = await LoyaltyProgram.findBy('establishmentId', establishment.id)
    if (!program) {
      program = await LoyaltyProgram.create({
        establishmentId: establishment.id,
        name: 'Programa de Fidelidade',
        status: 'ACTIVE',
        pointsCurrency: 'pontos',
      })
    }

    const lastRule = await PointRule.query()
      .where('loyaltyProgramId', program.id)
      .orderBy('version', 'desc')
      .first()

    const nextVersion = lastRule ? lastRule.version + 1 : 1

    // Inativa a regra anterior
    await PointRule.query()
      .where('loyaltyProgramId', program.id)
      .where('status', 'ACTIVE')
      .update({ status: 'INACTIVE' })

    // Cria a nova versão imutável da regra
    const newRule = await PointRule.create({
      loyaltyProgramId: program.id,
      establishmentId: establishment.id,
      createdBy: user.id,
      version: nextVersion,
      name: payload.name || `Regra de Fidelidade v${nextVersion}`,
      status: 'ACTIVE',
      baseAmount: payload.baseAmount,
      pointsPerBase: payload.pointsPerBase,
      minPurchaseAmount: payload.minPurchaseAmount ?? 0.0,
      maxPointsPerPurchase: payload.maxPointsPerPurchase ?? null,
    })

    // Mantém espelho retroativo em establishments.conversion_factor
    establishment.conversionFactor = payload.pointsPerBase / payload.baseAmount
    await establishment.save()

    return serialize(PointRuleTransformer.transform(newRule))
  }

  /**
   * @simulate
   * @summary Simular cálculo de pontuação para um valor de compra
   * @responseBody 200 - {"purchaseAmount": 150.00, "calculatedPoints": 15, "humanReadableSummary": "A cada R$ 10,00 você ganha 1 ponto."}
   */
  async simulate(ctx: HttpContext) {
    const { request, serialize, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const payload = await request.validateUsing(simulateRuleValidator)

    let activeRule = await PointRule.query()
      .where('establishmentId', establishment.id)
      .where('status', 'ACTIVE')
      .orderBy('version', 'desc')
      .first()

    const ruleConfig = {
      baseAmount: payload.baseAmount ?? (activeRule ? Number(activeRule.baseAmount) : 1.0),
      pointsPerBase: payload.pointsPerBase ?? (activeRule ? activeRule.pointsPerBase : 1),
      minPurchaseAmount:
        payload.minPurchaseAmount ?? (activeRule ? Number(activeRule.minPurchaseAmount) : 0),
      maxPointsPerPurchase:
        payload.maxPointsPerPurchase !== undefined
          ? payload.maxPointsPerPurchase
          : activeRule?.maxPointsPerPurchase,
    }

    const calculatedPoints = this.pointsEngine.computePointsFromRule(payload.amount, ruleConfig)

    // Cria objeto temporário de PointRule para extrair a frase humana
    const dummyRule = new PointRule()
    dummyRule.baseAmount = ruleConfig.baseAmount
    dummyRule.pointsPerBase = ruleConfig.pointsPerBase
    dummyRule.minPurchaseAmount = ruleConfig.minPurchaseAmount
    dummyRule.maxPointsPerPurchase = ruleConfig.maxPointsPerPurchase ?? null

    return serialize({
      purchaseAmount: payload.amount,
      calculatedPoints,
      ruleApplied: ruleConfig,
      humanReadableSummary: dummyRule.humanReadableSummary,
    })
  }

  /**
   * @history
   * @summary Consultar histórico de todas as versões de regras de fidelidade do lojista
   * @responseBody 200 - [{"id": 2, "version": 2, "status": "ACTIVE"}, {"id": 1, "version": 1, "status": "INACTIVE"}]
   */
  async history(ctx: HttpContext) {
    const { serialize, response } = ctx
    const establishment = await this.getEstablishment(ctx)

    if (!establishment) {
      return response.forbidden({ message: 'Perfil de estabelecimento não encontrado.' })
    }

    const rules = await PointRule.query()
      .where('establishmentId', establishment.id)
      .orderBy('version', 'desc')

    return serialize(PointRuleTransformer.transform(rules))
  }
}
