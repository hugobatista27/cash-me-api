import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import Establishment from '#models/establishment'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import type UserCustomer from '#models/user_customer'
import { Exception } from '@adonisjs/core/exceptions'

import PointRule from '#models/point_rule'

export interface InvoiceItemInput {
  rawDescription: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ProcessInvoiceInput {
  accessKey: string
  qrCodeUrl: string
  issuerState: string
  issuerCnpj: string
  issuedAt: string | DateTime
  totalAmount: number
  items?: InvoiceItemInput[]
}

export class DuplicateInvoiceException extends Exception {
  static status = 409
  constructor(message = 'Esta NFC-e já foi processada anteriormente.') {
    super(message, { status: 409, code: 'E_DUPLICATE_INVOICE' })
  }
}

export default class PointsEngineService {
  /**
   * Computa a pontuação baseado no valor total e no fator de conversão legado/fallback.
   * Regra determinística arredondada para baixo (pontos inteiros).
   */
  computePoints(totalAmount: number, conversionFactor: number): number {
    if (totalAmount <= 0 || conversionFactor <= 0) {
      return 0
    }
    return Math.floor(totalAmount * conversionFactor)
  }

  /**
   * Computa a pontuação baseando-se em uma regra configurável (PointRule).
   * Respeita valor mínimo de compra, relação X reais = Y pontos, e teto máximo de bonificação.
   */
  computePointsFromRule(
    totalAmount: number,
    rule: {
      baseAmount: number
      pointsPerBase: number
      minPurchaseAmount?: number
      maxPointsPerPurchase?: number | null
    }
  ): number {
    if (totalAmount <= 0) {
      return 0
    }

    const minAmount = Number(rule.minPurchaseAmount) || 0
    if (totalAmount < minAmount) {
      return 0
    }

    const baseAmount = Number(rule.baseAmount) || 1.0
    const pointsPerBase = Number(rule.pointsPerBase) || 1

    if (baseAmount <= 0 || pointsPerBase <= 0) {
      return 0
    }

    let points = Math.floor(totalAmount / baseAmount) * pointsPerBase

    if (rule.maxPointsPerPurchase && rule.maxPointsPerPurchase > 0) {
      points = Math.min(points, rule.maxPointsPerPurchase)
    }

    return points
  }

