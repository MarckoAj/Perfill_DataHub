# Documentação Técnica e Arquitetural Oficial — Perfill DataHub

## 1 — Visão Geral do Projeto

### Propósito Real e Problema Resolvido
O **Perfill DataHub** atua como um orquestrador e centralizador de inteligência operacional para NOC (Network Operations Center). O problema central resolvido é a fragmentação de dados operacionais: o suporte trabalha no GLPI, o técnico de campo no AUVO e a infraestrutura no Zabbix. Historicamente, essa quebra gerava perda de SLAs e ineficiência. 

O objetivo operacional é cruzar essas informações em um painel único (Dashboard) e reagir através de um motor de alertas de forma ativa, rastreando infrações operacionais automaticamente.

### Estado Atual da Integração (Realidade)
- **Implementado:** Sincronização do GLPI (via Polling/Cron), Sistema de Alertas Inteligentes (Rule Engine modular), WebSockets para realtime e UI do NOC/Alertas.
- **Parcialmente Implementado:** Integração AUVO. O sistema consome tarefas atreladas a tickets, mas a sincronização profunda de check-in/check-out de campo não está 100% autônoma.
- **Planejado:** Integração com Zabbix via Webhooks para cruzar `host down` com status do chamado no GLPI.

---

## 2 — Estrutura REAL de Pastas

```text
src/
 ├── app/              # Ponto de entrada das configurações base do Express.
 ├── config/           # Setup de credenciais e .env.
 ├── controllers/      # Camada HTTP. Processam req/res e chamam services.
 ├── database/         # Contém a pool MySQL estática (connection.js).
 ├── engine/           # (NOVO) Rule Engine e subpasta /rules com as lógicas desacopladas.
 ├── integrations/     # Clients baseados em Axios (glpiClient, auvoClient).
 ├── jobs/             # Cron jobs. (Acoplamento de lógica de agendamento).
 ├── mappers/          # Classes que traduzem chaves de APIs externas para os models locais.
 ├── middlewares/      # Interceptadores. Atualmente contém authMiddleware (JWT).
 ├── repositories/     # Queries de Banco isoladas. (Gargalo: Queries muito complexas no dashboard).
 ├── routes/           # Definição de rotas Express.
 ├── services/         # Coração do negócio. SyncServices e TicketAlertService.
 ├── shared/           # Constantes e enums básicos.
 ├── utils/            # Funções utilitárias (Data, Formatações).
 └── websocket/        # alertBroadcaster.js (Isola a instância do socket.io).
public/                # Frontend Vanilla (HTML/CSS/JS diretos, sem frameworks).
scratch/               # Scripts locais para debug e injeções forçadas.
docs/                  # Documentação técnica e arquitetural.
```

---

## 3 — Fluxo REAL de Inicialização

O sistema inicializa de forma imperativa:

```txt
index.js
  ↓
[Config] Carrega .env
  ↓
[Database] Inicia Pool MySQL2
  ↓
[Engine] RuleEngine carrega arquivos /rules em memória
  ↓
[Express] App é montado, Middlewares (Cors, JSON) aplicados
  ↓
[Routes] Rotas /api injetadas
  ↓
[Server] Servidor HTTP sobe na porta definida
  ↓
[WebSocket] Instância de Socket.io se anexa ao server HTTP
  ↓
[Jobs] glpiSyncJob e auvoSyncJob iniciam o cron/polling.
```

---

## 4 — Fluxo REAL de Dados

```txt
[API Externa GLPI]
       ↓ (Polling a cada N minutos)
[GLPI Sync Service]
       ↓
[GLPI Mapper] (Normaliza chaves e converte tipos)
       ↓
[MySQL tickets/tasks_auvo] (UPSERT via Repository)
       ↓ (Dispara evento interno)
[TicketAlertService] (Constrói o contexto)
       ↓
[RuleEngine] (Verifica o ticket contra N regras)
       ↓
[AlertRepository] (Persiste se gerou/encerrou/justificou alerta)
       ↓
[AlertBroadcaster] (Emite evento via WebSocket)
       ↓
[Frontend Vanilla] (Atualiza o DOM instantaneamente)
```

