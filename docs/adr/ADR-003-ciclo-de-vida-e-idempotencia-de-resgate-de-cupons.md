# ADR-003: Ciclo de Vida, Consistência Transacional e Idempotência no Resgate de Cupons

## Contexto
Com a introdução da funcionalidade de resgate de cupons de desconto por pontos, o sistema passa a realizar débitos no saldo dos clientes. Operações de débito de pontos e emissão de cupons introduzem riscos concorrenciais sérios:
1. **Double Spending (Gasto Duplo):** O consumidor pode tentar disparar múltiplos resgates simultâneos no app móvel com saldo insuficiente para ambos.
2. **Uso Duplicado de Cupom:** Um operador ou cliente pode tentar reutilizar o mesmo cupom múltiplas vezes no caixa.
3. **Bloqueio Injusto de Saldo:** Se o cupom não for utilizado dentro do prazo de validade ou se o cliente desistir da compra, os pontos não podem ser perdidos sem contraprestação comercial.

## Decisão
Decidimos adotar:
1. **Débito Atômico Imediato com Pessimistic Locking (`FOR UPDATE`):** No momento em que a requisição de resgate é recebida, o saldo do consumidor no lojista (`point_balances`) é travado via bloqueio pessimista na transação SQL, validado (`current_balance >= points_cost`), decrementado e uma movimentação `DEBIT` é inserida em `point_transactions`.
2. **Geração de Token Único e QR Code:** O cupom é gerado com um código alfanumérico curto de alta entropia (ex: 7 caracteres alfanuméricos únicos) e status inicial `ACTIVE`.
3. **Máquina de Estados Estrita do Cupom:**
   - `ACTIVE` -> `USED` (Consumido com sucesso no caixa via conferência pelo operador).
   - `ACTIVE` -> `CANCELLED` (Cancelamento voluntário pelo cliente no app móvel dentro do prazo).
   - `ACTIVE` -> `EXPIRED` (Expirado automaticamente por worker em background ao ultrapassar `expires_at`).
4. **Estorno Atômico Idempotente (`REVERSAL`):** Tanto a transição para `CANCELLED` quanto para `EXPIRED` disparam uma transação de estorno que devolve os pontos ao saldo (`point_balances.current_balance += points_cost`) e registra uma `point_transactions` do tipo `REVERSAL` vinculada ao cupom.
5. **Consumo no Caixa com Lock no Cupom:** A validação e marcação como `USED` executa `SELECT FOR UPDATE` no cupom para garantir que duas requisições concorrentes de validação do mesmo código resultem em erro na segunda ("Cupom já utilizado").

## Alternativas consideradas
1. **Reserva Temporária de Pontos (Duas fases / Hold):** Não debitar o saldo no resgate, mantendo apenas um `reserved_balance`, debitando efetivamente apenas na validação do caixa. Descartada por adicionar complexidade desnecessária ao cálculo de saldo projetado e extrato do cliente no app móvel (UX confusa).
2. **Débito Sem Estorno (Irreversível):** Descartada por gerar atrito e percepção de perda/injustiça ao consumidor caso o lojista não tenha estoque físico do produto ou o cupom expire sem visita à loja.

## Consequências

| Aspecto | Impacto | Descrição |
| :--- | :--- | :--- |
| **Integridade de Saldo (Anti-Fraude)** | Positivo | Impossibilita saldo negativo e gasto duplo mesmo sob alta concorrência de requisições paralelas. |
| **Experiência do Consumidor (UX)** | Positivo | Transparência total no extrato (débito imediato e estorno claro em caso de desistência ou vencimento). |
| **Operação de Caixa Ágil** | Positivo | Validação simples por código curto legível ou leitura rápida de QR Code no Painel Admin Web. |
| **Necessidade de Background Worker** | Neutro | Exige um scheduler/worker periódico (cron/BullMQ) para varrer cupons ativos vencidos e processar os estornos. |
