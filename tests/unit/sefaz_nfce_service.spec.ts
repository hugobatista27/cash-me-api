import { test } from '@japa/runner'
import SefazNfceService, { SefazVerificationException } from '#services/sefaz_nfce_service'

function computeMod11Key(prefix43: string): string {
  let sum = 0
  let weight = 2
  for (let i = 42; i >= 0; i--) {
    sum += Number(prefix43[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  const rem = sum % 11
  const dv = rem === 0 || rem === 1 ? 0 : 11 - rem
  return `${prefix43}${dv}`
}

test.group('Unit | SEFAZ NFC-e Verification Service', () => {
  test('should validate module 11 check digit of 44-digit access key', ({ assert }) => {
    const service = new SefazNfceService()
    const validKey = computeMod11Key('4226101234567800019565001000000123100000123')
    const tamperedKey = `${validKey.slice(0, 43)}${(Number(validKey[43]) + 1) % 10}`

    assert.isTrue(service.validateAccessKeyCheckDigit(validKey))
    assert.isFalse(service.validateAccessKeyCheckDigit(tamperedKey))
  })

  test('should validate homologated SC/PR SEFAZ domains and reject phishing', ({ assert }) => {
    const service = new SefazNfceService()

    assert.isTrue(service.isValidSefazUrl('https://sat.sef.sc.gov.br/nfce/qrcode?p=123'))
    assert.isTrue(service.isValidSefazUrl('http://www.fazenda.pr.gov.br/nfce/qrcode?p=123'))
    assert.isFalse(service.isValidSefazUrl('https://fake-sef-sc.com/nfce/qrcode?p=123'))
    assert.isFalse(service.isValidSefazUrl('https://nfce.fazenda.sp.gov.br/qrcode?p=123'))
  })

  test('should override client-supplied totalAmount and issuedAt with authoritative SEFAZ HTML data', async ({
    assert,
  }) => {
    const service = new SefazNfceService()
    const validKey = computeMod11Key('4226111234567800019565001000000123100000123')

    const mockHtml = `
      <html>
        <body>
          <div>CNPJ: 12.345.678/0001-95</div>
          <span>${validKey}</span>
          <span>Emissão: 25/11/2026 14:30:00</span>
          <table>
            <tr>
              <td>
                <span class="txtTit">Café Espresso</span>
                <span class="Rqty">Qtde.: 2</span>
                <span class="RvlUnit">Vl. Unit.: 12,50</span>
                <span class="valor">Vl. Total: 25,00</span>
              </td>
            </tr>
          </table>
          <label>Valor a pagar</label><span class="txtMax">25,00</span>
        </body>
      </html>
    `

    const enriched = await service.verifyAndEnrich(
      {
        accessKey: validKey,
        qrCodeUrl: `https://sat.sef.sc.gov.br/nfce/qrcode?p=${validKey}`,
        issuerState: 'SC',
        issuerCnpj: '99999999000199',
        issuedAt: '2020-01-01T00:00:00Z',
        totalAmount: 99999.0,
      },
      {
        enforceSefaz: true,
        fetchImpl: async () => new Response(mockHtml, { status: 200 }),
      }
    )

    assert.equal(enriched.totalAmount, 25)
    assert.equal(enriched.issuerCnpj, '12345678000195')
    assert.equal(enriched.issuerState, 'SC')
    assert.lengthOf(enriched.items ?? [], 1)
    assert.equal(enriched.items![0].rawDescription, 'Café Espresso')
  })

  test('should reject when SEFAZ page returns CAPTCHA gate', async ({ assert }) => {
    const service = new SefazNfceService()
    const validKey = computeMod11Key('4226111234567800019565001000000123100000123')

    await assert.rejects(
      () =>
        service.verifyAndEnrich(
          {
            accessKey: validKey,
            qrCodeUrl: `https://sat.sef.sc.gov.br/nfce/qrcode?p=${validKey}`,
            issuerState: 'SC',
            issuerCnpj: '12345678000195',
            issuedAt: '2026-11-25T14:30:00Z',
            totalAmount: 25,
          },
          {
            enforceSefaz: true,
            fetchImpl: async () =>
              new Response('<div class="g-recaptcha">Resolva o captcha</div>', { status: 200 }),
          }
        ),
      SefazVerificationException
    )
  })
})
