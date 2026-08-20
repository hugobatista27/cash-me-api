# ADR-002: Arquitetura Multi-Tenant com Separação Lógica

## Contexto
O sistema atenderá centenas de pequenos negócios (lojistas). Precisamos garantir que os dados de clientes, histórico de vendas e painéis gerenciais sejam rigorosamente isolados para que um lojista nunca acesse dados de outro. Ao mesmo tempo, precisamos de uma infraestrutura com custo acessível (MVP).

## Decisão
Adotaremos uma Arquitetura Multi-Tenant com separação Lógica em um banco de dados relacional único (Single Database, Shared Schema). O isolamento ocorrerá a nível de aplicação, impondo que todas as consultas e operações obrigatoriamente possuam as chaves estrangeiras (`estabelecimento_id` e/ou `cnpj_emitente`).

## Alternativas consideradas
1.  **Database per Tenant (Física):** Criar um banco de dados para cada lojista. Descartada pelo alto custo de infraestrutura e complexidade excessiva de manutenção para um MVP.
2.  **Schema per Tenant:** Criar esquemas separados no banco para cada lojista. Descartada pela complexidade das migrações de banco de dados conforme o número de lojistas aumenta.

## Consequências

| Aspecto | Impacto | Descrição |
| :--- | :--- | :--- |
| **Custo de Infraestrutura** | Positivo | Uso otimizado de recursos rodando uma única instância de banco de dados para todos os lojistas. |
| **Agilidade (MVP)** | Positivo | Migrações (Migrations) e modelagem de dados simplificadas, agilizando o ciclo de desenvolvimento. |
| **Risco de Vazamento** | Negativo | Maior risco de vazamento de dados entre tenants se as queries forem mal construídas. Exige cobertura rigorosa de testes via TDD no módulo de Tenancy. |
| **Testabilidade** | Neutro | Exige criação de testes automatizados estritos (seam) focados em provar que payloads maliciosos não conseguem driblar o isolamento do tenant. |
