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
- Antes de implementar novas regras/telas, fazer perguntas de alinhamento para confirmar o comportamento esperado.
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

## Decisoes Recentes Do HUB

- A listagem geral de clientes deve usar tags operacionais vindas de `hub_operational_tags`.
- A tela deve permitir selecionar uma lista de tags para incluir e outra lista de tags para ocultar; as duas selecoes podem ser usadas ao mesmo tempo.
- Pontos podem exibir multiplos chips de tags na listagem.
- A tag `Desinstalado` deve ficar oculta por padrao na listagem geral, mas o usuario pode desmarcar a ocultacao para exibir esses pontos.
- Tags como `Implantacao` devem ser usadas normalmente como filtro e chip, sem ocultacao padrao.
- Futuramente as regras de ocultacao, acompanhamento e confirmacao manual de alteracoes por tag devem sair do codigo e virar configuracao pela interface.
- Para nao poluir a UI operacional, criar futuramente uma pagina especifica de administracao/configuracao de tags operacionais.
- Essa pagina deve permitir gerenciar tags oficiais, cor/chip, ativo/inativo, ocultacao padrao, ordem de exibicao e aliases/tolerancias de nomenclatura.
- As tolerancias iniciais automaticas devem cobrir apenas casos simples e confirmados de `Desinstalado`, como acentos, caixa de texto, hifens, barras e asteriscos incompletos.
- `Desativado` nao deve ser tratado automaticamente como `Desinstalado`, pois nem sempre representa ponto desinstalado; essa tag e suas tolerancias devem ser criadas manualmente na pagina administrativa quando a regra estiver validada.
- A configuracao futura deve ter uma area de teste/previa para digitar um nome vindo do AUVO/GLPI e ver quais tags seriam aplicadas e qual seria o nome limpo/canonico sugerido pelo HUB.
- O HUB deve caminhar para ser a fonte confiavel de nomenclatura, permitindo propagacao controlada para AUVO/GLPI apenas com historico e confirmacao manual.
- No modal de cliente/ponto, a secao `Tags operacionais` deve apenas listar tags relacionadas ao cliente e permitir vincular tags ja existentes por um botao `+`.
- A criacao, edicao, aliases/tolerancias e configuracoes globais de tags devem ficar somente na pagina administrativa futura de `Filtros e Tags`.
- Na aba `Estado do ponto`, a alteracao manual de status deve ser acionada por um botao `+` dentro do cabecalho do `Historico de Status Fisico`, mantendo o formulario em modal/dialogo.
- Tolerancias/aliases de tags operacionais devem ser armazenadas em tabela propria (`hub_operational_tag_aliases`) e carregadas por seed, nao fixadas na regra de runtime.
- O seed inicial deve conter apenas a tag `Desinstalado` e variacoes simples confirmadas nos nomes reais, como acentos, caixa de texto, hifen, barra e asterisco incompleto.
- Os filtros padrao de tags na listagem de clientes devem ser globais para todos os usuarios, usando a configuracao da propria tag (`hideByDefault`) no banco.
- A manutencao de tags e tolerancias deve ficar em uma pagina administrativa chamada `Configuracao e Cadastro de Tags`, abaixo de `Admin > Sincronizacao` no menu.
- Futuramente adicionar/remover tags e tolerancias deve exigir um nivel administrativo superior ao acesso comum autenticado.
- `customers_auvo.active` representa o estado operacional do cliente no AUVO; quando for `0`, o HUB deve aplicar automaticamente a tag `Inativo no AUVO`, oculta por padrao, preservando o registro para auditoria.
- `customers_auvo.isActive` representa existencia/sincronizacao do registro na fonte; nao deve ser confundido com ponto operacionalmente ativo.
- A correlacao de IDs entre HUB/GLPI/AUVO deve considerar apenas clientes AUVO operacionalmente ativos (`active = 1`) para evitar vincular novos relacionamentos em cadastros antigos/inativos.
