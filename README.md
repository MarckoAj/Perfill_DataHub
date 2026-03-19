# Perfill Data Hub

O **Perfill Data Hub** é uma plataforma de integração responsável por coletar, armazenar, normalizar e disponibilizar dados operacionais provenientes de múltiplos sistemas corporativos.

O objetivo do projeto é funcionar como um **hub central de dados operacionais**, permitindo que diferentes plataformas compartilhem informações de forma estruturada e que esses dados possam ser utilizados para **monitoramento, automações e análise em ferramentas de BI**.

---

# Visão Geral

Em muitos ambientes de suporte e operação, sistemas diferentes trabalham de forma isolada:

* sistemas de **Service Desk**
* plataformas de **gestão de tarefas**
* ferramentas de **monitoramento de infraestrutura**

O Perfill Data Hub atua como uma camada intermediária que:

* coleta dados desses sistemas
* armazena os dados de forma estruturada
* gera alertas operacionais
* disponibiliza endpoints para consumo por outras aplicações

---

# Sistemas Integrados

## GLPI

Sistema de Service Desk utilizado para gerenciamento de chamados.

A integração permite:

* coleta de tickets
* análise de status e responsáveis
* geração de relatórios
* integração com ferramentas de BI

---

## AUVO (Planejado)

Sistema de gestão de tarefas de campo.

A futura integração permitirá:

* acompanhamento de tarefas executadas
* correlação entre tarefas e chamados
* geração de alertas operacionais

Exemplo:

tarefa AUVO finalizada
ticket GLPI sem atualização

→ gerar alerta operacional

---

## Zabbix (Planejado)

Sistema de monitoramento de infraestrutura.

A integração permitirá:

* detectar falhas em dispositivos
* correlacionar falhas com chamados existentes
* iniciar processos automáticos de atendimento

Exemplo:

dispositivo offline no Zabbix
↓
verificar ticket no GLPI
↓
abrir tarefa no AUVO

---

# Principais Características

## Plataforma de Integração

O sistema foi projetado como um **Integration Hub**, permitindo conectar múltiplos sistemas operacionais em um único ponto.

---

## Data Pipeline

Os dados coletados passam por um pipeline composto por:

1. ingestão de dados
2. armazenamento em formato bruto (RAW)
3. normalização
4. processamento pelas regras de negócio

Isso permite:

* rastreabilidade completa
* reprocessamento de dados
* auditoria de integrações

---

## Alert Engine

O projeto possui um mecanismo de geração de alertas capaz de identificar situações operacionais relevantes, como:

* tickets sem atualização
* inconsistências entre plataformas
* falhas de integração

---

## Endpoints para BI

O sistema disponibiliza endpoints voltados para consumo por ferramentas de análise, como **Power BI**, permitindo a criação de dashboards operacionais.

---

## Arquitetura Modular

O projeto segue uma arquitetura modular com separação clara entre camadas:

* API
* Core (regras de negócio)
* Integrações externas
* Repositórios de dados
* Jobs de sincronização

Essa estrutura facilita:

* manutenção
* expansão para novas integrações
* testes automatizados

---

# Estrutura do Projeto

Principais diretórios:

src/

api → rotas e controllers HTTP
core → regras de negócio
integrations → comunicação com sistemas externos
repositories → acesso ao banco de dados
database → configuração e conexão com o banco
jobs → rotinas automáticas de sincronização
shared → utilidades e componentes compartilhados

---

# Documentação

A documentação técnica detalhada do projeto está disponível em:

docs/

* architecture.md
* data-pipeline.md
* integrations.md
* roadmap.md
* implementation-status.md

---

# Objetivo do Projeto

Este projeto foi desenvolvido como uma **plataforma de integração e automação operacional**, com foco em ambientes que utilizam múltiplas ferramentas para suporte técnico, monitoramento e gestão de tarefas.

A proposta é centralizar dados, gerar inteligência operacional e permitir automações entre diferentes sistemas.
