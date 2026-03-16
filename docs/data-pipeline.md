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