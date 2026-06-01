# HUB Core Entity Progress

Este documento acompanha a criacao incremental da entidade canonica do HUB.

## Objetivo

Criar uma camada canonica simples para o HUB consolidar dados vindos de plataformas externas sem perder o estado atual de cada fonte.

Nesta primeira fase, o HUB vai expor para o frontend apenas:

- nome
- latitude
- longitude

## Decisoes Arquiteturais

- O HUB nao deve substituir as tabelas normalizadas das plataformas externas.
- As tabelas `customers_auvo`, `tickets`, `tasks_auvo` e futuras tabelas Zabbix continuam existindo como estado normalizado por fonte.
- A entidade canonica sera alimentada inicialmente pelo AUVO, mas preparada para receber GLPI e Zabbix depois.
- Valores por campo e fonte ficam separados para permitir divergencias futuras, como `latitude` no AUVO diferente da `latitude` no GLPI.
- A primeira fonte canonica sera `AUVO/customer`, porque ja existe sync funcional de `customers_auvo`.

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

## Proximas Fases

- Adicionar GLPI como fonte para nome/localizacao.
- Adicionar Zabbix como fonte para host/IP/status.
- Criar motor de divergencias por campo critico.
- Permitir escolha manual da fonte canonica por campo.
- Permitir `PUT/PATCH` para atualizar fontes externas quando a API permitir.
