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
[x] Sync incremental e massivo via Fila Async
[x] Persistência RAW
[x] Normalização automática no Banco de Dados
[x] Desvio de Autenticação Auto-Assinada / Expirada TLS (Bypass)

---

# Banco de Dados

[x] Estrutura de repositórios
[x] Persistência de tickets (GLPI) e Entidades (AUVO)
[x] Tabelas RAW
[x] Versionamento de schema via Migrations
[x] Seeding de Agendamentos e Auditorias
[x] Correção de Palavras Reservadas no CRUD (System->`system`)

---

# Alert Engine

[x] Estrutura do alert engine
[x] Persistência de alertas
[x] Endpoint de consulta de alertas
[ ] Regras avançadas
[ ] correlação entre sistemas

---

# Jobs e Automacação (Auto-Sync 2.0)

[x] Motor Dinâmico via Banco de Dados (Substituição de Código Fixo)
[x] Criação de Painel/HUD de Configuração no Frontend Web
[x] Carga Assíncrona Não-Bloqueante (Background Queue)
[x] Agendador Customizável com expressões amigáveis (Semana, Mês)
[x] Suporte à Filtros Específicos por Entidade (Checkboxes independentes)

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
[x] processamento modular de filas (Retry, Pause, Cancel, Start)
[x] reprocessamento de dados globais sob-demanda

---

# Observabilidade e UI

[x] Dashboard UI Estilo Deep Dark Glassmorphism 
[x] Componente Global Timer UI Tracker (Tempo Regressivo/Sincronizando)
[x] Endpoint de Telemetria Contínua (Polling 1.5s)
[x] Métricas de sync (Progresso Delta: Novas Inserções, Hits de Base)
[x] Modal de Auditoria de Erros Específicos e Log em Tabela
[x] Proteção Anti-Congelamento (Escudo Try/Catch nas requisições HTTPs)