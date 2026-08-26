# Issue #3: Submissão de QR Code e Validação de Entrada

- **Issue:** #3
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/3

## What to build

O App mobile escaneia um QR Code de NFC-e e envia a URL para a API. A API valida o tempo (máx 48h), estado (somente SC/PR) e unicidade da chave (anti-fraude). Estando tudo certo, devolve `202 Accepted` ao App e publica um `NFCeScannedEvent` no Broker. (Atende às RN01, RN02, RN07 e ao ADR-001)

## Acceptance criteria

- [ ] App mobile possui fluxo para ler QR code ou inserir URL de NFC-e.
- [ ] API valida se o timestamp de emissão <= 48 horas.
- [ ] API valida se a URL pertence aos domínios autorizados da SEFAZ (SC ou PR).
- [ ] API valida se a chave de acesso de 44 dígitos é única (nunca processada antes).
- [ ] API retorna `202 Accepted` e posta o evento `NFCeScannedEvent` em uma fila assíncrona.

## Blocked by

- Blocked by #2
