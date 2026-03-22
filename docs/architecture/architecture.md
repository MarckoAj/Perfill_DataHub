# Perfill Data Hub - Arquitetura

## Visão Geral

O **Perfill Data Hub** é uma plataforma de integração responsável por coletar, armazenar, normalizar e disponibilizar dados operacionais provenientes de múltiplos sistemas externos.

Sistemas atualmente suportados ou planejados:

* GLPI (Service Desk)
* AUVO (Gestão de tarefas)
* Zabbix (Monitoramento)

O objetivo do projeto é funcionar como um **Integration Hub**, permitindo:

* sincronização de dados entre plataformas
* geração de alertas operacionais
* disponibilização de dados para BI
* correlação entre eventos de diferentes sistemas

---

# Arquitetura de Alto Nível

Fluxo geral do sistema:

External Systems
↓
Integration Clients
↓
Raw Data Storage
↓
Data Normalization
↓
Core Services
↓
Alert Engine
↓
API / BI / Automations

---

# Camadas do Sistema

## API Layer

Responsável por expor endpoints HTTP.

Localização:

src/api

Responsabilidades:

* routes
* controllers
* middlewares
* autenticação
* validação de requisições

---

## Core Layer

Contém as regras de negócio do sistema.

Localização:

src/core

Exemplos de módulos:

* tickets
* alert engine
* serviços de sincronização
* correlação de eventos

---

## Integrations Layer

Responsável pela comunicação com APIs externas.

Localização:

src/integrations

Cada sistema possui seu próprio módulo de integração:

integrations/
glpi/
auvo/
zabbix/

Cada integração normalmente possui:

* client (comunicação com API externa)
* mapper (transformação de dados)
* service de ingestão

---

## Data Layer

Responsável pela persistência de dados.

Localização:

src/database
src/repositories

O banco de dados possui dois níveis principais de dados:

### RAW DATA

Dados recebidos diretamente das APIs externas sem transformação.

Exemplo de tabela:

raw_glpi_tickets

Estrutura típica:

* id
* external_id
* payload_json
* fetched_at

Objetivo da camada RAW:

* auditoria
* rastreabilidade
* reprocessamento de dados
* debug de integrações
* histórico completo

---

### Normalized Data

Após o armazenamento RAW, os dados são transformados para o modelo interno da aplicação.

Exemplos de tabelas normalizadas:

* tickets
* alerts
* integrations_status
* Tabelas do AUVO com gestão de `isActive` e `deletedAt` (Soft Delete)

Esses dados são utilizados diretamente pelo sistema e pelos endpoints da API, e mantêm uma janela de resiliência caso os dados sejam apagados da origem temporariamente.

---

## Jobs Layer

Responsável por rotinas automáticas de sincronização.

Localização:

src/jobs

Exemplos de jobs planejados:

* glpiSync.job.js
* auvoSync.job.js
* auvoRetentionJob.js (Purge físico agendado de dados deletados)
* zabbixSync.job.js

Esses jobs executam processos como:

* sincronização incremental
* ingestão de novos dados
* atualização de registros existentes

---

## Alert Engine

O Alert Engine é responsável por detectar condições operacionais importantes no sistema.

Exemplos de alertas:

* ticket sem atualização por determinado período
* tarefa AUVO fechada sem atualização no GLPI
* falha em integração externa
* inconsistências entre sistemas

O Alert Engine permite monitoramento operacional e geração de alertas automáticos.

---

# Fluxo de Dados

Fluxo típico de ingestão de dados:

GLPI API
↓
Integration Client
↓
Raw Data Storage
↓
Mapper
↓
Normalized Database
↓
Alert Engine
↓
API / BI

---

# Evoluções Futuras

O projeto poderá evoluir para suportar:

* arquitetura orientada a eventos (Event Driven)
* correlação automática entre plataformas
* automações operacionais
* geração automática de tarefas
* dashboards operacionais
* monitoramento avançado das integrações
