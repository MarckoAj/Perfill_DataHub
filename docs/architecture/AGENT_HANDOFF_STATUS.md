# Perfill Data Hub - Agent Handoff Status

## Contexto
Este repositório está em migração incremental para o **Perfill Data Hub**.
A estratégia adotada é: **usar o projeto base atual** e **reaproveitar/refatorar componentes do `Perfill Legado`** por etapas.

---

## O que já foi concluído

### 1) Foundation (bootstrap, health, erro global)
- Bootstrap unificado:
  - `src/index.js` delega para `src/app/server.js`.
- Servidor:
  - `src/app/server.js` inicializa migrations/jobs/start.
- Health funcional:
  - `src/api/routes/health.routes.js` com:
    - `GET /api/health`
    - `GET /api/health/live`
    - `GET /api/health/ready`
- Erro global padronizado:
  - `src/shared/errors/notFoundHandler.js`
  - `src/shared/errors/errorHandler.js`
- Registro de rotas/middlewares:
  - `src/config/customExpress.js`.

### 2) GLPI Core (integração + mapeamento + sync)
- Novo cliente GLPI no padrão Data Hub:
  - `src/integrations/glpi/glpiClient.js`
- Compatibilidade retroativa:
  - `src/integrations/glpi_client.js` (reexport).
- Mapeador canônico de status:
  - `src/core/tickets/ticketStatusMapper.js`.
- Aplicação do mapper no fluxo existente:
  - `src/services/glpi_service.js`
  - `src/mappers/ticketMapper.js`.

### 3) Repositório Tickets/BI migrado para core
- Repositório central movido para:
  - `src/core/tickets/ticketRepository.js`
- Compatibilidade retroativa:
  - `src/repositories/ticketRepository.js` (reexport).

### 4) Sync de tickets migrado para core
- Serviço principal:
  - `src/core/tickets/syncTicketsService.js`
- Compatibilidade retroativa:
  - `src/services/sync_service.js` (reexport).

### 5) Compatibilidade de endpoints BI mantida
- Controller BI segue contrato atual de resposta:
  - `src/controllers/glpiController.js`
- Rotas BI mantidas conforme uso atual do dashboard.

### 6) Alert Engine MVP integrado
- Novo motor de alertas:
  - `src/core/alerts/alertEngine.js`
- Regras MVP implementadas:
  - `new_unhandled` (ticket `novo` sem tratativa > 5 min)
  - `paused_stale` (ticket `pendente` sem atualização > 7 dias)
  - `sla_overdue` (`isAtrasado` ou `statusSla` vencido)
- Integração no fluxo de sincronização:
  - `src/core/tickets/syncTicketsService.js`
- Comportamento:
  - deduplicação por `ticketId:type`
  - ciclo de estado em memória (`open`/`closed`)
  - resumo de lote para observabilidade (`opened`, `closed`, `active`)

### 7) Persistência e observabilidade de alertas
- Repositório de alertas implementado:
  - `src/core/alerts/alertRepository.js`
- Persistência acoplada ao sync:
  - `src/core/tickets/syncTicketsService.js`
  - grava alertas ativos e fecha alertas resolvidos
- Migração de tabela de alertas adicionada:
  - `src/database/migrations.js`
  - tabela `datahub_ticket_alerts`
- Endpoint de observabilidade:
  - `GET /api/health/alerts`
  - retorna resumo (`open_alerts`, `closed_alerts`, `total_alerts`)

---

## Testes e validação
- Todos os testes estão passando no estado atual:
  - `npm.cmd test`
  - Resultado esperado: suites verdes.
- Testes relevantes criados/atualizados:
  - `__tests__/healthRoutes.test.js`
  - `__tests__/ticketStatusMapper.test.js`
  - `__tests__/alertEngine.test.js`
  - cobertura de `GET /api/health/alerts` em `__tests__/healthRoutes.test.js`
  - + suites existentes (`auth`, `biRoutes`, `glpiClient`).

---

## Decisões importantes para continuidade
1. A migração está sendo feita com **adapters de compatibilidade** (reexports) para não quebrar API atual.
2. O legado está sendo usado como **base de reaproveitamento**, mas a implementação final está sendo alinhada ao padrão de camadas do Data Hub.
3. O contrato BI (`/api/bi/tickets`, `/api/bi/stats`, `/api/bi/sync`) foi preservado.

---

## Próximas etapas recomendadas (para outro agente)

### Etapa A - Endpoints dedicados de alertas
- Criar rotas específicas de alertas (`/api/alerts`) com filtros por estado/tipo/severidade.
- Incluir paginação e ordenação para consumo BI/operacional.

### Etapa B - Refinar persistência e histórico
- Separar histórico completo de eventos (auditoria) do estado atual dos alertas.
- Evoluir estratégia para manter trilha temporal de reaberturas/fechamentos.

### Etapa C - Cobertura de testes da migração
- Adicionar testes de integração de sync + persistência de alertas.
- Adicionar testes de contrato dos endpoints BI e health observability (sem regressão).

---

## Como continuar com segurança
1. Manter adapters até estabilizar todo consumo atual.
2. Após estabilizar, migrar imports internos para `core/*` e `integrations/*`.
3. Só remover adapters quando:
   - todos os testes passarem,
   - rotas BI estiverem estáveis,
   - deploy de homologação validado.

---

## Nota sobre o legado
Conforme decisão atual do projeto, o diretório **`Perfill Legado` está versionado no repositório** para servir como referência de migração e comparação técnica durante o handoff entre agentes.
