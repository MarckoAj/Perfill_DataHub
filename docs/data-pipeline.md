# Data Pipeline

## Conceito

O Perfill Data Hub implementa um pipeline de ingestão de dados para coletar informações de sistemas externos e transformá-las em dados estruturados.

---

# Pipeline de Ingestão

Fluxo:

External API
↓
Raw Data Storage
↓
Normalization
↓
Business Logic
↓
API / Analytics

---

# RAW Data Layer

Antes de qualquer transformação, os dados são armazenados em formato bruto.

Exemplo de tabela:

raw_glpi_tickets

Campos:

id
external_id
payload_json
fetched_at

Benefícios:

- rastreabilidade
- auditoria
- reprocessamento
- recuperação de erros

---

# Normalização

Após o armazenamento RAW, os dados são mapeados para o modelo interno.

Exemplo:

GLPI ticket → internal ticket

Transformações comuns:

- normalização de status
- conversão de datas
- mapeamento de campos

---

# Incremental Sync

Para evitar processamento desnecessário, a sincronização utilizará:

last_update timestamp

ou

time range incremental

Exemplo:

buscar tickets atualizados nos últimos 5 minutos

---

# Event Generation

Após normalização, eventos poderão ser gerados:

ticket.created
ticket.updated
ticket.closed

Esses eventos poderão alimentar:

- alert engine
- automações
- correlação entre plataformas

---

# Políticas de Retenção e Soft Delete

Para garantir consistência com ferramentas de BI sem perder o poder da camada RAW, foi implementado o conceito de Soft Delete nas camadas relacionais.

Ciclo de Vida:
- **Ativo**: Registro existe na origem (`isActive = 1`, `deletedAt = NULL`).
- **Deletado Lógico**: Registro "sumiu" da origem. O motor de inferência (`AuvoSyncService.markAsDeletedPhase`) aplica o Inativo.
- **Deletado Físico**: O dado lógico expira após 30 dias na tabela e um Job agendado faz a exclusão definitiva (Purge).