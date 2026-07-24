# Documentacao Tecnica Oficial - Perfill Data Hub

## 1. Proposito

O Perfill Data Hub centraliza dados operacionais de sistemas usados pelo NOC, suporte e campo. Ele reduz fragmentacao entre GLPI, AUVO e futuras fontes como Zabbix, criando uma base local para monitoramento, BI, alertas e automacoes.

## 2. Estado Atual

- GLPI implementado.
- AUVO implementado para entidades e tarefas principais.
- HUB canonico em fase inicial.
- Alert Engine modular implementado.
- Frontend operacional em Vanilla HTML/CSS/JS.
- Scheduler dinamico implementado.
- Zabbix planejado.

## 3. Boot

```text
src/index.js
  -> src/app/server.js
  -> runMigrations()
  -> cleanupStuckSyncs()
  -> dynamicScheduler.startManager()
  -> Express listen
  -> alertBroadcaster.init(server)
```

## 4. Estrutura Real

```text
src/
  app/              Boot e adaptador Express
  config/           customExpress e ambiente
  controllers/      HTTP
  database/         conexao, migrations e schema
  engine/           RuleEngine e regras
  integrations/     clients GLPI/AUVO
  jobs/             scheduler e retencao
  mappers/          normalizacao de payloads
  middlewares/      auth e interceptadores
  repositories/     SQL e persistencia
  routes/           endpoints Express
  services/         regra de negocio
  shared/           erros/utilitarios compartilhados
  utils/            helpers
  websocket/        broadcast de alertas
```

## 5. Rotas de Interface

- `/noc`
- `/alerts`
- `/tickets`
- `/clientes`
- `/admin/sync`

## 6. APIs Principais

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/change-password`

### BI/GLPI

- `GET /api/bi/tickets`
- `GET /api/bi/stats`
- `GET|POST /api/bi/sync`
- `GET /api/tickets/:status`

### Alertas

- `GET /api/alerts`
- `GET /api/alerts/:ticketId`
- `POST /api/alerts/:id/justify`
- `GET /api/alerts/:id/details`
- `GET /api/rules`

### AUVO

- `POST /api/auvo/sync`
- `POST /api/auvo/sync/control`
- `GET /api/auvo/sync/status`
- `GET /api/auvo/stats`
- `GET /api/auvo/sync/logs/:historyId`

### HUB

- `GET /api/hub/entities`

### Operacional

- `GET /api/integrations`
- `GET /api/integrations/glpi`
- `GET /api/schedules`
- `POST /api/schedules/trigger`
- `GET /api/system/status`
- `GET /api/health/ready`

## 7. Alert Engine

O `RuleEngine` avalia regras em `src/engine/rules`. O fluxo recomendado e:

```text
dados normalizados
  -> service de alerta
  -> RuleEngine
  -> alertRepository
  -> API/WebSocket
```

Regras nao devem persistir dados diretamente. Elas devem avaliar contexto e devolver resultado.

## 8. HUB Canonico

O HUB canonico consolida entidades operacionais sem substituir tabelas normalizadas por fonte.

Primeira fonte:

- `AUVO/customer`

Endpoint:

- `GET /api/hub/entities`

Documentacao especifica:

- `docs/hub-core-entity-progress.md`

## 9. Riscos Tecnicos

- Jobs sobrepostos se uma sincronizacao demorar mais que o intervalo.
- Queries pesadas em dashboards conforme volume cresce.
- Falhas de integracao ainda precisam ficar mais visiveis no NOC.
- Token em frontend/localStorage merece revisao de seguranca.
- RBAC ainda nao esta consolidado para perfis administrativos.

## 10. Diretrizes

- Controllers devem ser finos.
- Services orquestram regra de negocio.
- Repositories concentram SQL.
- Integrations isolam APIs externas.
- Mappers existentes devem ser reutilizados.
- UI deve consumir APIs, nao duplicar regra de negocio.
- Documentacao oficial deve permanecer em `docs/`.