  /**
   * Processa os dados de uma NFC-e submetida pelo frontend do Consumidor.
   */
  async processInvoice(customer: UserCustomer, data: ProcessInvoiceInput) {
    const cleanCnpj = data.issuerCnpj.replace(/\D/g, '')
    const cleanKey = data.accessKey.trim()
    const state = data.issuerState.trim().toUpperCase()

    // RN02: Unicidade da chave de acesso (Anti-Fraude)
    const existingInvoice = await Invoice.findBy('accessKey', cleanKey)
    if (existingInvoice) {
      throw new DuplicateInvoiceException()
    }

    // RN01: Validação de data de emissão (<= 48 horas)
    const issuedAt =
      typeof data.issuedAt === 'string'
        ? DateTime.fromISO(data.issuedAt)
        : data.issuedAt

    const now = DateTime.now()
    const hoursDiff = now.diff(issuedAt, 'hours').hours

    if (!issuedAt.isValid || hoursDiff > 48 || hoursDiff < -2) {
      const rejectedInvoice = await Invoice.create({
        customerId: customer.id,
        establishmentId: null,
        accessKey: cleanKey,
        qrCodeUrl: data.qrCodeUrl,
        issuerState: state,
        issuerCnpj: cleanCnpj,
        issuedAt: issuedAt.isValid ? issuedAt : now,
        totalAmount: data.totalAmount,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'EXPIRED_48H',
      })

      return {
        invoice: rejectedInvoice,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'EXPIRED_48H',
        balance: null,
      }
    }

    // RN07: Restrição geográfica (SC e PR)
    const allowedStates = ['SC', 'PR']
    if (!allowedStates.includes(state)) {
      const rejectedInvoice = await Invoice.create({
        customerId: customer.id,
        establishmentId: null,
        accessKey: cleanKey,
        qrCodeUrl: data.qrCodeUrl,
        issuerState: state,
        issuerCnpj: cleanCnpj,
        issuedAt,
        totalAmount: data.totalAmount,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'UNSUPPORTED_STATE',
      })

      return {
        invoice: rejectedInvoice,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'UNSUPPORTED_STATE',
        balance: null,
      }
    }

    // RN03: Cruzamento de CNPJ com lojista
    const establishment = await Establishment.findBy('cnpj', cleanCnpj)
    if (!establishment) {
      const rejectedInvoice = await Invoice.create({
        customerId: customer.id,
        establishmentId: null,
        accessKey: cleanKey,
        qrCodeUrl: data.qrCodeUrl,
        issuerState: state,
        issuerCnpj: cleanCnpj,
        issuedAt,
        totalAmount: data.totalAmount,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'ESTABLISHMENT_NOT_FOUND',
      })

      return {
        invoice: rejectedInvoice,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'ESTABLISHMENT_NOT_FOUND',
        balance: null,
      }
    }

    // RN05: Proteção do Direito Adquirido / Lojista Inativo
    if (establishment.status !== 'ACTIVE') {
      const rejectedInvoice = await Invoice.create({
        customerId: customer.id,
        establishmentId: establishment.id,
        accessKey: cleanKey,
        qrCodeUrl: data.qrCodeUrl,
        issuerState: state,
        issuerCnpj: cleanCnpj,
        issuedAt,
        totalAmount: data.totalAmount,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'INACTIVE_ESTABLISHMENT',
      })

      return {
        invoice: rejectedInvoice,
        pointsAwarded: 0,
        status: 'REJECTED',
        rejectionReason: 'INACTIVE_ESTABLISHMENT',
        balance: null,
      }
    }

    // Cômputo dos pontos: busca a regra ativa do estabelecimento ou usa fallback
    const activeRule = await PointRule.query()
      .where('establishmentId', establishment.id)
      .where('status', 'ACTIVE')
      .orderBy('version', 'desc')
      .first()

    let pointsAwarded = 0
    let appliedFactor = Number(establishment.conversionFactor) || 1.0
    let ruleId: number | null = null
    let ruleVersion: number | null = null

    if (activeRule) {
      pointsAwarded = this.computePointsFromRule(data.totalAmount, activeRule)
      appliedFactor = activeRule.pointsPerBase / Number(activeRule.baseAmount)
      ruleId = activeRule.id
      ruleVersion = activeRule.version
    } else {
      pointsAwarded = this.computePoints(data.totalAmount, appliedFactor)
    }

    // Transação atômica
    const trx = await db.transaction()

    try {
      // 1. Cria a fatura processada
      const invoice = await Invoice.create(
        {
          customerId: customer.id,
          establishmentId: establishment.id,
          accessKey: cleanKey,
          qrCodeUrl: data.qrCodeUrl,
          issuerState: state,
          issuerCnpj: cleanCnpj,
          issuedAt,
          totalAmount: data.totalAmount,
          pointsAwarded,
          status: 'PROCESSED',
          rejectionReason: null,
        },
        { client: trx }
      )

      // 2. Cria itens da nota, se houver
      if (data.items && data.items.length > 0) {
        await InvoiceItem.createMany(
          data.items.map((item) => ({
            invoiceId: invoice.id,
            rawDescription: item.rawDescription,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          { client: trx }
        )
      }

      // 3. Registra no Ledger Imutável (PointTransaction) com a versão da regra
      await PointTransaction.create(
        {
          customerId: customer.id,
          establishmentId: establishment.id,
          invoiceId: invoice.id,
          ruleId,
          ruleVersion,
          type: 'CREDIT',
          points: pointsAwarded,
          purchaseAmount: data.totalAmount,
          appliedConversionFactor: appliedFactor,
          description: `Pontos por compra em ${establishment.tradeName}`,
          metadata: {
            accessKey: cleanKey,
            totalAmount: data.totalAmount,
            conversionFactor: appliedFactor,
            pointsAwarded,
            ruleId,
            ruleVersion,
            ruleName: activeRule?.name,
            ruleSummary: activeRule?.humanReadableSummary,
          },
        },
        { client: trx }
      )

      // 4. Atualiza Saldo Multi-Tenant com lock pessimista (FOR UPDATE)
      let balance = await PointBalance.query({ client: trx })
        .where('customerId', customer.id)
        .where('establishmentId', establishment.id)
        .forUpdate()
        .first()

      if (balance) {
        balance.currentBalance = Number(balance.currentBalance) + pointsAwarded
        balance.totalAccumulated = Number(balance.totalAccumulated) + pointsAwarded
        await balance.useTransaction(trx).save()
      } else {
        balance = await PointBalance.create(
          {
            customerId: customer.id,
            establishmentId: establishment.id,
            currentBalance: pointsAwarded,
            totalAccumulated: pointsAwarded,
          },
          { client: trx }
        )
      }

      await trx.commit()

      return {
        invoice,
        pointsAwarded,
        status: 'PROCESSED',
        rejectionReason: null,
        balance,
        establishment,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
