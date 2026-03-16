# Perfill Data Hub - Plano de Reaproveitamento do Legado

## 1) Objetivo
Mapear o projeto `Perfill Legado` para reaproveitar o máximo de lógica útil no `Perfill Data Hub`, com migração controlada, sem copiar acoplamentos antigos.

## 2) Regra operacional
- A pasta `Perfill Legado` é **somente consulta/análise**.
- Nada dessa pasta deve ser versionado no novo repositório sem passar por refatoração.
- Reuso deve ser por **extração de lógica** (serviços/use cases), não por cópia direta de camadas inteiras.

## 3) Estado atual (snapshot)
### Data Hub (repositório novo)
- Repositório privado criado: `Perfill_DataHub`.
- Estrutura base já publicada (`chore: bootstrap data hub structure`).
- Pastas-chave criadas: `src/app`, `src/api`, `src/core`, `src/shared`, `src/integrations/*`, `src/database/migrations`, `docs/*`.

### Base atual GLPI/BI (origem desta estrutura)
- Sync GLPI já evoluído para `syncAll()` (status abertos + fechado + atraso).
- Dashboard e endpoint de stats operando conforme contrato atual.

## 4) Inventário do Legado (o que existe)
### Entradas e composição
- `src/index.js`: bootstrap app + DB + init de definição de banco.
- `src/config/customExpress.js`: roteamento central + middleware de erro.

### Integrações externas
- `src/api/glpiRequest.js`: sessão GLPI + chamadas REST.
- `src/api/fetchRequest.js`: cliente AUVO (token, paginação, listas completas).
- `src/api/auvoWebHooks.js`: gestão de webhooks AUVO.
- `src/api/zabbixRequest.js`: cliente Zabbix (com trecho de teste acoplado no arquivo).

### Domínio/modelos
- `src/models/ticketsMod.js`: orquestra GLPI + tarefas AUVO + anexos de ticket.
- `src/models/ticketsAlerts.js`: regras de alertas por tempo/status.
- `src/models/tasksMod.js`: CRUD/regras de tarefas AUVO.
- `src/models/webHookMod.js`: dispatch por `entityType` e `action`.
- `src/models/*Validations.js`: validações de existência e integridade entre entidades.

### Repositórios e persistência
- `src/repositorios/*.js`: acesso SQL por entidade.
- `src/infrastructure/database/queries.js`: executor SQL transacional genérico.
- `src/infrastructure/database/conexao.js`: pool mysql (com fallback e defaults).

### Utilitários
- `src/utils/customDate.js`: datas/intervalos (já muito alinhado com uso atual).
- `src/utils/glpiUlils.js`: parser/mapeamento ticket GLPI (parcialmente já reaproveitado no projeto atual via mapper mais novo).

## 5) O que pode ser reaproveitado (prioridade)
## Prioridade A (reaproveitar primeiro)
1. **Regras de alerta de tickets** (`models/ticketsAlerts.js`)
   - Reaproveitar a lógica de condição e limiares de tempo.
   - Destino sugerido: `src/core/usecases/tickets/processTicketAlerts.usecase.js`.

2. **Paginação AUVO + listagem completa** (`api/fetchRequest.js`)
   - Reaproveitar algoritmo de paginação e `hasNextPage`.
   - Destino: `src/integrations/auvo/auvo.client.js`.

3. **Dispatcher de webhook** (`models/webHookMod.js`)
   - Reaproveitar padrão de roteamento por tipo/ação.
   - Destino: `src/core/services/webhookDispatcher.service.js`.

4. **Validações de existência entre entidades** (`models/validations.js`, `tasksValidations.js`)
   - Reaproveitar conceito com interfaces explícitas.
   - Destino: `src/core/services/entityValidation.service.js`.

## Prioridade B (reaproveitar com refatoração média)
1. **Queries de tarefas e joins analíticos** (`repositorios/taskRep.js`)
   - Aproveitar SQL de leitura para visões operacionais.
   - Destino: `src/repositories/tasks.repository.js`.

2. **Mapeamento GLPI legado** (`utils/glpiUlils.js`)
   - Aproveitar heurísticas de limpeza de texto e SLA.
   - Convergir com `ticketMapper` atual para evitar duplicidade.

3. **Fluxo de webhooks AUVO** (`api/auvoWebHooks.js`)
   - Reuso do fluxo de upsert/check, sem acoplamento a ngrok direto.

