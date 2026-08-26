# Issue #9: Notificações Push de Conclusão (FCM)

- **Issue:** #9
- **Status:** OPEN
- **Autor:** @hugobatista27
- **URL:** https://github.com/hugobatista27/cash-me-api/issues/9

## What to build

A API, ao finalizar todo o ciclo de cômputo e crédito de pontos (ou rejeição por regras), dispara um `PointsAwardedEvent` e envia uma notificação push via Firebase (FCM) direto para o dispositivo móvel, finalizando a UX assíncrona. (Atende ao ADR-001)

## Acceptance criteria

- [ ] Após cômputo bem-sucedido, API dispara evento `PointsAwardedEvent`.
- [ ] Listener integra com a API do FCM para enviar a notificação push para o device token do consumidor.
- [ ] App móvel está configurado para receber o push notification.

## Blocked by

- Blocked by #5
