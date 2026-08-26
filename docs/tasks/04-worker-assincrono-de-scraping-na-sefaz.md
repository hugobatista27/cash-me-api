# Issue #4: Worker Assíncrono de Scraping na SEFAZ

- **Issue:** #4
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/4

## What to build

Um Worker independente consome o evento de scan, simula a navegação nas páginas da SEFAZ, extrai o valor total e o CNPJ do emissor da nota, e publica o evento `ScrapingCompletedEvent` ou `ScrapingFailedEvent`. (Atende à Arquitetura Event-Driven e ADR-001)

## Acceptance criteria

- [ ] Worker consome o evento `NFCeScannedEvent` da fila.
- [ ] Worker realiza o scraping na página correspondente da SEFAZ.
- [ ] Worker extrai com sucesso o `cnpj_emitente` e o valor computável.
- [ ] Worker emite `ScrapingCompletedEvent` com os dados, ou `ScrapingFailedEvent` em caso de falha temporária.

## Blocked by

- Blocked by #3
