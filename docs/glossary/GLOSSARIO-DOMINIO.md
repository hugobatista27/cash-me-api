# Glossário de Domínio (Ubiquitous Language)

Este documento estabelece o vocabulário padrão (Domain-Driven Design) que deve ser utilizado por desenvolvedores, designers e área de negócios.

*   **Consumidor (ou Cliente Final):** O usuário que baixa o aplicativo móvel, aceita os Termos Globais e escaneia notas fiscais para acumular pontos.
*   **Lojista (ou Estabelecimento Parceiro):** A entidade jurídica (CNPJ) cadastrada no sistema que utiliza o Painel Web (CRM) para configurar pontos e disparar campanhas.
*   **Conta Global:** Cadastro unificado do Consumidor. Uma única conta serve para pontuar em qualquer Lojista Parceiro do ecossistema.
*   **NFC-e (Nota Fiscal de Consumidor Eletrônica):** Documento fiscal emitido no ato da compra. Contém o QR Code que o sistema utiliza como fonte de dados de entrada.
*   **Chave de Acesso:** Código numérico único de 44 dígitos gerado pela SEFAZ, presente no QR Code da NFC-e. Fundamental para prevenção de fraudes.
*   **Worker de Scraping:** Aplicação em background responsável por extrair ("raspar") os dados da NFC-e diretamente da página web governamental (SEFAZ).
*   **String Bruta de Produto:** Texto exato correspondente à descrição do item consumido conforme impresso na nota fiscal (sem normalização via IA no MVP).
*   **Saldo Histórico:** O registro consolidado dos pontos de um Consumidor em um determinado Estabelecimento, que não deve ser perdido nem mesmo se o lojista for bloqueado.
*   **Inadimplência (ou Status Inativo) do Lojista:** Situação em que o Lojista não está em dia com a plataforma. Impede o cômputo de novos pontos, mas não oculta o Saldo Histórico do Consumidor.
*   **Tenant (Inquilino):** O contexto de dados exclusivo de um Lojista.
