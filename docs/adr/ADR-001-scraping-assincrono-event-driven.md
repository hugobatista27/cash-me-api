# ADR-001: Processamento Assíncrono de Notas Fiscais via Event-Driven Design

## Contexto
A extração de dados governamentais (SEFAZ-SC e SEFAZ-PR) via Web Scraping é inerentemente instável. Portais podem sofrer lentidão, aplicar rate limits ou cair. Fazer com que o aplicativo mobile aguarde uma resposta síncrona com a tela bloqueada ("Processando...") resultaria em uma péssima experiência do usuário, timeouts no cliente e possível perda de dados.

## Decisão
Decidimos implementar uma arquitetura orientada a eventos (Event-Driven) para o processamento das NFC-es. O aplicativo enviará a URL do QR Code para o servidor e receberá uma resposta imediata (HTTP 202 Accepted), liberando o usuário da tela de escaneamento. O processamento será feito em background por Workers consumindo uma fila de mensageria.

## Alternativas consideradas
1.  **Requisição Síncrona HTTP:** Descartada devido à alta probabilidade de timeout no aplicativo e UX degradada.
2.  **Scraping no Client-Side (App Mobile):** Descartada por restrições de CORS, limitação de processamento, e impossibilidade de atualizar o script de scraping agilmente (exigiria aprovação na Apple/Google Play Store).

## Consequências

| Aspecto | Impacto | Descrição |
| :--- | :--- | :--- |
| **Experiência do Usuário (UX)** | Positivo | Usuário é liberado instantaneamente após o scan. Confirmação ocorre via Push Notification. |
| **Resiliência** | Positivo | Falhas na SEFAZ podem ser reprocessadas automaticamente pela fila (Retry Pattern) sem afetar o usuário. |
| **Manutenção** | Positivo | Os workers de scraping são isolados. Se o layout da SEFAZ mudar, um hot-fix é feito apenas no worker, sem downtime da API principal. |
| **Complexidade** | Negativo | Aumenta a complexidade da infraestrutura e exige integração robusta com serviços de Push Notification (FCM) para fechar o ciclo de feedback ao usuário. |
