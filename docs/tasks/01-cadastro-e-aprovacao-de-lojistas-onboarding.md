# Issue #1: Cadastro e Aprovação de Lojistas (Onboarding)

- **Issue:** #1
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/1

## What to build

A interface web permite o cadastro inicial de Lojistas (com status "Pendente") e uma rota super-admin os aprova. Estabelece o schema base do tenant (Estabelecimento) com seu CNPJ. (Atende à RN06)

## Acceptance criteria

- [ ] API endpoint permite a criação atômica de um lojista com status inicial `PENDING`, incluindo dados cadastrais, endereço e usuário gestor (`LOJISTA_ADMIN`).
- [ ] API endpoint restrito permite a aprovação/ativação do lojista (`status = 'ACTIVE'`).
- [ ] Migrations e Models contemplam as tabelas `establishments` e `establishment_addresses` conforme documentado em `docs/architecture/ESTRUTURA-DADOS-COMERCIO.md`.

## Blocked by

- None (can start immediately)
