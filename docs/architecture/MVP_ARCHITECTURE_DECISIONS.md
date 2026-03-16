# Data Hub – Decisões de Arquitetura do MVP

## Contexto

Este documento define as decisões arquiteturais iniciais para o **MVP do Data Hub**, um sistema de integração projetado para centralizar, processar e expor dados operacionais provenientes de múltiplas plataformas.

Plataformas previstas no ecossistema:

- **GLPI** — gerenciamento de chamados
- **Zabbix** — monitoramento de infraestrutura
- **AUVO** — gestão de tarefas externas

O objetivo inicial do hub é atuar como **camada intermediária de ingestão, armazenamento e processamento de dados**, permitindo posteriormente automações e análises.

---

## 1. Escopo do MVP

### Decisão

O **MVP será iniciado exclusivamente com integração ao GLPI**.

### Motivo

Reduzir complexidade inicial e validar os três pilares do hub:

- ingestão de dados
- persistência interna
- exposição via API

Arquitetura inicial:

```text
GLPI API
   ↓
GLPI Integration
   ↓
Sync Service
   ↓
Database
   ↓
Stats / Dashboard API
```

A integração com AUVO e outros sistemas será introduzida em fases posteriores.

---

## 2. Prioridade Funcional

### Decisão

A prioridade inicial será:

```text
A) Sync + Stats / Dashboard
```

Ordem de implementação:

```text
1. Sincronização de tickets do GLPI
2. Persistência no banco interno
3. API de consulta de tickets
4. Estatísticas e endpoints para BI
5. Engine de alertas
6. Integração com AUVO
```

### Motivo

Sem ingestão de dados não é possível implementar:

- alertas
- análises
- dashboards
- correlações entre sistemas

Portanto, o pipeline de dados deve ser construído primeiro.

---

## 3. Modelo de Alertas

### Decisão

Serão mantidos inicialmente os **três alertas existentes no sistema legado**.

Alertas base:

```text
1. Ticket novo parado
2. Ticket proativo sem tarefa
3. Ticket pausado por mais de 7 dias
```

### Estrutura Arquitetural

As regras serão organizadas como módulos independentes:

```text
alerts/
   rules/
      newTicketStalled
      proactiveWithoutTask
      pausedTooLong
```

### Motivo

- regras já validadas pelo negócio
- reduz necessidade de redefinir lógica
- facilita migração gradual

A arquitetura permitirá adicionar novos alertas futuramente.

---

## 4. Contrato de Status

### Decisão

O sistema utilizará **status numérico internamente**, com tradução para texto nas bordas da aplicação.

### Representação interna

```text
1 novo
2 atribuido
3 planejado
4 pendente
5 resolvido
6 fechado
```

### Exemplo interno

```text
status = 1
```

### Exemplo na API

```json
{
  "statusId": 1,
  "status": "novo"
}
```

### Motivo

Vantagens do modelo numérico:

- melhor performance de indexação
- menor uso de memória
- padronização
- evita inconsistências de string

---

## 5. Persistência de Alertas

### Decisão

O sistema terá **histórico completo de alertas (audit trail)** desde a primeira versão.

### Tabela

```text
tickets_alerts

id
ticketId
alertType
triggeredAt
resolvedAt
```

### Motivo

Permite:

- auditoria de eventos
- métricas operacionais
- análise de SLA
- uso em BI

Exemplo de análise possível:

```text
tempo médio de resolução de alertas
```

Sem histórico isso não seria possível.

---

## 6. Integração AUVO

### Decisão

A integração com AUVO **não fará parte da primeira fase do MVP**.

Será implementada em uma fase posterior.

### Motivo

A integração via webhook exige novos componentes:

```text
webhooks/
controllers/
event processors
queues
```

Isso aumenta significativamente a complexidade do sistema.

O objetivo inicial é estabilizar o fluxo:

```text
GLPI → Hub → BI
```

---

## 7. Compatibilidade de Endpoints

### Decisão

Durante a migração será mantida **100% de compatibilidade com as rotas atuais**.

Endpoints preservados:

```text
/api/bi/tickets
/api/bi/stats
/api/bi/sync
```

### Motivo

Evitar quebra de integração com:

- Power BI
- dashboards existentes
- possíveis consumidores da API

A implementação interna poderá mudar, mas os contratos externos permanecerão.

---

## 8. Critério de Conclusão da Etapa 1

### Decisão

A Etapa 1 será considerada concluída somente quando existirem **testes de integração mínimos** além da estrutura do projeto.

### Entregáveis da Etapa 1

```text
estrutura do projeto
configuração do ambiente
logger centralizado
tratamento global de erros
conexão com banco de dados
endpoint de health check
integração inicial com GLPI
1 teste de integração funcional
```

### Exemplo de fluxo validado

```text
sync tickets
↓
persistência no banco
↓
consulta via endpoint
```

Esse fluxo confirma que o pipeline do sistema funciona de ponta a ponta.

---

## 9. Roadmap de Evolução

### Etapa 1 — Foundation

```text
project structure
config
logger
error handling
database connection
health check
```

### Etapa 2 — Data Ingestion

```text
GLPI integration
tickets synchronization
database persistence
```

### Etapa 3 — Data Exposure

```text
tickets API
stats API
Power BI integration
```

### Etapa 4 — Automation

```text
alert engine
alert rules
tickets_alerts table
```

### Etapa 5 — Multi-System Hub

```text
AUVO webhook
task-ticket correlation
event processing
```

---

## Visão Arquitetural do Hub

O projeto evoluirá para uma arquitetura baseada em **pipeline de dados operacionais**:

```text
Data Ingestion
      ↓
Data Storage
      ↓
Data Processing
      ↓
Data Exposure
      ↓
Automation
```

Isso posiciona o sistema como um **Integration Hub**, capaz de centralizar dados operacionais e automatizar decisões entre múltiplos sistemas.

---

## 10. Status de Execução (Mar/2026)

### Etapa 4 — Automation (parcial concluída)

Itens já implementados:

```text
alert engine MVP
regras base de alerta
persistência de alertas (datahub_ticket_alerts)
observabilidade básica (/api/health/alerts)
```

Status atual:

- `alertEngine` ativo no fluxo de sync
- deduplicação em memória por `ticketId + alertType`
- gravação/fechamento de alertas via repositório dedicado
- endpoint de resumo para monitoramento operacional

Próximo passo recomendado da etapa:

```text
rotas dedicadas /api/alerts
filtros/paginação
histórico de eventos de alerta (audit trail expandido)
```
