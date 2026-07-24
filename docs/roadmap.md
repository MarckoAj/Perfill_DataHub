# Roadmap Tecnico

## Concluido

### Base do Hub

- Estrutura modular Node/Express.
- Integracao GLPI.
- Endpoints BI.
- Persistencia local.
- Frontend Vanilla inicial.

### Data Pipeline e Scheduler

- Camada RAW/normalizada.
- Sincronizacao manual e automatizada.
- Scheduler dinamico.
- Logs e historico de sync.
- Soft delete e retention para AUVO.

### AUVO

- Client e sync service.
- Repositories por entidade.
- Sincronizacao de tarefas e entidades operacionais.
- Painel de status e logs.
- Uso de clientes AUVO como fonte inicial do HUB canonico.

### UI Operacional

- `/noc`
- `/alerts`
- `/tickets`
- `/clientes`
- `/admin/sync`
- Topbar global.
- Modais operacionais.

### Alert Engine

- `RuleEngine`.
- Regras modulares.
- Persistencia de alertas.
- Justificativa manual.
- Broadcast via WebSocket.

## Em Andamento

### HUB Canonico

- Consolidar entidades operacionais alem da fonte AUVO.
- Ampliar campos canonicos.
- Criar regras de divergencia entre fontes.
- Melhorar testes do endpoint `GET /api/hub/entities`.

### Observabilidade do Proprio Hub

- Transformar falhas de integracao em alertas visiveis.
- Expor healthcheck consolidado no frontend.
- Melhorar metricas do scheduler.

### Performance

- Revisar queries pesadas de dashboard.
- Avaliar cache ou views de resumo.
- Monitorar crescimento das tabelas GLPI/AUVO.

## Proximas Fases

### Zabbix

- Criar receiver/client.
- Persistir eventos de host/status.
- Correlacionar eventos com GLPI e HUB.
- Criar regras Zabbix no Alert Engine.

### Automacoes Operacionais

- Automatizar abertura/atualizacao de tickets quando permitido.
- Integrar tarefas AUVO com status do chamado.
- Criar workflows de resposta a incidente.

### Seguranca e Governanca

- Avaliar troca de token/localStorage por cookie HttpOnly.
- Implementar RBAC para rotas administrativas.
- Auditar exposicao de endpoints manuais.

### Qualidade

- Expandir testes para scheduler, HUB e regras.
- Criar cenarios de regressao para sincronizacoes.
- Documentar migrations e dependencias de banco.

## Longo Prazo

- Editor visual de regras.
- Event bus interno para desacoplar sync, alertas e broadcast.
- Migrar partes criticas de UI para arquitetura frontend mais componentizada, se a complexidade continuar crescendo.