**Observação Técnica:** A persistência usa "Eventual Consistency". O banco local é read-heavy (foco em dashboard), atualizado em batch pelo sync.

---

## 5 — Mapeamento COMPLETO de Funções (Principais)

### `TicketAlertService.processTicketAlerts`
- **Arquivo:** `src/services/TicketAlertService.js`
- **Responsabilidade:** Orquestrar a avaliação e persistência de alertas de um chamado modificado.
- **Parâmetros:** `ticket` (objeto).
- **Dependências:** `RuleEngine`, `alertRepository`, `glpiTicketTaskRepository`, `alertBroadcaster`.
- **Fluxo Interno:** Prepara contexto -> Roda Engine -> Valida alertas atuais no banco -> Cria/Justifica/Fecha alertas e emite socket.
- **Complexidade:** O(n) onde N é número de regras.
- **Gargalos:** Itera o banco para cada regra avaliada em cada ticket (potencial query N+1 no volume massivo).

### `RuleEngine.evaluateAll`
- **Arquivo:** `src/engine/RuleEngine.js`
- **Responsabilidade:** Processar stateless todas as regras registradas contra o contexto do ticket.
- **Retorno:** Array de status das regras aplicadas.
- **Regras de Negócio:** Delega a avaliação para cada arquivo `src/engine/rules/*.rule.js`.
- **Efeitos colaterais:** Nenhum (função pura).

### `dashboardRepository.getGlpiGrafanaData`
- **Arquivo:** `src/repositories/dashboardRepository.js`
- **Responsabilidade:** Gerar as métricas para a tela do NOC.
- **Queries Executadas:** Faz `LEFT JOIN` entre `tickets`, `datahub_ticket_alerts` e subqueries de tarefas.
- **Melhorias possíveis:** Muito pesada para polling do cliente. Ideal criar uma *Materialized View* ou Cache no Redis.

---

## 6 — Classes e Serviços (Dependências)

```txt
TicketAlertService
 │
 ├── RuleEngine (Calculadora pura)
 │    └── rules/*.rule.js
 │
 ├── alertRepository (I/O Banco)
 │
 ├── glpiTicketTaskRepository (Busca contexto AUVO)
 │
 └── alertBroadcaster (I/O Socket)
```
- **Acoplamentos Atuais:** `TicketAlertService` está perigosamente acoplado à forma como `glpiTicketTaskRepository` retorna a "última tarefa". Se o modelo AUVO mudar, este serviço quebra.

---

## 7 — Integrações Externas

### GLPI (Implementado)
- **Endpoint:** `/apirest.php/Ticket`, `/TicketTask`
- **Autenticação:** Header `App-Token` e `Session-Token`.
- **Sincronização:** Cron job de Polling. Deduplicação baseada no ID do GLPI (`ON DUPLICATE KEY UPDATE`).
- **Riscos:** Sem webhooks, o sistema martela a API do GLPI de minuto em minuto. Limitador rate-limit pode banir o IP do DataHub.

### AUVO (Parcialmente Implementado)
- **Mecânica:** As tarefas são extraídas do body do GLPI ou importadas via endpoint isolado, mas a correlação automática "Técnico Bateu Ponto" vs "Pausar SLA no GLPI" ainda é rudimentar.

### Zabbix (Planejado)
- **Mecânica Futura:** Escutar Webhooks do Zabbix (`host_up` / `host_down`) e correlacionar na `RuleEngine`.

---

## 8 — Banco de Dados REAL

### Tabela `tickets`
- **Responsabilidade:** Cópia suja do GLPI.
- **Colunas chave:** `ticketId` (PK), `status` (INT), `statusSla` (VARCHAR), `date_creation`, `date_mod`.
- **Índices:** Faltam índices compostos nas colunas de busca do Dashboard (gargalo crítico futuro).

### Tabela `tasks_auvo` (Parcial)
- **Colunas chave:** `externalId` (cruza logicamente com `ticketId`).

### Tabela `datahub_ticket_alerts`
- **Responsabilidade:** Registrar quando uma regra de negócio foi violada.
- **Colunas:** `id` (PK), `glpi_ticketId` (FK lógica), `ruleId` (VARCHAR - ex: `GLPI_SLA_BREACHED`), `checked` (BOOLEAN 0/1), `state` ('open', 'justified', 'closed'), `justified_text`.
- **Estratégia:** Nunca apaga alertas. Mantém histórico de quebras fechando via `checked = 1`.

