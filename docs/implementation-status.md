# Status de Implementacao

## Resumo Executivo

O Perfill Data Hub esta em estado funcional como hub GLPI/AUVO com dashboard operacional, sincronizacao automatizada, Alert Engine modular e fase inicial do HUB canonico. Zabbix e automacoes mais avancadas seguem como proximas etapas.

## Arquitetura Base

- [x] Estrutura modular em `src`.
- [x] Separacao por rotas, controllers, services e repositories.
- [x] Boot centralizado em `src/app/server.js`.
- [x] Migrations no startup.
- [x] Middleware de autenticacao por token.
- [x] Frontend Vanilla servido por Express.
- [x] WebSocket para broadcast de alertas.

## GLPI

- [x] Client de API GLPI.
- [x] Mappers de tickets.
- [x] Repositories GLPI e RAW.
- [x] Persistencia de tickets e tarefas.
- [x] Cache local inicial para `Peripheral` em `glpi_devices`.
- [x] Campo `Peripheral.contact_num` identificado como "ID do Auvo" para associacao com AUVO.
- [x] Sync de `Peripheral` como entidade `devices` do GLPI, populando `glpi_devices`.
- [x] Sync manual e automatizado.
- [x] Endpoint BI.
- [x] Endpoints operacionais para tickets e alertas.
- [x] Participacao no Alert Engine.
- [x] Associacao configuravel em lote de `Peripheral` com Hub via `contact_num`, nome ou ambos, com preview, score, ordenacao e confirmacao.

## AUVO

- [x] Client AUVO.
- [x] Sync service AUVO.
- [x] Repositories para customers, tasks, users, groups, segments, questionnaires e task types.
- [x] Controle de status de sincronizacao.
- [x] Logs de sincronizacao.
- [x] Politica de soft delete/purge para dados removidos da origem.
- [x] Apoio ao painel `/clientes`.
- [ ] Webhook handler dedicado.

## HUB Canonico

- [x] Modelo inicial de entidades HUB.
- [x] Repository, service, controller e route.
- [x] Endpoint `GET /api/hub/entities`.
- [x] Endpoint `GET /api/hub/entities/:entityId`.
- [x] Alimentacao inicial por `AUVO/customer`.
- [x] Paginacao e fallback no painel de clientes.
- [x] Busca server-side no painel de clientes.
- [x] Tabela `hub_entity_links` para vinculos com plataformas.
- [x] Tabela `hub_entity_history` para rastreabilidade inicial.
- [x] Inclusao piloto de GLPI como fonte canonica complementar para `64-097`.
- [x] Painel `/admin/sync` para preview e confirmacao de GLPI como fonte canonica complementar para matches confiaveis.
- [x] Revisao individual de associacao GLPI no modal do cliente.
- [x] Bloqueio explicito de propagacao para outras plataformas durante confirmacao HUB x GLPI.
- [x] Validacao visual de confirmacao real HUB x GLPI em `/admin/sync`.
- [ ] Fila dedicada para tratamento de matches ambiguos e baixo score.
- [ ] Inclusao de Zabbix como fonte canonica.
- [ ] Motor de divergencias por campo.

## Alert Engine

- [x] `RuleEngine` modular.
- [x] Regras em `src/engine/rules`.
- [x] Persistencia de alertas.
- [x] Endpoint de consulta de alertas.
- [x] Justificativa manual de alertas.
- [x] Broadcast via WebSocket.
- [x] Regras para SLA, novo sem atendimento, pausado estagnado e proativo estagnado.
- [ ] Regras cruzadas com Zabbix.
- [ ] Editor visual de regras.

## Scheduler e Jobs

- [x] Scheduler dinamico via `dynamicScheduler`.
- [x] Configuracao por banco/UI.
- [x] Limpeza de sincronizacoes travadas no boot.
- [x] Sync manual sob demanda.
- [x] Retention/purge AUVO.
- [ ] Lock distribuido para ambientes com multiplas instancias.

## Banco de Dados

- [x] Migrations.
- [x] Repositories por dominio.
- [x] Tabelas GLPI/AUVO normalizadas.
- [x] Camada RAW onde aplicavel.
- [x] Historico e logs de sync.
- [x] Indices de performance adicionados em fases anteriores.
- [ ] Revisao continua de queries pesadas do dashboard.

## Frontend e Observabilidade

- [x] Login.
- [x] Dashboard NOC em `/noc`.
- [x] Central de alertas em `/alerts`.
- [x] Tabela de chamados em `/tickets`.
- [x] Painel de clientes em `/clientes`.
- [x] Modal de cliente consumindo detalhe real por entidade HUB.
- [x] Abas de plataforma com `platformFields` e hover comparativo de vinculos.
- [x] Painel de sync em `/admin/sync`.
- [x] Topbar global e rotas amigaveis.
- [x] Modais operacionais.
- [x] Polling/telemetria de sync.
- [ ] Healthcheck visual consolidado para falha de integracoes.
- [ ] Revisao de responsividade fina em todas as telas.

## Zabbix

- [ ] Client Zabbix.
- [ ] Webhook receiver.
- [ ] Persistencia de eventos/hosts.
- [ ] Correlacao com tickets GLPI.
- [ ] Regras Zabbix no Alert Engine.

## Testes

- [x] Suite Jest/Supertest configurada.
- [x] Testes de autenticacao/BI/integracoes em fases anteriores.
- [x] Cobertura inicial para matching HUB x GLPI.
- [ ] Expandir cobertura para HUB canonico alem do matching.
- [ ] Expandir cobertura para scheduler dinamico.
- [ ] Expandir cobertura para regras do Alert Engine.
