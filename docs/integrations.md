# Integracoes

O Perfill Data Hub integra sistemas operacionais usados pelo NOC, suporte e operacao de campo. Cada integracao deve manter client externo, mapper e persistencia isolados das regras de negocio.

## GLPI

Status: **implementado**.

Uso:

- chamados de service desk;
- tarefas de chamados;
- status, datas, SLA, responsaveis e categorias;
- dados para Power BI;
- dados para Alert Engine;
- dados para dashboard NOC.

Componentes principais:

- `src/integrations/glpi`
- `src/mappers/ticketMapper.js`
- `src/repositories/glpi`
- `src/services/glpiSyncService.js`
- `src/controllers/glpiController.js`
- `src/routes/glpiRoutes.js`
- `src/routes/biRoutes.js`

Endpoints relevantes:

- `GET /api/bi/tickets`
- `GET /api/bi/stats`
- `GET|POST /api/bi/sync`
- `GET /api/tickets/:status`
- `GET /api/alerts`
- `GET /api/rules`

### Sessao e TLS do GLPI (18/09/2026)

- A autenticacao por `GLPI_APIKEY` acontece na primeira consulta, sem requisicao no import/boot.
- `ERROR_SESSION_TOKEN_INVALID` invalida a sessao em cache e dispara novo `initSession`. A consulta original e repetida apenas uma vez.
- Chamadas simultaneas compartilham a autenticacao/renovacao; respostas atrasadas de uma sessao antiga nao invalidam a nova.
- Falhas de autenticacao liberam o cache para uma tentativa futura. Outros erros HTTP, rede ou permissoes nao provocam repeticao automatica.
- Timeout de 30 segundos por requisicao; redirects sao recusados. Logs de erro nao incluem tokens ou payloads de autenticacao.
- TLS e validado por padrao. A excecao temporaria `GLPI_TLS_REJECT_UNAUTHORIZED=false` usa um dispatcher exclusivo do GLPI (`undici`), sem alterar `NODE_TLS_REJECT_UNAUTHORIZED` ou outras integracoes.
- O `.env` local recebeu essa excecao para manter acesso ao servidor com certificado expirado. Outros ambientes precisam configura-la explicitamente enquanto o certificado estiver vencido.
- Apos renovar o certificado no servidor, remover a excecao ou definir `GLPI_TLS_REJECT_UNAUTHORIZED=true` e reiniciar o Data Hub. A alteracao do cliente nao renova o certificado remoto.
- Validacao real em 18/09/2026: consulta, encerramento da propria sessao de diagnostico e nova consulta com renovacao automatica funcionaram. TLS estrito ainda retorna `CERT_HAS_EXPIRED`.

## AUVO

Status: **implementado**.

Uso:

- tarefas de campo;
- clientes operacionais;
- usuarios, grupos, segmentos e tipos;
- suporte ao painel `/clientes`;
- fonte inicial do HUB canonico;
- apoio a correlacoes com chamados GLPI.

Componentes principais:

- `src/integrations/auvo`
- `src/repositories/auvo`
- `src/services/auvoSyncService.js`
- `src/controllers/auvoController.js`
- `src/routes/auvoRoutes.js`
- `src/jobs/auvoRetentionJob.js`

Endpoints relevantes:

- `POST /api/auvo/sync`
- `POST /api/auvo/sync/control`
- `GET /api/auvo/sync/status`
- `GET /api/auvo/stats`
- `GET /api/auvo/sync/logs/:historyId`

## HUB Canonico

Status: **fase inicial implementada**.

O HUB canonico nao substitui as tabelas normalizadas por fonte. Ele cria uma visao consolidada de entidades operacionais, preservando a origem dos valores.

Fonte inicial:

- `AUVO/customer`

Componentes principais:

- `src/repositories/hubEntityRepository.js`
- `src/services/hubEntityService.js`
- `src/controllers/hubEntityController.js`
- `src/routes/hubRoutes.js`

Endpoint:

- `GET /api/hub/entities`

## Zabbix

Status: **planejado**.

Objetivo futuro:

- receber eventos de monitoramento;
- detectar host/ativo indisponivel;
- correlacionar falhas com tickets GLPI;
- gerar ou enriquecer alertas operacionais;
- alimentar o HUB canonico com host, IP e status tecnico.

Escopo esperado:

- client ou webhook receiver Zabbix;
- persistencia de eventos;
- mapper de hosts/eventos;
- regras no Alert Engine;
- correlacao com GLPI/AUVO.

## Diretrizes

- Integrations devem falar com APIs externas, nao com UI.
- Mappers devem normalizar payloads antes de persistencia/uso de negocio.
- Services coordenam sync, regra e efeitos colaterais.
- Repositories concentram SQL.
- Falhas de integracao devem gerar logs rastreaveis e, futuramente, alertas operacionais.
