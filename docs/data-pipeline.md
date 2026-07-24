# Data Pipeline

## Conceito

O pipeline do Perfill Data Hub coleta dados externos, persiste estado local, normaliza informacoes operacionais e disponibiliza os dados para dashboards, BI, HUB canonico e Alert Engine.

## Fluxo Geral

```text
Fonte externa
  -> integration client
  -> mapper
  -> raw/normalized repository
  -> banco local
  -> services de dominio
  -> APIs, dashboards, HUB canonico e Alert Engine
```

## Camada RAW

A camada RAW preserva payloads externos quando aplicavel. Ela e importante para:

- auditoria;
- rastreabilidade;
- diagnostico;
- reprocessamento;
- comparacao entre payload original e modelo normalizado.

Exemplo:

- `raw_glpi_tickets`

## Camada Normalizada por Fonte

As tabelas normalizadas guardam o estado operacional de cada sistema externo.

Exemplos:

- `tickets`
- `tasks_auvo`
- `customers_auvo`
- tabelas auxiliares AUVO;
- tabelas de alertas e logs.

Essa camada deve continuar existindo mesmo com o crescimento do HUB canonico. O HUB consolida; ele nao apaga a necessidade do estado por fonte.

## Mappers

Os mappers convertem campos externos para o formato interno. O padrao esperado e:

```text
payload externo -> mapper -> objeto interno -> repository
```

Nao duplicar logica de mapper em controllers ou frontend.

## Sincronizacao Incremental e Manual

O projeto possui sincronizacao automatizada e endpoints manuais.

Exemplos:

- `GET|POST /api/bi/sync` para GLPI.
- `POST /api/auvo/sync` para AUVO.
- scheduler dinamico iniciado por `dynamicScheduler.startManager()`.

O sistema tambem limpa sincronizacoes travadas no boot usando `syncLogRepository.cleanupStuckSyncs()`.

## Soft Delete e Retencao

Para entidades AUVO, o projeto usa ciclo de vida com soft delete:

- ativo: registro ainda existe na origem;
- deletado logico: registro deixou de aparecer na origem;
- deletado fisico: purge posterior conforme politica de retencao.

Isso evita perda brusca de dados para dashboard/BI e permite tolerancia a inconsistencias temporarias da origem.

## HUB Canonico

O HUB canonico cria uma camada de entidades operacionais consolidadas. A primeira fase expoe dados basicos como:

- nome;
- latitude;
- longitude;
- origem do valor.

Endpoint atual:

- `GET /api/hub/entities`

Fonte inicial:

- AUVO customers.

## Alert Engine

Apos a normalizacao, dados de GLPI/AUVO podem alimentar o `RuleEngine`.

Fluxo resumido:

```text
ticket/tarefa normalizada
  -> service de alerta
  -> RuleEngine
  -> alertRepository
  -> WebSocket/API
```

As regras devem ser pequenas, testaveis e sem efeitos colaterais diretos de banco ou rede.

## Pontos de Atencao

- Evitar jobs sobrepostos quando uma sincronizacao demora mais que o intervalo configurado.
- Monitorar queries pesadas do dashboard.
- Expandir logs de falha de integracao para alertas visiveis ao NOC.
- Cobrir HUB e scheduler com testes automatizados.
