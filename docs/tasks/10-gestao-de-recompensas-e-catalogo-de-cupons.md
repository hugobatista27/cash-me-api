# Issue #10: Gestão de Recompensas e Catálogo de Cupons

- **Issue:** #10
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/10

## What to build

O Lojista consegue criar, editar, ativar/desativar e consultar o catálogo de recompensas (cupons de desconto em valor fixo R$ ou percentual %) através do Painel Admin Web. A API disponibiliza os endpoints necessários com isolamento estrito por tenant (`establishment_id`). (Atende à RN09 e ADR-002)

## Acceptance criteria

- [ ] Migration e Model Lucid da tabela `rewards` criados com colunas: `establishment_id`, `title`, `description`, `discount_type` (`FIXED_AMOUNT`, `PERCENTAGE`), `discount_value`, `min_purchase_amount`, `max_discount_amount`, `points_cost`, `stock`, `validity_days` e `status`.
- [ ] Endpoints REST protegidos para o Lojista (`/api/v1/establishments/rewards`): Listar catálogo próprio, Criar recompensa, Atualizar e Alterar status (`ACTIVE`, `INACTIVE`, `ARCHIVED`).
- [ ] Validações de integridade: `points_cost > 0`, `discount_value > 0`, `validity_days >= 1`, e teto obrigatório se percentual.
- [ ] Interface no Painel Admin Web com listagem das recompensas cadastradas e modal/formulário para criação e edição.
- [ ] Testes de integração garantindo que um lojista não consegue visualizar nem modificar recompensas pertencentes a outro tenant (ADR-002).

## Blocked by

- Blocked by #1
