# Regras de Negócio e Regras de Produto

Este documento descreve as regras de negócio puras que governam o ecossistema, separadas da lógica de infraestrutura.

## RN01 - Validação de Tempo de Emissão (48 Horas)
Notas fiscais cujo timestamp de emissão (presente na extração de dados) exceda 48 horas no momento da tentativa de escaneamento pelo Consumidor devem ser rejeitadas sumariamente pelo sistema.

## RN02 - Unicidade da Chave de Acesso (Anti-Fraude)
Cada chave de acesso de 44 dígitos da NFC-e só pode ser processada e computada **uma única vez** em toda a plataforma. Tentativas subsequentes devem ser bloqueadas com mensagem de "Nota já processada".

## RN03 - Vinculação Automatizada via CNPJ
A destinação dos pontos para a conta de um estabelecimento específico independe da geolocalização do usuário. É feita através de cruzamento exato (Match) do CNPJ Emitente extraído da nota fiscal contra a base de Lojistas cadastrados e ativos.

## RN04 - Regra de Cômputo Personalizável
A quantidade de pontos gerada por uma compra não é fixa. Deve respeitar o Fator de Conversão estipulado pelo Lojista no painel (ex: R$ 1,00 = 1 Ponto ou R$ 10,00 = 1 Ponto).

## RN05 - Proteção do Direito Adquirido (Inadimplência)
Se o status do Estabelecimento constar como inativo/inadimplente:
1.  A plataforma bloqueará o cômputo de novas NFC-es daquele CNPJ.
2.  A plataforma **não apagará** nem ocultará o Saldo Histórico do Consumidor da interface do App Mobile.

## RN06 - Processo de Onboarding de Lojistas
Novas contas de Lojistas (Estabelecimentos) são criadas com o status "Pendente de Aprovação". A visibilidade no ecossistema de Consumidores e o recebimento de dados ocorrem somente após validação manual (CNPJ vs. SEFAZ) por parte dos administradores da plataforma.

## RN07 - Restrição Geográfica (MVP)
O sistema aceitará exclusivamente URLs e formatos de QR Codes das Secretarias da Fazenda dos estados de Santa Catarina (SC) e Paraná (PR). NFC-es de outros estados devem ser rejeitadas em nível de entrada no App Mobile ou Gateway, sem processamento em fila.

## RN08 - Dados do Consumidor vs Privacidade
O Lojista só terá acesso a dados demográficos (Nome, e-mail e telefone) de consumidores que tenham efetivamente consumido e pontuado em seu estabelecimento ao menos uma vez, respeitando os Termos Globais do app.

## RN09 - Resgate de Cupons de Desconto por Pontos
1. O Consumidor pode utilizar seu saldo de pontos acumulado em um Estabelecimento Parceiro para resgatar cupons de desconto ofertados pelo lojista (desconto de valor fixo em R$ ou percentual %).
2. Ao solicitar o resgate no App Mobile, o sistema debita os pontos de forma atômica e imediata do saldo disponível do Consumidor no respectivo estabelecimento (`point_transactions` do tipo `DEBIT`).
3. O cupom gerado conterá um Código Alfanumérico curto único (6 a 8 caracteres) e um QR Code correspondente, além de uma data/hora de expiração definida pelas regras da Recompensa cadastrada pelo lojista.
4. O Consumidor pode cancelar voluntariamente um cupom com status ativo pelo aplicativo móvel antes de seu uso ou vencimento. Tanto no cancelamento voluntário quanto na expiração automática sem uso, o sistema realiza o estorno integral e automático dos pontos para o saldo do consumidor (`point_transactions` do tipo `REVERSAL`).

## RN10 - Validação e Consumo de Cupons no Caixa
1. A utilização do cupom de desconto ocorre no momento da compra presencial no estabelecimento, onde o operador do caixa digita o código alfanumérico ou lê o QR Code no Painel Admin Web.
2. O sistema valida se o cupom pertence ao estabelecimento logado (`establishment_id`), se o status é `ACTIVE` e se está dentro do prazo de validade (`expires_at >= now()`).
3. Ao ser confirmado pelo operador, o cupom é marcado como `USED` de forma atômica, registrando o timestamp de utilização e o operador responsável, impedindo qualquer reutilização ou estorno posterior.

## RN11 - Regras de Resgate em Caso de Inadimplência do Lojista
Se o status do Estabelecimento constar como inativo/inadimplente (`INACTIVE`):
1. A plataforma bloqueará a realização de **novos resgates** de cupons para aquele estabelecimento.
2. O consumidor continuará visualizando seu saldo histórico acumulado e os cupons previamente resgatados no app mobile, acompanhados de alerta informativo de indisponibilidade temporária do parceiro no app.
