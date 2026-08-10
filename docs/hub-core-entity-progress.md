# HUB Core Entity Progress

Este documento acompanha a criacao incremental da entidade canonica do HUB.

## Objetivo

Criar uma camada canonica do HUB para consolidar dados vindos de plataformas externas sem perder o estado atual de cada fonte.

A entidade operacional principal passa a ser o dispositivo/ponto. A carga inicial ainda nasce do `AUVO/customer`, mas o HUB deve se relacionar com:

- `AUVO/customer`
- `GLPI/Peripheral` como device
- dados de `GLPI/Location` como subdados do device, nao como entidade forte
- futuramente `Zabbix/host`

## Decisoes Arquiteturais

- O HUB nao deve substituir as tabelas normalizadas das plataformas externas.
- As tabelas `customers_auvo`, `tickets`, `tasks_auvo` e futuras tabelas Zabbix continuam existindo como estado normalizado por fonte.
- A entidade canonica sera alimentada inicialmente pelo AUVO, mas preparada para receber GLPI e Zabbix depois.
- Valores por campo e fonte ficam separados para permitir divergencias futuras, como `latitude` no AUVO diferente da `latitude` no GLPI.
- A primeira fonte canonica sera `AUVO/customer`, porque ja existe sync funcional de `customers_auvo`.
- Cada aba do modal deve mostrar os campos existentes naquela plataforma.
- A aba HUB deve mostrar a soma canonica completa: AUVO preenche primeiro; GLPI preenche campos ausentes; alteracoes posteriores nas fontes nao sobrescrevem automaticamente o HUB, apenas geram divergencia.
- Sincronizacao manual futura deve seguir fluxo fonte escolhida -> HUB -> plataforma destino.

## Escopo Da Fase 1

- [x] Definir modelo minimo de tabelas HUB.
- [x] Criar migrations do HUB.
- [x] Criar repository de entidades HUB.
- [x] Criar service/controller/route inicial.
- [x] Expor `GET /api/hub/entities`.
- [x] Atualizar `/clientes` para consumir dados reais do HUB com fallback para mock.
- [x] Paginar `GET /api/hub/entities` com limite maximo de 100 itens por requisicao.
- [x] Adicionar controles de paginacao no topo e no fim da lista de clientes.
- [x] Ajustar modal de cliente para usar nome real abreviado com tooltip e ID real do HUB.
- [x] Ao navegar paginas em `/clientes`, voltar ao topo da area principal.
- [x] Validar endpoint e testes disponiveis.
- [x] Adicionar busca server-side em `GET /api/hub/entities?search=...`.
- [x] Expor `GET /api/hub/entities/:entityId` para detalhe do modal.
- [x] Persistir vinculos operacionais em `hub_entity_links`.
- [x] Criar cache local inicial de device GLPI em `glpi_devices`.
- [x] Criar base de rastreabilidade em `hub_entity_history`.
- [x] Modelar o piloto `64-097`: Hub `14446`, AUVO `14988457`, GLPI Peripheral `10301`, GLPI Location `18892` como subdado.
- [x] Ajustar modal para campo unico `ID do ativo`, com hover exibindo equivalentes HUB/AUVO/GLPI.
- [x] Separar `platformFields` por aba: `hub`, `auvo`, `glpi`, `zabbix`.
- [x] Ajustar alinhamento dos campos gerais, incluindo latitude e longitude lado a lado.
- [x] Criar preview backend de associacao HUB x GLPI por `ID`, `Nome` ou `ID + Nome`.
- [x] Adicionar aba `HUB x GLPI` em `/admin/sync` com filtros, paginacao, score e selecao multipla.
- [x] Adicionar revisao individual de associacao GLPI no modal do cliente.
- [x] Confirmar associacoes selecionadas em `hub_entity_links` com historico em `hub_entity_history`.
- [x] Bloquear propagacao para outras plataformas nesta fase.
- [x] Adicionar testes unitarios do service de matching HUB x GLPI.
- [x] Adicionar sync de `GLPI Peripheral` como entidade `devices` do sync GLPI.
- [x] Popular `glpi_devices` com 6501 devices GLPI; 24 possuem `auvoCustomerId` preenchido.
- [x] Validar visualmente em `/admin/sync` a confirmacao de vinculo real HUB x GLPI.
- [x] Criar fila dedicada inicial em `/admin/sync` para tratar matches ambiguos e baixo score.
- [x] Criar tags operacionais de nome, exibidas na aba Estado do Ponto e ignoradas na comparacao quando aparecem no inicio do nome.
- [x] Sanear o nome exibido na aba HUB removendo tags operacionais vindas do AUVO, mantendo o nome completo na aba AUVO.

## Modelo Inicial

### `hub_entities`

Representa a entidade canonica minima do HUB.

Campos principais:

- `entityId`
- `entityType`
- `canonicalName`
- `displayName`
- `status`
- `isActive`
- `createdAt`
- `updatedAt`

### `hub_entity_sources`

Relaciona uma entidade HUB a um registro de uma fonte externa.

