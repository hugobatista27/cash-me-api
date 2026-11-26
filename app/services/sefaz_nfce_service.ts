import { Exception } from '@adonisjs/core/exceptions'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { DateTime } from 'luxon'
import type { InvoiceItemInput, ProcessInvoiceInput } from '#services/points_engine_service'

export const HOMOLOGATED_SEFAZ_HOSTS = [
  'sat.sef.sc.gov.br',
  'fazenda.pr.gov.br',
  'www.fazenda.pr.gov.br',
  'dfe.sefa.pr.gov.br',
]

export class SefazVerificationException extends Exception {
  static status = 422
  constructor(message = 'Não foi possível verificar a autenticidade da NFC-e junto à SEFAZ.') {
    super(message, { status: 422, code: 'E_SEFAZ_VERIFICATION_FAILED' })
  }
}

export interface AccessKeyMetadata {
  ufCode: string
  issuerState: 'SC' | 'PR' | null
  aamm: string
  cnpj: string
  model: string
  isValidCheckDigit: boolean
}

export interface ParsedSefazDocument {
  accessKey: string
  issuerCnpj: string | null
  totalAmount: number
  issuedAt: DateTime | null
  items: InvoiceItemInput[]
  hasCaptcha: boolean
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export default class SefazNfceService {
  /**
   * Valida se a URL pertence a um portal oficial da SEFAZ SC ou PR (RN07).
   */
  isValidSefazUrl(urlStr?: string | null): boolean {
    if (!urlStr) return false
    try {
      const url = new URL(urlStr)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return false
      }
      const host = url.hostname.toLowerCase()
      return HOMOLOGATED_SEFAZ_HOSTS.some(
        (validHost) => host === validHost || host.endsWith(`.${validHost}`)
      )
    } catch {
      return false
    }
  }