---

## 9 — Sistema de Alertas

### Implementado
- **Regras Atuais:** Ticket Novo Sem Interação, SLA Vencido, SLA Atenção, Pausado Estagnado, Proativo sem tarefa.
- **Fluxo:** Detecção (RuleEngine) -> Persistência -> Emissão WebSocket.
- **Auto-justificativa:** Se um SLA quebra, mas surge uma tarefa de campo para o ticket, o sistema migra o estado do alerta para `justified` automaticamente.

### Parcialmente Implementado
- **Correlação Cruzada:** As regras cruzam dados de `tickets` com `tasksAuvo`, mas dependem de o Sync ter salvado a taskAuvo a tempo. Race condition possível se o Sync do Ticket rodar milissegundos antes do Sync do Auvo.

### Planejado
- **Zabbix Rule:** "GLPI Ticket Aberto + Zabbix Host UP = Alerta de Intervenção".

---

## 10 — Regras de Negócio

- **SLA:** "SLA Vencido" dispara apenas se `statusSla === 'Vencido'` e não há interação/tarefa válida no momento do cálculo.
- **GLPI:** Ticket em Status 'Novo' se torna crítico se ultrapassar 5 minutos sem ser movido para 'Atendimento'.
- **Automação:** Toda atualização de ticket via GLPI refaz o cálculo retroativo de *todos* os alertas que estavam abertos para aquele ticket.

---

## 11 — Fluxos Assíncronos

- **Polling do Sync:** Agendador via `setInterval` ou `node-cron`. 
- **Concorrência e Riscos:** Atualmente não há lock distribuído. Se o job demorar mais de 1 minuto para puxar tickets, e o próximo ciclo rodar, teremos sobreposição (Memory Leak e Duplicidade de I/O de rede).
- **WebSockets:** O servidor emite `ALERT_OPENED` e `ALERT_JUSTIFIED`. As telas não fazem refresh, aplicam JS Vanilla direto no DOM.

---

## 12 — Dependências do Projeto

- **`express`**: Base da API. Risco nulo, padrão de mercado.
- **`mysql2/promise`**: Essencial para queries assíncronas. Risco: Má gestão da pool pode estourar limite do MySQL.
- **`socket.io`**: Gerenciador Realtime.
- **Substituições sugeridas:** Adicionar `bullmq` e `redis` para as tarefas assíncronas do Sync.

---

## 13 — Segurança

### Implementado
- **Autenticação:** Baseada em JWT, interceptada em `authMiddleware`.
- **SQL Injection:** Uso de Queries Preparadas (`?`).

### Riscos e Limitações
- **Armazenamento XSS:** O JWT é guardado no `localStorage` do navegador. Isso permite roubo em caso de ataque XSS.
- **Autorização (RBAC):** NÃO IMPLEMENTADA. Não existe controle se o usuário é "Admin" ou "Técnico". Se tem token, tem acesso às rotas.

### Melhorias
- Migrar JWT para `HttpOnly Cookies`.
- Implementar checagem de perfil (Roles) para as rotas administrativas.

---

## 14 — Performance

### Gargalos Encontrados (⚠️ Crítico)
1. **N+1 no Processamento de Alertas:** Quando o sync traz 100 tickets, o `TicketAlertService` faz SELECTs individuais de alertas ativos para CADA ticket no loop, podendo bater centenas de queries em 2 segundos.
2. **Dashboard Query Pesada:** O `getGlpiGrafanaData` não tem tabela de resumo. Recalcula contagens complexas on the fly. 
3. **Ausência de Índices:** Tabelas grandes como `tickets` não têm `INDEX` nos campos `status` e `date_mod`.

---

## 15 — Acoplamento e Arquitetura

### Problemas Atuais
- **Controller fazendo Regra de Negócio:** Alguns controllers do GLPI estão construindo lógica de negócio que deveria estar encapsulada em um `Service`.
- **Dependências Perigosas:** O Frontend Vanilla possui partes consideráveis de HTML hardcoded gerados via *Template Strings* no JS, dificultando manutenção visual pesada.

