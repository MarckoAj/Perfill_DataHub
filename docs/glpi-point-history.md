# Historico GLPI por dispositivo — piloto 06-014

Implementado em 18/09/2026 para HUB-012130, GLPI Peripheral 4412.

## Comportamento

No modal do cliente, em Atendimentos > GLPI, a primeira visao apresenta ID, titulo,
ultima atualizacao, todos os elementos associados e categoria completa. Ordem:
ultima atualizacao decrescente; paginacao de 20 chamados.

Expandir um chamado mostra descricao, dispositivos vinculados e linha do tempo
cronologica de respostas/acompanhamentos, tarefas, solucoes e encerramentos. Cada interacao
mostra autor, data e conteudo. Solucoes incluem tipo e situacao de aprovacao,
quando informados na origem. Nao sao importados anexos nesta etapa.

O detalhe expandido destaca o ID do chamado em fonte maior, a direita do titulo.
Os estados da solucao seguem CommonITILValidation: 1 sem aprovacao, 2 aguardando,
3 aprovada e 4 recusada (diferentes dos estados do chamado).
Referencia: https://github.com/glpi-project/glpi/blob/10.0/bugfixes/src/CommonITILValidation.php

Para respostas relacionadas a recusas, a interface mostra apenas o acompanhamento original, com
autor, data e texto, sem criar cartao de recusa, rotulos de motivo ou avisos de
correlacao. Os metadados de decisao permanecem no backend; o estado da solucao
continua no cartao original da solucao.

No backend, a associacao usa `itilfollowups_id` quando disponivel. Para registros
antigos sem esse campo, uma unica resposta do mesmo autor em ate dois segundos
da decisao e identificada como associacao inferida, nunca como vinculo confirmado.
Nao se escolhe entre candidatos ambiguos. Conteudo privado continua filtrado
inclusive nos metadados de decisao.

Validacao real no #2237: solucao 1422 recusada em 25/08/2023 12:39:14;
acompanhamento 505 do mesmo autor as 12:39:13, sem vinculo direto informado.
O comentario permanece como acompanhamento normal. A solucao 1790 tem
estado 2 na API, independentemente do estado fechado do chamado.

O clique em um dispositivo com vinculo HUB ativo abre o modal daquele ponto,
diretamente em Atendimentos > GLPI. Sem vinculo HUB, o dispositivo permanece
visivel sem link; nao se cria uma entidade automaticamente.

Um chamado com varios dispositivos aparece no historico de cada HUB vinculado.
Para os demais pontos envolvidos, a interface identifica que esse historico e
parcial: somente os chamados compartilhados com o piloto estao neste cache.
Nao ha expansao recursiva para todos os chamados dos outros dispositivos.
Pontos sem participacao no piloto continuam com a consulta anterior por
localizacao. A nova tela nao e adicionada ao NOC nem a listagem geral de tickets.

## Fonte e persistencia

- Descoberta: `Peripheral/4412/Item_Ticket`.
- Chamado: `Ticket/:id`, incluindo encerrados; registros na lixeira sao ignorados.
- Relacoes completas: `Ticket/:id/Item_Ticket`.
- Interacoes: `ITILFollowup`, `TicketTask` e `ITILSolution` como subitens do chamado.
- Encerramentos: `Ticket/:id/Log`, transicao do campo status (`id_search_option=12`)
  para 6, com data e autor do evento. Se o registro de fechamento atual nao estiver
  no log, utiliza-se `Ticket.closedate`, sem atribuir um autor desconhecido.
  O estado da solucao e preservado: chamado fechado nao implica solucao aprovada.
  Validado no #6579: encerramento por Rafael Martins em 16/11/2023 15:54:23.
- Nomes de dispositivos, autores e categorias sao resolvidos com cache por carga.
- As listas respeitam `Content-Range`, com paginas de 100 registros e teto de
  10.000 por lista. Exceder o teto ou falhar uma pagina aborta a carga, sem salvar
  um historico parcial como completo.

Migration aditiva em `src/database/migrations/glpiPointHistoryTables.js`:

- `glpi_point_history_tickets`: resumo, descricao e interacoes estruturadas em JSON.
- `glpi_point_history_items`: relacoes muitos-para-muitos entre chamados e ativos.
- `glpi_point_history_sync`: ultima tentativa, ultimo sucesso e erro resumido.

