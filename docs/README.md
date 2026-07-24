# Perfill Data Hub

O **Perfill Data Hub** e a plataforma interna de integracao, sincronizacao e observabilidade operacional da Perfill. O projeto centraliza dados de sistemas como GLPI e AUVO, normaliza essas informacoes em banco local, gera alertas operacionais e expoe APIs e telas para acompanhamento do NOC, BI e administracao de sincronizacoes.

## Estado Atual

- **GLPI:** implementado, com sincronizacao, normalizacao de tickets, tarefas, endpoints BI e processamento de alertas.
- **AUVO:** implementado para entidades operacionais, tarefas, clientes, usuarios, grupos, segmentos e apoio ao HUB canonico.
- **HUB canonico:** fase inicial implementada para entidades operacionais, hoje alimentada principalmente por clientes AUVO.
- **Alert Engine:** implementado com `RuleEngine` modular e regras em `src/engine/rules`.
- **Frontend:** Vanilla HTML/CSS/JS em `public/`, com telas para NOC, alertas, chamados, clientes e sincronizacao.
- **Zabbix:** planejado.

## Stack

- Node.js com ES Modules
- Express
- MySQL via `mysql2`
- Jobs com `node-cron` e scheduler dinamico
- Autenticacao por token de API
- WebSocket via `ws`
- Testes com Jest e Supertest

## Estrutura Principal

```text
src/
  app/             Boot e montagem do Express
  config/          Configuracao do Express e ambiente
  controllers/     Camada HTTP
  database/        Conexao, migrations e schema
  engine/          RuleEngine e regras de alerta
  integrations/    Clientes externos GLPI/AUVO
  jobs/            Schedulers e rotinas automaticas
  mappers/         Normalizacao de dados externos
  middlewares/     Autenticacao e interceptadores
  repositories/    Acesso a banco
  routes/          Rotas Express
  services/        Regras de negocio e orquestracao
  shared/          Erros e utilitarios compartilhados
  utils/           Funcoes utilitarias
  websocket/       Broadcast de alertas

public/            Frontend Vanilla
docs/              Documentacao do projeto
scratch/           Scripts locais de apoio e diagnostico
__tests__/         Testes automatizados
```

## Rotas Principais

### Frontend

- `GET /noc` - video wall / dashboard NOC.
- `GET /alerts` - central de alertas.
- `GET /tickets` - tabela de chamados.
- `GET /clientes` - painel de clientes operacionais.
- `GET /admin/sync` - painel de sincronizacao.

### API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/change-password`
- `GET /api/bi/tickets`
- `GET /api/bi/stats`
- `GET|POST /api/bi/sync`
- `GET /api/alerts`
- `POST /api/alerts/:id/justify`
- `GET /api/rules`
- `GET /api/auvo/stats`
- `POST /api/auvo/sync`
- `GET /api/auvo/sync/status`
- `GET /api/hub/entities`
- `GET /api/integrations`
- `GET /api/system/status`
- `GET /api/health/ready`

## Comandos

```bash
npm run dev
npm start
npm test
```

## Documentacao

- [Contexto local](./LOCAL_CONTEXT.md)
- [Arquitetura](./architecture.md)
- [Status de implementacao](./implementation-status.md)
- [Integracoes](./integrations.md)
- [Data pipeline](./data-pipeline.md)
- [Roadmap](./roadmap.md)
- [Documentacao tecnica oficial](./DOCUMENTACAO_TECNICA.md)
- [Progresso HUB canonico](./hub-core-entity-progress.md)
- [Dashboard e Alert Engine](./dashboard-alert-engine.md)
- [Plano UI/UX](./UI_UX_REFACTOR_PLAN.md)
- [Guia de trabalho dos agentes](./AGENTS.md)