### Melhorias Futuras
- Separar completamente a lógica de acesso a banco no backend e parar de retornar HTML via JS template blocks (`alerts.html`).
- Mudar para padrão Publisher/Subscriber no Backend (EventEmitters nativos em vez de chamadas síncronas entre services).

---

## 16 — APIs e Rotas

### Frontend (Rotas de Interface)
- `GET /noc`: Dashboard principal do NOC.
- `GET /alerts`: Central de Alertas.
- `GET /tickets`: Tabela de todos os chamados ativos e fechados.
- `GET /admin/sync`: Painel de controle de sincronização.
- `GET /clientes`: Gestão de Clientes e Projetos Operacionais.

### Backend (Endpoints JSON)
- `GET /api/tickets/:status`: Mapeado para `glpiController.getTicketsByStatus`. Retorna a lista.
- `GET /api/alerts`: Mapeado. Suporta paginação e filtros pesados (`state`, `severity`, `ruleId`).
- `POST /api/alerts/:id/justify`: Body `{ justifiedText }`. Auth exigida. Finaliza o alerta manualmente.
- `GET /api/rules`: Endpoint criado recentemente para exportar catálogo de alertas do `RuleEngine`.

---

## 17 — Observabilidade Operacional

### Existente
- **Navegação Global:** Topbar unificada em todas as páginas para garantir experiência contínua.
- **Interfaces e Modais:** *Enterprise NOC Modal* (Detalhes do Chamado) e *Point Modal* reformulados para consistência corporativa (CSS Grid, Glassmorphism).
- Painel Frontend de Alertas (`alerts.html`) com filtros e cards operacionais.
- Painel Frontend de Clientes Operacionais (`clientes.html`) com métricas e filtros interativos.
- Tela de Sincronização (`admin/sync`) para ver o status do Worker.

### Faltante (Manual)
- Se a integração com o GLPI cair por timeout, o sistema loga no console NodeJS local, mas NÃO alerta o NOC sobre a própria falha do sistema.

### Planejado
- Integração de healthcheck visível no Frontend.

---

## 18 — Melhorias Recomendadas

### 🔴 Crítico
1. **Criar Índices no Banco:** Urgente (`CREATE INDEX idx_tickets_status ON tickets(status)`).
2. **Lock no CronJob:** Impedir que o Sync inicie se o ciclo anterior não terminou.

### 🟡 Importante
1. **Migração do JWT para Cookie.**
2. **Criação de Fila (Redis/Bull) para Sincronização e Processamento de Alertas.**

### 🟢 Futuro
1. Webhooks em vez de Polling para o GLPI.
2. Controle de Permissões (Roles e Políticas).

---

## 19 — Roadmap Técnico

**Curto Prazo:**
- Refatorar queries do Dashboard para uma View Materializada.
- Adicionar os Indexes no MySQL.

**Médio Prazo:**
- Integrar Zabbix via Webhooks (Etapa 4 e 5).
- Desacoplar Front e Back implementando React ou Vue (Substituir o Vanilla pesadelo de manutenção UI).

**Longo Prazo:**
- Editor visual de regras no painel para criar arquivos `.rule.js` através da interface.
- Inteligência Artificial lendo e autojudicando alertas de SLA baseado no histórico.

---

## 20 — Resumo Executivo

### Visão para Liderança
O DataHub é hoje uma ferramenta tangível, capaz de gerar pressão operacional automática e reduzir SLAs perdidos cobrando a equipe antes da expiração. O sistema é robusto na visualização, porém o banco de dados crescerá rapidamente.

### Visão para Engenharia
A arquitetura foi estabilizada pela introdução da `RuleEngine` modular, mas sofre com dívidas técnicas de um protótipo, notavelmente a falta de filas (Message Queues) para gerenciar assincronicidade e acoplamento de queries perigosas no `DashboardRepository`. O próximo grande desafio técnico será trocar polling por push events.

### Visão Operacional
O NOC possui uma tela que pulsa vida em real-time graças a WebSockets. A responsabilidade agora é cadastrar as regras corretas de negócio para evitar "Fadiga de Alerta" no dashboard.