Exemplo:

- `sourceSystem`: `AUVO`
- `sourceEntity`: `customer`
- `sourceNativeId`: `customers_auvo.customerId`

### `hub_entity_field_values`

Guarda o estado atual de cada campo por fonte externa e tambem o valor canonico do HUB.

Campos iniciais:

- `name`
- `latitude`
- `longitude`

### `hub_entity_links`

Relaciona uma entidade HUB com registros externos de plataforma.

Exemplos:

- `sourceSystem`: `AUVO`, `sourceEntity`: `customer`, `sourceNativeId`: `customers_auvo.customerId`
- `sourceSystem`: `GLPI`, `sourceEntity`: `device`, `sourceNativeId`: `glpi_devices.deviceId`

### `glpi_devices`

Cache local inicial para `GLPI Peripheral`, tratado como device do GLPI no HUB.

Campos importantes mapeados no teste:

- `deviceId`: `Peripheral.id`
- `name`: `Peripheral.name`
- `auvoCustomerId`: `Peripheral.contact_num` (campo traduzido como "ID do Auvo")
- `locationId`: `Peripheral.locations_id`
- `status`, `deviceType`, `manufacturer`, `model`, `hardwareTechnician`, `project`, `updateSource`

### `hub_entity_history`

Guarda eventos de rastreabilidade do HUB, incluindo preenchimentos automaticos de campo vazio e futuras sincronizacoes manuais.

### `hub_operational_tags`

Lista tags operacionais que podem aparecer como prefixo no nome das fontes externas.

Exemplo:

- `**Desinstalado** 4B-010 CAMERA`

Nesse caso, `Desinstalado` e exibido como tag no Estado do Ponto, mas o nome comparavel passa a ser `4B-010 CAMERA` para evitar divergencia falsa ou queda de score no matching.

Outro exemplo:

- `**CAM-NÃO ENCONTRADA**15-075_PTZ`

Na aba HUB, o nome exibido passa a ser `15-075_PTZ`. Na aba AUVO, a nomenclatura original permanece completa para preservar o estado real da fonte.

## Descobertas De Associacao GLPI/AUVO

Consulta feita em carga leve somente leitura:

- `Peripheral/10301` possui `contact_num = 14988457`.
- Em `listSearchOptions/Peripheral`, o campo traduzido "ID do Auvo" corresponde a:
  - search option `8`
  - tabela `glpi_peripherals`
  - campo `contact_num`
  - uid `Peripheral.contact_num`
- Buscar `search/Peripheral` com `criteria[0][field]=8`, `searchtype=equals`, `value=14988457` retornou o device GLPI `10301`.

Teste por lote:

- Amostra AUVO -> GLPI por `contact_num`: 10 customers AUVO/Hub testados, 1 match. A amostra tinha muitos customers recentes/gerais, indicando que o Hub precisa de refresh completo AUVO antes de uma associacao massiva.
- Amostra GLPI -> AUVO por `contact_num`: 8 devices GLPI com ID do Auvo preenchido; 8/8 existiam em `customers_auvo`.
- Comparacao por nome nos mesmos 8 devices: 8/8 com similaridade 100% apos normalizacao.
- Busca AUVO -> GLPI por nome em 10 customers recentes: 3/10 retornaram dispositivos com match forte; pode haver multiplos candidatos e devices sem `contact_num`.

## Proximas Fases

- Refinar associacao HUB x GLPI em camadas:
  1. Match principal: `GLPI Peripheral.contact_num` = `customers_auvo.customerId`.
  2. Match por nome normalizado entre `GLPI Peripheral.name` e `customers_auvo.description`.
  3. Match combinado `ID + Nome`, exigindo os dois criterios ao mesmo tempo.
  4. Se houver multiplos candidatos ou score baixo, manter revisao manual.
- Garantir refresh/inclusao do Hub a partir de `customers_auvo` antes ou durante a carga GLPI.
- Refinar enriquecimento de `glpi_devices` com campos adicionais de `Peripheral` e `Location`, se necessario.
- Persistir decisoes de fila de revisao alem do vinculo confirmado, se for necessario auditar recusas/adiamentos.
- Adicionar Zabbix como fonte para host/IP/status.
- Criar motor de divergencias por campo critico.
- Permitir escolha manual da fonte canonica por campo.
- Permitir `PUT/PATCH` para atualizar fontes externas quando a API permitir.

## Observacao Para Continuidade Em Novo Chat

Retomar daqui: o painel de associacao HUB x GLPI foi validado visualmente em `/admin/sync` com confirmacao de vinculo real em `hub_entity_links` e historico em `hub_entity_history`. A propagacao para AUVO/GLPI externo/Zabbix segue bloqueada. `glpi_devices` foi populada com 6501 `Peripheral`; 24 possuem ID AUVO e ja geram matches `ID + Nome`. A fila inicial de revisao de ambiguidades e baixo score ja existe no painel. O proximo passo e avaliar persistencia de decisoes pendentes/recusadas ou iniciar a inclusao de Zabbix.
