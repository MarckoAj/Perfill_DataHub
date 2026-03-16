# Perfill Data Hub - Agent Handoff Status

## Contexto
Este repositório é agora o **backend principal e funcional** do Perfill Data Hub.
A migração do PerfillBi foi concluída com sucesso - todo o código funcional foi transferido e está operacional.

---

## Status Atual (Mar/2026)
- ✅ **Backend completo e funcional** (migrado do PerfillBi)
- ✅ **Todos os testes passando** (26/26 testes)
- ✅ **API REST operacional** com todos os endpoints
- ✅ **Alert Engine MVP** com persistência
- ✅ **Observabilidade completa** (health checks, integrações)
- ✅ **Dashboard HTML** temporário (será substituído por React)

---

## O que foi migrado do PerfillBi

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
- Endpoint dedicado de consulta:
  - `GET /api/alerts`
  - protegido por `authMiddleware`
  - suporta filtros por `state`, `type`, `severity`, `startDate`, `endDate`
  - suporta paginação (`limit`, `offset`, `page`) e ordenação (`sortBy`, `sortOrder`)

### 8) Melhorias avançadas de alertas (Mar/2026)
- **Filtros por período**: Implementados `startDate` e `endDate` em `GET /api/alerts`
- **Detalhes por ticket**: Novo endpoint `GET /api/alerts/:ticketId` com histórico completo
- **Paginação melhorada**: Suporte a `page` além de `offset` com metadados completos
- **Observabilidade de integrações**: Novo repositório `src/core/integrations/integrationRepository.js`
- **Health check de integrações**: Endpoints `GET /api/integrations` e `GET /api/integrations/glpi`
- **Métricas operacionais**: Status de sync GLPI, contagem de tickets, alertas críticos
- **Testes completos**: Suites para funcionalidades avançadas em `__tests__/alertsEnhanced.test.js` e `__tests__/integrations.test.js`
- **Documentação API**: Contratos completos em `docs/api/alerts.md` e `docs/api/integrations.md`

---

## Testes e validação
- Todos os testes estão passando no estado atual:
  - `npm.cmd test`
  - Resultado esperado: suites verdes.
- Testes relevantes criados/atualizados:
  - `__tests__/healthRoutes.test.js`
  - `__tests__/ticketStatusMapper.test.js`
  - `__tests__/alertEngine.test.js`
  - `__tests__/alertsRoutes.test.js`
  - `__tests__/alertsEnhanced.test.js` (novas funcionalidades de alertas)
  - `__tests__/integrations.test.js` (observabilidade de integrações)
  - cobertura de `GET /api/health/alerts` em `__tests__/healthRoutes.test.js`
  - cobertura de autenticação e contrato de `GET /api/alerts` em `__tests__/alertsRoutes.test.js`
  - + suites existentes (`auth`, `biRoutes`, `glpiClient`).

---

## Decisões importantes para continuidade
1. A migração está sendo feita com **adapters de compatibilidade** (reexports) para não quebrar API atual.
2. O legado está sendo usado como **base de reaproveitamento**, mas a implementação final está sendo alinhada ao padrão de camadas do Data Hub.
3. O contrato BI (`/api/bi/tickets`, `/api/bi/stats`, `/api/bi/sync`) foi preservado.

---

## Próximas etapas recomendadas

### Etapa A - Frontend React (prioridade atual)
- Criar repositório `perfill-bi-frontend` separado
- Implementar dashboard React moderno
- Configurar integração com este backend (Perfill_DataHub)
- Migrar funcionalidades do dashboard HTML atual

### Etapa B - Integração AUVO (próxima fase do roadmap)
- Implementar cliente AUVO com paginação completa (baseado em `Perfill Legado/src/api/fetchRequest.js`)
- Criar webhook receiver desacoplado com dispatcher de eventos
- Migrar validações de entidades para serviços de domínio

### Etapa C - Multi-System Hub
- Implementar integração Zabbix (reescrevendo cliente sem código de teste)
- Criar correlação entre tickets GLPI e tarefas AUVO
- Desenvolver pipeline unificado de eventos entre sistemas

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
