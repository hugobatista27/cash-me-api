# Issue #7: Proteção de Inadimplência e Manutenção do Saldo

- **Issue:** #7
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/7

## What to build

Se um Lojista é marcado como inativo/inadimplente pela plataforma, novas NFC-es processadas no seu CNPJ são rejeitadas. Contudo, o Saldo Histórico passado permanece imutável e visível para o Consumidor no App. (Atende à RN05)

## Acceptance criteria

- [ ] Motor de cômputo verifica o status do Lojista; se inativo, bloqueia a soma de novos pontos.
- [ ] As consultas de saldo no App móvel continuam retornando o histórico sem modificações, mesmo de lojistas inativos.

## Blocked by

- Blocked by #5
