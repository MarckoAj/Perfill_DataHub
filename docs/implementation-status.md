# Status de Implementação

## Arquitetura Base

[x] Estrutura modular do projeto
[x] Separação de camadas (API / Core / Integrations)
[x] Sistema de rotas
[x] Middlewares
[x] Sistema de autenticação

---

# Integração GLPI

[x] Cliente de API GLPI
[x] Mappers de dados
[x] Endpoints de consulta
[ ] Sync incremental
[x] Persistência RAW
[ ] Normalização automática

---

# Banco de Dados

[x] Estrutura de repositórios
[x] Persistência de tickets
[x] Tabelas RAW
[x] Versionamento de schema

---

# Alert Engine

[x] Estrutura do alert engine
[x] Persistência de alertas
[x] Endpoint de consulta de alertas
[ ] Regras avançadas
[ ] correlação entre sistemas

---

# Jobs

[x] Estrutura de jobs
[x] job de sync GLPI
[ ] job incremental
[x] scheduler configurado

---

# Integração AUVO

[x] client AUVO
[x] mapper AUVO (embutido no service/repo)
[x] ingestão de tarefas e demais entidades
[x] sync incremental e motores de purge
[ ] webhook handler

---

# Integração Zabbix

[ ] client Zabbix
[ ] ingestão de alertas
[ ] correlação com tickets

---

# Data Pipeline

[x] camada RAW
[x] camada normalizada (com Soft Delete e Resurrection)
[x] lógica de expurgo (Retention Policy)
[ ] reprocessamento de dados globais

---

# Observabilidade

[x] endpoint de health
[x] endpoint de integrações
[x] métricas de sync
[x] logs estruturados