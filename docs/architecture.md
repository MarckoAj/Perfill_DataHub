# Arquitetura

## Visao Geral

O **Perfill Data Hub** e um hub de integracao operacional. Ele sincroniza dados de fontes externas, persiste estado local, normaliza entidades, executa regras de alerta e expoe APIs e telas para operacao.

Fontes atuais ou planejadas:

- GLPI: service desk e chamados.
- AUVO: tarefas, clientes e entidades operacionais.
- HUB canonico: consolidacao interna de entidades vindas de fontes externas.
- Zabbix: monitoramento, planejado para fase futura.

## Boot da Aplicacao

```text
src/index.js
  -> startServer()
  -> buildExpressApp()
  -> runMigrations()
  -> cleanupStuckSyncs()
  -> dynamicScheduler.startManager()
  -> app.listen()
  -> alertBroadcaster.init(server)
```

O boot fica em `src/app/server.js`. A montagem Express fica em `src/config/customExpress.js`, acessada por `src/app/express.js`.

## Camadas

### Routes

Local: `src/routes`

Define os endpoints Express e aplica middlewares por grupo de rota.

Principais grupos:

- `/api/auth`
- `/api/bi`
- `/api/auvo`
- `/api/glpi`
- `/api/hub`
- `/api/integrations`
- `/api/schedules`
- `/api/system`
- `/api/health`
- `/api` para dashboard, alertas e tickets internos.

### Controllers

Local: `src/controllers`

Responsaveis por request/response HTTP. Devem delegar regra de negocio para services e acesso a dados para repositories.

### Services

Local: `src/services`

Concentram orquestracao e regras de negocio.

Exemplos:

- `glpiSyncService.js`
- `auvoSyncService.js`
- `TicketAlertService.js`
- `alertRunnerService.js`
- `hubEntityService.js`
- `systemStatusService.js`

### Repositories

Local: `src/repositories`

Concentram SQL e acesso ao banco. Existem repositories gerais e subpastas por fonte externa:

- `src/repositories/glpi`
- `src/repositories/auvo`

### Integrations

Local: `src/integrations`

Contem clients para APIs externas, como GLPI e AUVO. Esta camada nao deve conter regra de negocio de dashboard ou alerta.

### Mappers

Local: `src/mappers`

Transformam payloads externos em formatos internos. Mappers existentes devem ser reutilizados; nao recriar logica de mapeamento em controllers.

### Engine

Local: `src/engine`

Contem o `RuleEngine` e regras em `src/engine/rules/*.rule.js`.

O motor avalia contexto de tickets/tarefas e retorna violacoes ou estados de alerta. Persistencia e efeitos colaterais ficam fora das regras.

### Jobs

Local: `src/jobs`

Executa sincronizacoes e rotinas automaticas. O projeto usa scheduler dinamico, com configuracoes em banco e controle pela UI.

### WebSocket

Local: `src/websocket`

Isola o broadcast de alertas para o frontend.

## Fluxo de Dados

```text
Fonte externa
  -> integration client
  -> mapper
  -> repository
  -> banco local normalizado/RAW
  -> service de dominio
  -> RuleEngine quando aplicavel
  -> API, BI, Dashboard ou WebSocket
```

## Frontend

O frontend e Vanilla HTML/CSS/JS em `public/`. As rotas amigaveis sao servidas pelo Express:

- `/noc` -> `video_wall_v2.html`
- `/alerts` -> `alerts.html`
- `/tickets` -> `index.html`
- `/clientes` -> `clientes.html`
- `/admin/sync` -> `sync.html`

## Diretrizes de Evolucao

- Manter SQL em repositories.
- Evitar regra de negocio em controllers.
- Reutilizar mappers existentes.
- Integracoes externas devem ficar isoladas em `integrations`.
- Alertas devem passar pelo `RuleEngine` e services de alerta.
- Mudancas no HUB canonico devem preservar as tabelas normalizadas por fonte.
