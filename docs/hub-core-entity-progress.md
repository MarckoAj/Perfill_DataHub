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

- Implementar associacao automatica GLPI/AUVO em camadas:
  1. Match principal: `GLPI Peripheral.contact_num` = `customers_auvo.customerId`.
  2. Fallback: nome normalizado entre `GLPI Peripheral.name` e `customers_auvo.description`.
  3. Se houver multiplos candidatos ou score baixo, marcar como pendente de revisao, sem vincular automaticamente.
- Garantir refresh/inclusao do Hub a partir de `customers_auvo` antes ou durante a carga GLPI.
- Sincronizar/cachear `GLPI Peripheral` em `glpi_devices` para todos os matches confiaveis.
- Criar painel de revisao/configuracao de vinculos pendentes.
- Adicionar Zabbix como fonte para host/IP/status.
- Criar motor de divergencias por campo critico.
- Permitir escolha manual da fonte canonica por campo.
- Permitir `PUT/PATCH` para atualizar fontes externas quando a API permitir.

## Observacao Para Continuidade Em Novo Chat

Retomar daqui: a base do modal e do Hub ja foi criada. O proximo passo e implementar uma rotina leve/segura de associacao automatica Hub -> GLPI device usando `Peripheral.contact_num` como chave primaria contra `customers_auvo.customerId`, com fallback por nome normalizado somente quando houver match unico e score alto. Evitar voltar ao vinculo hardcoded do piloto; usar `hub_entity_links` e `glpi_devices`.