## Prioridade C (avaliar depois)
- Módulos de preventivas/relatórios e planilhas (`utils/relatorio.js`, `utils/planilha.js`) apenas se fizer sentido no Data Hub.

## 6) O que NÃO deve ser copiado como está
1. Hardcodes de URL interna em `repositorios/urlsRep.js` (`10.10.10.x`).
2. Credenciais/defaults sensíveis em código (`conexao.js`).
3. `zabbixRequest.js` com bloco de teste executável no módulo.
4. Padrão de transação por query em `queries.js` (overhead e risco de lock).
5. Acoplamento forte `model -> repo -> api externa` sem interfaces.
6. Tratamento de erro com `console.log` sem contrato padronizado.

## 7) Gaps técnicos identificados
1. Falta padronização de contrato entre integrações (GLPI/AUVO/Zabbix).
2. Estrutura de migrations incompleta para todas entidades do domínio novo.
3. Falta trilha de observabilidade por integração (correlation-id, métricas por job).
4. Ausência de testes de contrato para payloads externos.

## 8) Plano de execução por etapas (passo a passo)
## Etapa 0 - Preparação
- [ ] Definir escopo MVP do Data Hub (somente GLPI? GLPI+AUVO?).
- [ ] Congelar contratos atuais (`/api/bi/tickets`, `/api/bi/stats`, `/api/bi/sync`).
- [ ] Criar matriz de variáveis de ambiente por integração.

## Etapa 1 - Fundação técnica
- [ ] Corrigir bootstrap único (`src/app/server.js` + `src/index.js`) e nomenclaturas de migration.
- [ ] Criar camada de erro compartilhada (`src/shared/errors`).
- [ ] Criar logger padronizado por contexto (`src/shared/logger`).

## Etapa 2 - Integração GLPI consolidada
- [ ] Migrar cliente GLPI para `src/integrations/glpi/glpi.client.js`.
- [ ] Extrair mapper único de ticket (unificar legado + atual).
- [ ] Criar testes de integração para sync por status e atrasados.

## Etapa 3 - Alertas de ticket
- [ ] Portar regras de `ticketsAlerts` para use case dedicado.
- [ ] Criar tabela/entidade de alertas com migration própria.
- [ ] Expor endpoint de leitura de alertas (somente leitura no início).

## Etapa 4 - Integração AUVO (fase incremental)
- [ ] Portar cliente AUVO com paginação completa.
- [ ] Implementar webhook receiver desacoplado por dispatcher.
- [ ] Migrar validações de entidades para serviços de domínio.

## Etapa 5 - Zabbix e telemetria
- [ ] Reescrever cliente Zabbix sem código de teste embutido.
- [ ] Criar coleta agendada com retries e limites.
- [ ] Publicar indicadores de saúde por integração.

## Etapa 6 - Hardening e qualidade
- [ ] Cobertura mínima por módulo crítico (sync, stats, alerts).
- [ ] Testes de contrato de payload externo com mocks.
- [ ] Checklist de segurança (segredos, logs, erros, timeout, retry).

## 9) Tarefas imediatas (próxima sprint)
1. Corrigir bootstrap e entrypoint para arquitetura `src/app/*`.
2. Criar `integrations/glpi/glpi.client.js` oficial e adaptar serviço atual.
3. Criar `core/usecases/tickets/processTicketAlerts.usecase.js` (porta de `ticketsAlerts`).
4. Definir migration inicial de `tickets_alerts` no padrão atual.
5. Criar documento de contrato AUVO (`docs/api/auvo-webhook.md`).

## 10) Critério de conclusão desta migração
- GLPI sync + stats + dashboard estável no novo Data Hub.
- Alertas de ticket funcionando com persistência própria.
- Webhook AUVO desacoplado e testado.
- Nenhum código legado copiado sem adaptação para padrão novo.

---

## Anexo A - Mapa de destino (legado -> data hub)
- `Perfill Legado/src/models/ticketsAlerts.js` -> `src/core/usecases/tickets/processTicketAlerts.usecase.js`
- `Perfill Legado/src/api/fetchRequest.js` -> `src/integrations/auvo/auvo.client.js`
- `Perfill Legado/src/models/webHookMod.js` -> `src/core/services/webhookDispatcher.service.js`
- `Perfill Legado/src/repositorios/taskRep.js` -> `src/repositories/tasks.repository.js`
- `Perfill Legado/src/utils/customDate.js` -> `src/shared/utils/customDate.js` (ou consolidar com util atual)
