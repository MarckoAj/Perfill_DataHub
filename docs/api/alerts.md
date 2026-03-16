# API de Alertas - Contratos e Exemplos

## Visão Geral

A API de Alertas do Perfill Data Hub fornece endpoints para consulta e monitoramento de alertas de tickets, com suporte a filtros avançados, paginação e detalhes por ticket.

## Autenticação

Todos os endpoints de alertas requerem autenticação via token Bearer:

```
Authorization: Bearer <API_AUTH_TOKEN>
```

## Endpoints

### 1. Listar Alertas

**Endpoint**: `GET /api/alerts`

**Descrição**: Retorna lista de alertas com suporte a filtros e paginação.

#### Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `state` | string | Filtrar por estado do alerta | `open`, `closed` |
| `type` | string | Filtrar por tipo de alerta | `new_unhandled`, `paused_stale`, `sla_overdue` |
| `severity` | string | Filtrar por severidade | `low`, `medium`, `high`, `critical` |
| `startDate` | string | Data inicial (ISO 8601) | `2026-03-01` |
| `endDate` | string | Data final (ISO 8601) | `2026-03-15` |
| `limit` | number | Limite de resultados (1-500) | `50` |
| `offset` | number | Offset para paginação | `0` |
| `page` | number | Número da página (alternativa ao offset) | `1` |
| `sortBy` | string | Campo de ordenação | `last_detected_at`, `first_detected_at`, `severity` |
| `sortOrder` | string | Ordem de classificação | `ASC`, `DESC` |

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "ticket_id": 123,
      "alert_type": "new_unhandled",
      "severity": "medium",
      "message": "Ticket novo sem tratativa há mais de 5 minutos",
      "state": "open",
      "first_detected_at": "2026-03-15T10:00:00Z",
      "last_detected_at": "2026-03-15T10:00:00Z",
      "closed_at": null,
      "created_at": "2026-03-15T10:00:00Z",
      "updated_at": "2026-03-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "page": 1,
    "hasMore": true,
    "totalPages": 3
  }
}
```

#### Exemplos de Uso

**Filtrar alertas abertos no período:**
```bash
GET /api/alerts?state=open&startDate=2026-03-01&endDate=2026-03-15
```

**Paginação por página:**
```bash
GET /api/alerts?page=2&limit=25&sortBy=last_detected_at&sortOrder=DESC
```

**Alertas críticos:**
```bash
GET /api/alerts?severity=critical&state=open
```

---

### 2. Alertas por Ticket

**Endpoint**: `GET /api/alerts/:ticketId`

**Descrição**: Retorna histórico completo de alertas para um ticket específico.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ticketId` | string | ID do ticket |

#### Response

```json
{
  "ticketId": "123",
  "alerts": [
    {
      "id": 1,
      "ticket_id": 123,
      "alert_type": "new_unhandled",
      "severity": "medium",
      "message": "Ticket novo sem tratativa há mais de 5 minutos",
      "state": "open",
      "first_detected_at": "2026-03-15T10:00:00Z",
      "last_detected_at": "2026-03-15T10:00:00Z",
      "closed_at": null,
      "created_at": "2026-03-15T10:00:00Z",
      "updated_at": "2026-03-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### Exemplo de Uso

```bash
GET /api/alerts/123
```

---

### 3. Resumo de Alertas (Health)

**Endpoint**: `GET /api/health/alerts`

**Descrição**: Retorna resumo estatístico dos alertas ativos.

#### Response

```json
{
  "status": "ok",
  "alerts": {
    "open_alerts": 15,
    "closed_alerts": 142,
    "total_alerts": 157
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

---

## Tipos de Alerta

| Tipo | Descrição | Severidade Padrão |
|------|-----------|-------------------|
| `new_unhandled` | Ticket novo sem tratativa > 5 min | `medium` |
| `paused_stale` | Ticket pendente sem atualização > 7 dias | `high` |
| `sla_overdue` | SLA vencido | `critical` |

## Estados de Alerta

| Estado | Descrição |
|--------|-----------|
| `open` | Alerta ativo |
| `closed` | Alerta resolvido |

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos |
| 401 | Não autorizado (token inválido) |
| 404 | Ticket não encontrado |
| 500 | Erro interno do servidor |

## Limites

- **Limite máximo por página**: 500 resultados
- **Limite padrão**: 50 resultados
- **Campos ordenáveis**: `last_detected_at`, `first_detected_at`, `created_at`, `updated_at`, `severity`, `state`, `ticket_id`, `alert_type`

---

## Exemplos Práticos

### Dashboard de Monitoramento

```javascript
// Buscar alertas críticos abertos
const criticalAlerts = await fetch('/api/alerts?state=open&severity=critical&limit=10');

// Buscar alertas do último dia
const todayAlerts = await fetch('/api/alerts?startDate=2026-03-15&endDate=2026-03-15');

// Histórico de um ticket específico
const ticketHistory = await fetch('/api/alerts/12345');
```

### Análise de Tendências

```javascript
// Alertas por tipo nos últimos 7 dias
const weeklyTrends = await fetch('/api/alerts?startDate=2026-03-08&endDate=2026-03-15&sortBy=type&sortOrder=ASC');

// Paginação para grandes volumes
const page1 = await fetch('/api/alerts?page=1&limit=100');
const page2 = await fetch('/api/alerts?page=2&limit=100');
```
