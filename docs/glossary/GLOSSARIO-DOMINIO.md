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
*   **Recompensa (Reward):** Configuração de benefício ofertada pelo Lojista no seu catálogo, definindo o custo em pontos, modalidade de desconto (fixo em R$ ou percentual %), valor do benefício, valor mínimo de compra, estoque e validade.
*   **Cupom de Desconto (ou Voucher):** Instância de benefício resgatada pelo Consumidor a partir da troca de seus pontos acumulados. Contém código alfanumérico único curto, QR Code, prazo de expiração e status de utilização.
*   **Código de Validação do Cupom:** Identificador alfanumérico curto (6 a 8 caracteres) e único gerado na emissão do cupom, utilizado pelo operador do caixa para busca e validação rápida no Painel Web.
*   **Resgate de Pontos (Redemption):** Operação transacional atômica em que o Consumidor converte pontos em um Cupom de Desconto ativo, gerando débito (`DEBIT`) no extrato de pontos.
*   **Estorno de Resgate (Reversal):** Operação atômica que credita novamente os pontos na conta do Consumidor (`REVERSAL`) em caso de cancelamento voluntário do cupom ou expiração do prazo de validade sem utilização.