  /**
   * Valida o dígito verificador (módulo 11) da chave de acesso de 44 dígitos da NF-e/NFC-e.
   */
  validateAccessKeyCheckDigit(accessKey: string): boolean {
    const clean = accessKey.replace(/\D/g, '')
    if (clean.length !== 44) return false

    let sum = 0
    let weight = 2
    for (let i = 42; i >= 0; i--) {
      sum += Number(clean[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }

    const remainder = sum % 11
    const expectedDv = remainder === 0 || remainder === 1 ? 0 : 11 - remainder
    return Number(clean[43]) === expectedDv
  }

  /**
   * Extrai metadados estruturais da chave de acesso de 44 dígitos.
   */
  parseAccessKeyMetadata(accessKey: string): AccessKeyMetadata {
    const clean = accessKey.replace(/\D/g, '')
    const ufCode = clean.slice(0, 2)
    const issuerState = ufCode === '42' ? 'SC' : ufCode === '41' ? 'PR' : null

    return {
      ufCode,
      issuerState,
      aamm: clean.slice(2, 6),
      cnpj: clean.slice(6, 20),
      model: clean.slice(20, 22),
      isValidCheckDigit: this.validateAccessKeyCheckDigit(clean),
    }
  }

  private parseBrlNumber(val: string): number {
    if (!val) return 0
    const match = val.match(/-?\d[\d.,]*/)
    if (!match) return 0
    const token = match[0]
    const cleaned = token.includes(',') ? token.replace(/\./g, '').replace(',', '.') : token
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
      .replace(/<style[^>]*>([\S\s]*?)<\/style>/gim, '')
      .replace(/<[^>]+>/gm, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Extrai os campos fiscais autoritativos do HTML retornado pela SEFAZ.
   */
  parseSefazHtml(html: string, fallbackKey: string): ParsedSefazDocument {
    const plainText = this.stripHtml(html)
    const hasCaptcha =
      /g-recaptcha|h-captcha|cf-turnstile|captcha/i.test(html) &&
      !/valor\s+(?:a\s+pagar|total)/i.test(plainText)

    const chaveMatch =
      html.match(
        /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/
      ) || plainText.match(/(\d{44})/)
    const accessKey = chaveMatch ? chaveMatch[1].replace(/[\s-]/g, '') : fallbackKey

    const cnpjMatch =
      html.match(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/) ||
      plainText.match(/CNPJ[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})/i)
    const issuerCnpj = cnpjMatch ? cnpjMatch[1].replace(/\D/g, '') : null

    const valorPagarMatch =
      html.match(
        /(?:Valor\s+a\s+pagar)[^<]*<\/label>[\s\S]*?<span[^>]*class=["'][^"']*(?:txtMax|totalNumb)[^"']*["'][^>]*>([\d.,]+)<\/span>/i
      ) ||
      plainText.match(/(?:Valor\s+a\s+pagar)[:\s]*(?:R\$)?\s*([\d.,]+)/i) ||
      plainText.match(/(?:Valor\s+total(?:\s*R\$)?|Total\s+R\$)[:\s]*(?:R\$)?\s*([\d.,]+)/i)

    const totalAmount = valorPagarMatch ? this.parseBrlNumber(valorPagarMatch[1]) : 0

    let issuedAt: DateTime | null = null
    const dataMatch = plainText.match(
      /(?:Emissão|Data da Emissão)[:\s]*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/i
    )
    if (dataMatch) {
      const rawDate = dataMatch[1].trim()
      const format =
        rawDate.length === 10
          ? 'dd/MM/yyyy'
          : rawDate.length === 16
            ? 'dd/MM/yyyy HH:mm'
            : 'dd/MM/yyyy HH:mm:ss'
      const dt = DateTime.fromFormat(rawDate, format, { zone: 'America/Sao_Paulo' })
      if (dt.isValid) {
        issuedAt = dt
      }
    }

    const items: InvoiceItemInput[] = []
    const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
    for (const tr of trMatches) {
      const descMatch = tr.match(
        /class=["'][^"']*(?:txtTit|descricao|nome)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
      )
      const vlTotalMatch =
        tr.match(
          /class=["'][^"']*(?:valor|Rval|total)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Vl\.?\s*Total[:\s]*([\d.,]+)/i)
      const qtdMatch =
        tr.match(
          /class=["'][^"']*(?:Rqty|qtd|quantidade)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Qtde?\.?[:\s]*([\d.,]+)/i)
      const vlUnitMatch =
        tr.match(
          /class=["'][^"']*(?:RvlUnit|vlUnit|unitario)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Vl\.?\s*Unit\.?[:\s]*([\d.,]+)/i)

      if (descMatch && vlTotalMatch) {
        const rawDescription = this.stripHtml(descMatch[1]).slice(0, 255)
        const totalPrice = this.parseBrlNumber(this.stripHtml(vlTotalMatch[1]))
        const quantity = qtdMatch ? this.parseBrlNumber(this.stripHtml(qtdMatch[1])) || 1 : 1
        const unitPrice = vlUnitMatch
          ? this.parseBrlNumber(this.stripHtml(vlUnitMatch[1]))
          : quantity > 0
            ? totalPrice / quantity
            : 0

        if (rawDescription && totalPrice >= 0) {
          items.push({ rawDescription, quantity, unitPrice, totalPrice })
        }
      }
    }

    return {
      accessKey,
      issuerCnpj,
      totalAmount,
      issuedAt,
      items,
      hasCaptcha,
    }
  }

  /**
   * Verifica e enriquece o payload de NFC-e no servidor.
   * Quando `NFCE_VERIFY_SEFAZ=true` ou em produção, consulta a URL oficial da SEFAZ
   * e sobrescreve CNPJ, UF, data de emissão, valor total e itens pelos dados reais do portal.
   */
  async verifyAndEnrich(
    input: ProcessInvoiceInput,
    options?: { enforceSefaz?: boolean; fetchImpl?: FetchLike }
  ): Promise<ProcessInvoiceInput> {
    const enforceSefaz =
      options?.enforceSefaz ?? (app.inProduction || env.get('NFCE_VERIFY_SEFAZ') === true)

    if (!enforceSefaz) {
      return input
    }

    if (!this.isValidSefazUrl(input.qrCodeUrl)) {
      throw new SefazVerificationException(
        'A URL do QR Code não pertence a um portal SEFAZ homologado (SC ou PR).'
      )
    }

    const cleanKey = input.accessKey.replace(/\D/g, '')
    const keyMeta = this.parseAccessKeyMetadata(cleanKey)
    if (!keyMeta.isValidCheckDigit) {
      throw new SefazVerificationException(
        'Chave de acesso da NFC-e com dígito verificador inválido.'
      )
    }

    if (!keyMeta.issuerState) {
      throw new SefazVerificationException('Chave de acesso fora dos estados homologados (SC/PR).')
    }

    const fetchImpl = options?.fetchImpl ?? globalThis.fetch
    let response: Response
    try {
      response = await fetchImpl(input.qrCodeUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'CashMe-API/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
    } catch {
      throw new SefazVerificationException(
        'Não foi possível consultar o portal da SEFAZ no momento. Tente novamente.'
      )
    }

    if (!response.ok) {
      throw new SefazVerificationException(
        `Portal da SEFAZ retornou erro HTTP ${response.status} ao verificar a nota.`
      )
    }

    const html = await response.text()
    const parsed = this.parseSefazHtml(html, cleanKey)

    if (parsed.hasCaptcha) {
      throw new SefazVerificationException(
        'O portal da SEFAZ exigiu verificação CAPTCHA para esta nota fiscal.'
      )
    }

    if (!parsed.issuerCnpj || parsed.totalAmount <= 0 || !parsed.issuedAt) {
      throw new SefazVerificationException(
        'Não foi possível extrair CNPJ, valor total ou data de emissão válidos no portal da SEFAZ.'
      )
    }

    return {
      ...input,
      accessKey: cleanKey,
      issuerState: keyMeta.issuerState,
      issuerCnpj: parsed.issuerCnpj,
      issuedAt: parsed.issuedAt,
      totalAmount: parsed.totalAmount,
      items: parsed.items.length > 0 ? parsed.items : input.items,
    }
  }
}
