# Issue #12: Validação e Consumo de Cupons no Caixa

- **Issue:** #12
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/12

## What to build

O operador do caixa no estabelecimento consulta e consome o cupom de desconto apresentado pelo consumidor no momento do pagamento, utilizando o Painel Admin Web (digitando o código alfanumérico de validação ou lendo o QR Code via leitor/câmera). A API valida se o cupom pertence ao estabelecimento logado (`establishment_id`), se está ativo e não expirado, e transiciona o status para `USED` de forma atômica e definitiva. (Atende à RN10, ADR-002 e ADR-003)

## Acceptance criteria

- [ ] Endpoint `POST /api/v1/establishments/coupons/verify`:
  - Recebe o código alfanumérico do cupom (`code`).
  - Valida se o cupom pertence ao tenant logado (`establishment_id`).
  - Verifica se o status é `ACTIVE` e se `expires_at >= now()`.
  - Retorna os dados do benefício (tipo de desconto, valor em R$ ou %, compra mínima exigida e nome do cliente) para conferência antes da confirmação.
- [ ] Endpoint `POST /api/v1/establishments/coupons/consume`:
  - Executa transação com lock pessimista (`SELECT FOR UPDATE`) no cupom.
  - Revalida se o status ainda é `ACTIVE` para evitar consumo duplo concorrente.
  - Atualiza o status para `USED`, gravando `used_at = now()` e `used_by_user_id = auth.user.id`.
- [ ] Interface no Painel Admin Web:
  - Módulo "Caixa / Validar Cupom" com input para digitação rápida do código.
  - Suporte a leitura via leitor de código de barras/QR Code ou câmera do dispositivo.
  - Modal de confirmação exibindo detalhes do desconto a ser aplicado na venda e botão "Confirmar Uso".
- [ ] Testes de integração cobrindo: cupom já utilizado (erro), cupom expirado (erro), cupom de outro lojista (bloqueio multi-tenant) e validação bem-sucedida.

## Blocked by

- Blocked by #1
- Blocked by #11
