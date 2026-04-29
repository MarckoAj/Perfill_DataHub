# Escopo: Modo Dashboard & Alert Engine

Este documento detalha a implementação do novo componente de monitoramento operacional e o motor de alertas do Perfill DataHub.

## 1. Visão Geral (Video Wall v2)

O **Modo Dashboard** foi evoluído para uma versão de alta densidade (v2), focada em visibilidade de longo alcance e interatividade rápida.

### 1.1 Elementos de Interface
- **Header dinâmico**: Contadores de severidade que funcionam como filtros globais para a galeria de alertas.
- **Chip "Total"**: Adicionado no header para visão geral do ecossistema de chamados.
- **Galeria de Banners (Sidebar)**: Lista de alertas que utilizam o estilo completo do `TicketAlertBanner` em escala reduzida, com paginação por setas.
- **Mini-Tabela (Lista Geral)**: Versão compacta da lista de chamados principal, contendo apenas: Local, Ativo, Categoria e SLA.

---

## 2. Modelo de Dados Sincronizado (API GLPI)

Para garantir compatibilidade com os dados existentes no `index.html`, o mapeamento de campos foi padronizado:

| Campo Dashboard | Propriedade API | Descrição |
| :--- | :--- | :--- |
| **Ticket ID** | `Ticket` | ID numérico do chamado no GLPI |
| **Título** | `Chamado` | Título curto ou descrição resumida |
| **Descrição** | `Descrição` | Texto completo do chamado |
| **Local** | `Cliente Local` | Localização (última parte da string com `>`) |
| **Categoria** | `Categoria` | Categoria ITIL ou técnica |
| **Status SLA** | `Status do SLA` | Vencido, No Prazo, Atenção |
| **Status Chamado** | `Status do Chamado` | Novo, Atribuído, Solucionado, etc |

---

## 3. Gatilhos de Eventos (Alert Engine)

A lógica do Backend (próxima fase) deve processar as seguintes triggers:

- **T1 (Informativo)**: Ticket aberto sem interação por mais de **5 minutos**.
- **T2 (Atenção)**: Ticket com consumo superior a **50% do prazo de SLA**.
- **T3 (Atenção/Zabbix)**: Ponto operacional sem interação por mais de **10 minutos** (integração futura).

---

## 4. Progresso e Status

### ✅ Frontend (Concluído)
- [x] Layout Base (Grid/Stacks) idêntico ao `main.js`.
- [x] Estilização Ultra-Compacta de banners para barra lateral.
- [x] Lógica de filtragem e contagem dinâmica no Header.
- [x] Mini-tabela lateral com badges de SLA coloridos.
- [x] Navegação e Paginação da galeria de alertas.

### ⏳ Backend (Pendente)
- [ ] Criação da tabela `dashboard_alerts`.
- [ ] Implementação do `alertEngineService.js` (Processamento de Triggers).
- [ ] Integração real via API `GET /api/dashboard/alerts`.

---

**Nível de Esforço Recomendado:** `médio/alto`
**Última Atualização:** 27/04/2026 - Finalização do Protótipo Visual v2.
