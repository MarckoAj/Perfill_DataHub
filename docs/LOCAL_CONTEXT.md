# Contexto Local do Projeto

## Nome

Perfill Data Hub

## Objetivo Atual

O projeto funciona como um hub de dados operacionais para integrar GLPI, AUVO e futuras fontes como Zabbix. Ele coleta dados externos, persiste estado local, normaliza informacoes para consumo interno, gera alertas operacionais e disponibiliza telas e APIs para NOC, BI e administracao.

## Identidade do Sistema

Este projeto nao deve ser tratado apenas como uma API de Power BI. O endpoint BI continua importante, mas o produto atual e um **Integration Hub** com:

- sincronizacao GLPI;
- sincronizacao AUVO;
- motor de alertas;
- dashboard NOC;
- painel de alertas;
- painel de clientes;
- scheduler dinamico;
- camada HUB canonica inicial.

## Arquitetura Real

Fluxo principal:

```text
src/index.js
  -> src/app/server.js
  -> runMigrations()
  -> syncLogRepository.cleanupStuckSyncs()
  -> dynamicScheduler.startManager()
  -> buildExpressApp()
  -> alertBroadcaster.init(server)
```

Camadas:

- `routes`: definem endpoints Express.
- `controllers`: tratam HTTP e chamam services/repositories.
- `services`: concentram regras de negocio e orquestracao.
- `repositories`: concentram SQL e acesso ao banco.
- `integrations`: clientes de APIs externas.
- `mappers`: transformam payloads externos em modelos locais.
- `engine`: motor de regras de alerta.
- `jobs`: agendamentos e rotinas automaticas.
- `websocket`: broadcast de alertas para frontend.

## Frontend

O frontend e Vanilla HTML/CSS/JS em `public/`.

Telas atuais:

- `public/video_wall_v2.html` via `/noc`;
- `public/alerts.html` via `/alerts`;
- `public/index.html` via `/tickets`;
- `public/clientes.html` via `/clientes`;
- `public/sync.html` via `/admin/sync`;
- `public/login.html` para autenticacao.

## Integracoes

### GLPI

Implementado. Inclui sincronizacao, tickets, tarefas de ticket, mappers, repositories, endpoints de consulta, endpoint BI e participacao no motor de alertas.

### AUVO

Implementado para varias entidades operacionais. Inclui repositories especificos em `src/repositories/auvo`, sync service, controle de status, logs e apoio ao painel de clientes/HUB.

### HUB Canonico

Fase inicial implementada:

- `src/services/hubEntityService.js`
- `src/repositories/hubEntityRepository.js`
- `src/controllers/hubEntityController.js`
- `src/routes/hubRoutes.js`
- endpoint `GET /api/hub/entities`

A primeira fonte canonica e `AUVO/customer`.

### Zabbix

Planejado. Ainda nao ha client ou pipeline de ingestao consolidado.

## Regras de Trabalho

- Ler a documentacao relevante antes de mudar codigo.
- Evitar refactors fora do escopo.
- Nao recriar mappers ja existentes.
- Manter controllers finos quando possivel.
- Concentrar SQL em repositories.
- Preservar mudancas existentes do usuario.
- Validar com testes ou, no minimo, inspeção de diff quando testes nao forem aplicaveis.

## Comandos Uteis

```bash
npm run dev
npm start
npm test
```

## Observacoes Importantes

- `AGENTS.md` foi movido para `docs/AGENTS.md` para concentrar a documentacao em uma unica pasta.
- A documentacao principal esta em `docs/README.md`.
- A documentacao tecnica longa esta em `docs/DOCUMENTACAO_TECNICA.md`.
