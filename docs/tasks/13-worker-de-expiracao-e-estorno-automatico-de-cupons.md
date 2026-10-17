# Issue #13: Worker de Expiração e Estorno Automático de Cupons

- **Issue:** #13
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/13

## What to build

Um worker/scheduler assíncrono executa periodicamente para identificar cupons em aberto (`status = 'ACTIVE'`) cuja data limite foi ultrapassada (`expires_at < now()`). O worker processa de forma atômica e idempotente a expiração do cupom, atualizando seu status para `EXPIRED`, estornando integralmente os pontos debitados para o saldo do cliente (`point_balances`) e inserindo um lançamento de estorno (`REVERSAL`) no extrato. Ao concluir o estorno, dispara evento de notificação push via FCM informando o cliente sobre o estorno dos pontos. (Atende às RN09, ADR-001 e ADR-003)

## Acceptance criteria

- [ ] Comando Ace ou Schedule Runner (ex: a cada hora) configurado para execução do job de expiração.
- [ ] Consulta otimizada em lote utilizando o índice `(status, expires_at)` buscando cupons elegíveis: `status = 'ACTIVE' AND expires_at < NOW()`.
- [ ] Processamento transacional por cupom:
  - Bloqueio com lock pessimista no saldo do consumidor correspondente (`point_balances`).
  - Atualização do status do cupom para `EXPIRED` e gravação de `cancelled_at = now()`.
  - Incremento do saldo disponível: `current_balance += points_cost`.
  - Criação de transação em `point_transactions` com `type = 'REVERSAL'`, referenciando `coupon_redemption_id` e descrição clara (ex: "Estorno por expiração de cupom").
- [ ] Disparo de notificação push FCM informando o consumidor sobre a expiração do cupom e a restauração do saldo de pontos em sua conta (integração com Task #9).
- [ ] Garantia de idempotência absoluta: execuções repetidas da rotina ignoram cupons já marcados como `EXPIRED` ou `CANCELLED` e não duplicam créditos.
- [ ] Testes automatizados cobrindo a rotina de expiração em lote e validação de saldos restaurados.

## Blocked by

- Blocked by #9
- Blocked by #11
