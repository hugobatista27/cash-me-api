# Issue #5: Motor de Cômputo de Pontos e Isolamento Multi-Tenant

- **Issue:** #5
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/5

## What to build

A API consome o evento de scraping completo, cruza o CNPJ extraído com um Lojista ativo da base. O sistema adiciona os pontos correspondentes ao Saldo Histórico do Consumidor, isolando a transação via `estabelecimento_id`. O consumidor passa a ver seu saldo atualizado no App. (Atende às RN03 e ADR-002)

## Acceptance criteria

- [ ] Listener da API consome `ScrapingCompletedEvent`.
- [ ] Busca um lojista ativo correspondente ao `cnpj_emitente`.
- [ ] Computa a pontuação utilizando uma regra base (ex: 1 para 1) e adiciona ao saldo do consumidor no `estabelecimento_id`.
- [ ] Garante que o insert/update de pontos exija o `estabelecimento_id` (Isolamento).
- [ ] App mobile exibe o Saldo Histórico (pontos) do consumidor atualizado.

## Blocked by

- Blocked by #1
- Blocked by #4
