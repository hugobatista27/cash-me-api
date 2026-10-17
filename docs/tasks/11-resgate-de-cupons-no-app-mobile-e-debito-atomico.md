# Issue #11: Resgate de Cupons no App Mobile e Débito Atômico

- **Issue:** #11
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/11

## What to build

O Consumidor visualiza as recompensas disponíveis para o estabelecimento onde possui pontos no App Mobile e realiza o resgate de cupons de desconto. A API processa a transação com bloqueio pessimista (`FOR UPDATE`) no saldo, debita os pontos imediatamente (`point_transactions` tipo `DEBIT`), gera o cupom em `coupon_redemptions` com código curto de alta entropia e QR Code, e define a data limite de uso. O consumidor pode visualizar seus cupons resgatados na aba "Meus Cupons" e cancelá-los voluntariamente antes do uso/expiração, com estorno atômico instantâneo (`REVERSAL`). Novos resgates são bloqueados caso o lojista esteja com status `INACTIVE`. (Atende às RN05, RN09, RN11 e ADR-003)

## Acceptance criteria

- [ ] Migration e Model Lucid da tabela `coupon_redemptions` criados e coluna `coupon_redemption_id` adicionada em `point_transactions`.
- [ ] Endpoint `GET /api/v1/customer/establishments/:id/rewards` retornando apenas recompensas com status `ACTIVE` e com estoque disponível do estabelecimento.
- [ ] Endpoint `POST /api/v1/customer/rewards/:id/redeem`:
  - Bloqueia com erro caso o estabelecimento esteja com `status = 'INACTIVE'` (RN11).
  - Executa transação SQL atômica com `SELECT FOR UPDATE` em `point_balances`.
  - Rejeita se `current_balance < points_cost` ou se o estoque da recompensa estiver zerado.
  - Debita os pontos do saldo e insere registro `DEBIT` em `point_transactions` vinculado ao `coupon_redemption_id`.
  - Decrementa estoque se controlado.
  - Gera código alfanumérico curto único (6 a 8 caracteres) e persiste cupom com status `ACTIVE` e `expires_at = now() + validity_days`.
- [ ] Endpoint `POST /api/v1/customer/coupons/:id/cancel`:
  - Permite cancelamento apenas se o cupom pertencer ao consumidor autenticado e estiver com status `ACTIVE`.
  - Transiciona status para `CANCELLED`, seta `cancelled_at = now()`.
  - Estorna os pontos para `point_balances.current_balance` e insere `point_transactions` com tipo `REVERSAL`.
- [ ] Telas no App Mobile: vitrine de recompensas por loja, confirmação de resgate, listagem "Meus Cupons" com renderização de QR Code, código em texto legível, validade e opção de cancelamento.
- [ ] Testes de concorrência automatizados comprovando prevenção de *Double Spending* (saldo negativo).

## Blocked by

- Blocked by #2
- Blocked by #5
- Blocked by #10
