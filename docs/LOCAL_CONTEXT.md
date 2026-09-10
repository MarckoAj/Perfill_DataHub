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

- O lote HUB x GLPI indica conclusao com barra verde em 100% e `✓ Concluído`, mantendo o contorno neutro. Conclusao com falhas usa amarelo; falha de preparacao usa vermelho. Ver `docs/hub-bulk-matching.md` para criterios e limites.
- Validacao de conexao em 10/09/2026: autenticacao GLPI e leitura de Peripheral funcionaram com o cliente existente, que desativa validacao TLS. Certificado expirado em 02/04/2026; nao considerar a validacao TLS regularizada.

- A sincronizacao HUB x GLPI nao possui ajuste de score minimo na interface/API. A pontuacao continua visivel; classificacao de confianca automatica usa regra interna de 90%, mantendo candidatos de baixa confianca disponiveis para revisao manual.

- Matching GLPI: codigo do ponto igual seleciona candidatos, mas nao garante 98% de score; a confianca considera o nome completo normalizado, incluindo endereco. Dispositivos que pertencem a outro HUB nao aparecem como candidatos. A confirmacao bloqueia HUB/dispositivo em transacao, recusa transferencias e salva vinculo/historico atomicamente; score vem da previa recalculada no servidor.

- Modal por fonte: HUB e GLPI possuem Geral, Rede, Estado do ponto e Atendimentos. AUVO possui Geral e Atendimentos. Zabbix possui Geral e Rede. `Planilha base` possui Geral, Rede e Estado do ponto, sem importacao nesta etapa. Subabas indisponiveis ficam desabilitadas e apagadas.
- Informacoes gerais com apenas nome do ativo, ID da fonte, latitude e longitude, mantendo comparacao de IDs no hover. Campos ausentes exibem N/A, sem emprestar dados de outra fonte.
- Atendimentos do HUB separados em AUVO e GLPI; guias das plataformas mostram apenas seus proprios atendimentos. Paginacao de 20 itens com todos os registros existentes no cache local, inclusive encerrados. AUVO usa o customerId vinculado; GLPI usa a locationId do dispositivo vinculado, sem busca por codigo/nome que misture cadastros antigos. A consulta GLPI representa chamados da localizacao, pois ainda nao ha relacao direta ticket-device no cache.
- A fonte `Planilha base` referencia futuramente o arquivo de acompanhamento PI Novo; importacao, sincronizacao e escolha de valores canonicos ficam para uma proxima etapa.
- Atendimentos mantem contagem geral e totais por tipo da fonte selecionada (tipo de tarefa AUVO / tipo de chamado GLPI), calculados sobre todo o historico vinculado e nao apenas a pagina atual. Tipos ausentes ficam em `Nao informado`.
- Os cards de tipo sao filtros dinamicos: os grupos sao lidos diretamente dos tipos existentes no banco, portanto novos tipos aparecem automaticamente. Clicar filtra e reinicia a paginacao; clicar novamente ou em `Total` limpa o filtro.

- A listagem geral de clientes deve usar tags operacionais vindas de `hub_operational_tags`.
- A listagem usa um unico grupo `Filtrar tags`: marcadas permitem exibir os clientes; desmarcadas ocultam clientes com aquela tag. Se um cliente tiver varias tags, a exclusao prevalece. Clientes sem tags continuam visiveis.
- O botao `Mostrar tudo` marca todas as tags e remove a ocultacao por tags, preservando o texto da busca. Tags com `hideByDefault` iniciam desmarcadas.
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
