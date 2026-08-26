# Issue #8: Dashboard Lojista com Filtro de Privacidade

- **Issue:** #8
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/8

## What to build

O Lojista visualiza os clientes cadastrados no seu Painel Web, mas somente os dados demográficos daqueles consumidores que já pontuaram no seu respectivo `estabelecimento_id`. (Atende à RN08 e ADR-002)

## Acceptance criteria

- [ ] Painel Web exibe lista de clientes.
- [ ] A query da API obriga o filtro pelo `estabelecimento_id` vinculado ao lojista logado.
- [ ] Somente consumidores com registro de pontuação no `estabelecimento_id` em questão são retornados.

## Blocked by

- Blocked by #5