A carga completa e coletada antes da gravacao. A substituicao do snapshot e
transacional, remove relacoes obsoletas e preserva o cache anterior em caso de
falha. As tabelas operacionais `tickets`, tarefas e solucoes existentes nao sao
alteradas por esta carga. SQL fica no repository; limpeza de conteudo e nomes
de status reutilizam componentes existentes.

## Atualizacao

Ao acessar os atendimentos GLPI, o cache aparece primeiro. Se o ultimo sucesso
tem mais de cinco minutos, a tela solicita atualizacao em segundo plano.
Ha um botao Atualizar historico. Tentativas, inclusive manuais, respeitam um
intervalo minimo de um minuto. Consultas simultaneas compartilham a mesma carga
no processo atual. Nao ha lock distribuido para varios processos nesta etapa.

Ao concluir a fila GLPI existente com estado COMPLETED/PARTIAL, o mesmo servico
atualiza o piloto se estiver vencido. Falhas ficam registradas e visiveis no
modal, sem limpar o ultimo historico. O GLPI externo recebe somente consultas;
nao ha criacao de chamados, tarefas ou alteracao de dispositivos.

## API e privacidade

Rotas autenticadas em `/api/hub`:

- `GET /entities/:entityId/glpi-history?limit=20&offset=0`
- `GET /entities/:entityId/glpi-history/:ticketId`
- `POST /entities/:entityId/glpi-history/sync`, corpo `{ "force": false }`

A lista informa se o ponto pertence ao piloto ou compartilha seus chamados.
Detalhes exigem uma relacao exata com dispositivo ativo do HUB solicitado;
alterar o ID do ponto nao concede acesso a outro chamado.

O marcador `isPrivate` e preservado no banco. O backend remove interacoes
privadas da resposta usando `canReadPrivateGlpiInteractions`, em
`src/config/glpiHistory.js`. Hoje essa politica retorna false para todos,
pois o token compartilhado nao identifica permissoes individuais. A UI apenas
informa a existencia de interacoes restritas, sem receber seu conteudo.
Parametros ou roles enviados pelo navegador nao alteram essa politica.

Quando RBAC for implementado, ligar essa funcao a permissoes de um usuario
autenticado no servidor. Nao liberar apenas mudando a interface. O escopo do
piloto tambem fica centralizado no mesmo arquivo de configuracao.

## Validacao

- Criadas somente as tres tabelas novas no banco configurado e realizada carga
  real dos seis chamados: 40111, 15154, 15153, 6579, 2237 e 31511.
- API local confirmou lista, categorias, detalhes, bloqueio de acesso sem token,
  bloqueio de ponto sem vinculo e remocao do conteudo privado.
- Os seis chamados reais tinham apenas o dispositivo 4412; multiplos dispositivos
  e navegacao para outro HUB foram validados com fixtures automatizadas.
- Validacao final antes do commit: suite completa passou com 120 testes em 23 suites, incluindo paginacao,
  concorrencia, cooldown, rollback, privacidade, rotas, escape de HTML e navegacao.
- Inspecao visual em navegador ficou pendente: nenhum navegador disponivel na
  ferramenta de automacao desta sessao.

## Proximas implementacoes

1. Concluir validacao do piloto com o usuario: campos, datas, detalhes e encerramentos.
2. Validar um chamado real com varios dispositivos; hoje esse cenario tem testes com fixtures.
3. Apos aprovacao do piloto, ampliar a carga por dispositivo para os demais pontos,
   com sincronizacao incremental e limites de concorrencia; substituir gradualmente
   a consulta antiga por localizacao.
4. Implementar identidade individual e permissoes no backend antes de liberar
   interacoes privadas. Reutilizar a politica central ja existente.
5. Avaliar anexos/documentos e outras transicoes de status, incluindo reabertura,
   em etapa propria. O log importado nesta fase cobre apenas encerramentos.
6. Preparar lock distribuido e observabilidade da carga se houver varias instancias.

## Retomada local

- Porta configurada no `.env`: 3002; acessar `http://localhost:3002/clientes`.
- Inicializacao em PowerShell: `npm.cmd start` (ou `npm.cmd run dev`).
- Nao confundir com a antiga previa temporaria da porta 3010.
- `.env` e logs de runtime sao locais e nao entram no Git.
