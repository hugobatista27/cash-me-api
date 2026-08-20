# Documento de Design de Software (SDD) - Visão Geral da Arquitetura

## 1. Visão Geral do Sistema
O sistema é um ecossistema de fidelização unificado composto por um aplicativo mobile híbrido (React Native) para consumidores finais e um painel administrativo Web (CRM simplificado) para lojistas. O objetivo é permitir que os usuários pontuem automaticamente ao escanear o QR Code de NFC-es de SC e PR, sem fricção no caixa.

## 2. Padrões de Projeto e Arquitetura

### 2.1 Event-Driven Design (EDD)
A arquitetura principal de processamento de notas fiscais segue o paradigma orientado a eventos para garantir alta disponibilidade e desacoplamento:
*   **Eventos Principais:** 
    *   `NFCeScannedEvent`: Disparado quando o app mobile envia a URL do QR Code.
    *   `ScrapingCompletedEvent`: Disparado pelo Worker ao finalizar a extração dos dados na SEFAZ.
    *   `ScrapingFailedEvent`: Disparado em caso de timeout/erro na SEFAZ, acionando a política de retries.
    *   `PointsAwardedEvent`: Disparado após a validação e cômputo dos pontos, engatilhando o disparo de push notification.
*   **Mensageria:** Filas assíncronas (ex: RabbitMQ, SQS, ou Redis/Bull) processadas por Workers isolados.

### 2.2 Test-Driven Development (TDD)
O desenvolvimento das regras de negócio, especialmente o motor de isolamento de dados (Multi-Tenant) e o módulo Anti-Fraude, seguirão a abordagem TDD.
*   **Foco dos Testes:** Comportamento externo exposto pelas APIs REST, resiliência dos fluxos de estado, e isolamento por `estabelecimento_id`.
*   **Mocks:** Os testes do módulo de mensageria utilizarão Mocks das respostas da SEFAZ para garantir que o comportamento do sistema seja testado independentemente da instabilidade do portal governamental.

## 3. Componentes Principais

1.  **Mobile App (React Native):** Interface do consumidor. Foca apenas em capturar o QR Code e exibir dados. Não possui lógica pesada.
2.  **Painel Admin Web (React):** CRM do lojista. Permite visualização de clientes, configuração de regras de pontos e disparo de notificações.
3.  **API Gateway & Core API (Node.js/Adonis):** Recebe as requisições, valida tenants, persiste dados preliminares e despacha eventos.
4.  **Message Broker:** Fila que gerencia os eventos assíncronos de scraping.
5.  **Scraper Workers:** Módulos independentes (e de fácil deploy/hot-fix) responsáveis por simular navegação, contornar instabilidades e extrair dados brutos em SC e PR.
6.  **Banco de Dados Relacional (PostgreSQL):** Estrutura Multi-Tenant isolada logicamente pelas chaves `estabelecimento_id` e `cnpj_emitente`.
7.  **Firebase Cloud Messaging (FCM):** Serviço de mensageria em nuvem para envio de Push Notifications (transacionais e campanhas).

## 4. Diagrama Lógico de Comunicação (Macro)
`App -> API Core (retorna 202 Accepted) -> Broker -> Worker (Scraping) -> Broker -> API Core (Validação & DB) -> FCM -> App (Push Notification)`
