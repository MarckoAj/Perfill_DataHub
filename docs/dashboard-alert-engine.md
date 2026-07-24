# Dashboard e Alert Engine

## Objetivo

Este documento registra o escopo do dashboard operacional e do motor de alertas do Perfill Data Hub.

## Estado Atual

- Dashboard NOC disponivel em `/noc`.
- Central de alertas disponivel em `/alerts`.
- APIs de alertas disponiveis em `/api/alerts`.
- `RuleEngine` implementado em `src/engine/RuleEngine.js`.
- Regras modulares em `src/engine/rules`.
- Persistencia de alertas via `alertRepository`.
- Broadcast de eventos via `alertBroadcaster`.

## Dashboard NOC

O dashboard NOC e uma tela de alta densidade para acompanhamento operacional. Ele prioriza:

- visibilidade de chamados criticos;
- contadores e filtros de severidade;
- leitura rapida de SLA;
- atualizacao operacional sem depender de Power BI;
- navegacao para detalhes e justificativas.

Arquivos relevantes:

- `public/video_wall_v2.html`
- `public/main.js`
- `src/controllers/dashboardController.js`
- `src/repositories/dashboardRepository.js`
- `src/routes/dashboardRoutes.js`

## Alert Engine

Fluxo principal:

```text
ticket/tarefa normalizada
  -> TicketAlertService
  -> RuleEngine
  -> alertRepository
  -> API/WebSocket
```

Regras atuais:

- ticket novo sem atendimento;
- SLA em atencao;
- SLA vencido;
- chamado pausado estagnado;
- proativo estagnado.

## Dados Expostos

Endpoints relevantes:

- `GET /api/alerts`
- `GET /api/alerts/:ticketId`
- `GET /api/alerts/:id/details`
- `POST /api/alerts/:id/justify`
- `GET /api/rules`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/glpi`
- `GET /api/dashboard/auvo`

## Pendencias

- Criar regras cruzadas com Zabbix.
- Melhorar healthcheck visual quando integracoes externas falham.
- Expandir testes das regras.
- Avaliar cache ou resumo materializado para metricas pesadas.
