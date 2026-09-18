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

### Historico GLPI por ponto — prioridade imediata

- Piloto 06-014 / HUB-012130 / GLPI 4412 implementado com seis chamados reais,
  detalhes de interacoes, dispositivos vinculados e encerramentos.
- Confirmar com o usuario a apresentacao final; #2237 mantem acompanhamento normal,
  sem cartao adicional de recusa; #6579 inclui o encerramento registrado no GLPI.
- Validar chamado compartilhado real entre dispositivos (testes automatizados ja existem).
- Apos validacao, ampliar para todos os pontos com carga incremental e controle de concorrencia.
- Adicionar permissoes individuais antes de liberar interacoes privadas.
- Avaliar anexos e reaberturas separadamente; nao estao no escopo entregue.
- Renovar certificado GLPI no servidor e remover excecao TLS local.
- Detalhes e limites: [Historico GLPI por dispositivo](./glpi-point-history.md).

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
