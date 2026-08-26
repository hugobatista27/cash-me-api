# Issue #6: Configuração Customizável de Regras de Conversão

- **Issue:** #6
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/6

## What to build

O Lojista consegue configurar um fator de conversão de pontos customizado (ex: R$10 = 1 Ponto) no seu Painel Admin, e o Motor de Cômputo passa a consultar e respeitar essa regra em tempo de execução. (Atende à RN04)

## Acceptance criteria

- [ ] Painel Admin Web possui formulário para o lojista configurar o fator de conversão.
- [ ] Motor de cômputo aplica essa regra variável em vez de uma regra estática ao processar `ScrapingCompletedEvent`.

## Blocked by

- Blocked by #5
