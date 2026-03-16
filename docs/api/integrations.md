# API de Integrações - Contratos e Exemplos

## Visão Geral

A API de Integrações do Perfill Data Hub fornece endpoints para monitoramento do status das integrações externas (GLPI, AUVO, Zabbix) e métricas operacionais do sistema.

## Autenticação

Os endpoints de integrações não requerem autenticação (são públicos para monitoramento).

## Endpoints

### 1. Health Check Geral do Sistema

**Endpoint**: `GET /api/integrations`

**Descrição**: Retorna status consolidado de todas as integrações e saúde geral do sistema.

#### Response

```json
{
  "status": "healthy",
  "integrations": {
    "glpi": {
      "status": "connected",
      "last_sync": "2026-03-15T10:00:00Z",
      "metrics": {
        "last_sync": "2026-03-15T10:00:00Z",
        "total_tickets": 150,
        "new_tickets": 5,
        "assigned_tickets": 25,
        "overdue_tickets": 3
      }
    }
  },
  "alerts": {
    "critical_count": 2,
    "status": "normal"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Status Possíveis

| Status Sistema | Descrição |
|---------------|-----------|
| `healthy` | Sistema funcionando normalmente |
| `degraded` | Sistema com problemas (muitos alertas críticos) |
| `error` | Erro grave (falha em integração crítica) |

#### Status de Integração

| Status Integração | Descrição |
|------------------|-----------|
| `connected` | Integração ativa e sincronizada |
| `disconnected` | Integração inativa ou sem sincronização recente |
| `error` | Erro na integração |

#### Exemplo de Uso

```bash
GET /api/integrations
```

---

### 2. Status Específico do GLPI

**Endpoint**: `GET /api/integrations/glpi`

**Descrição**: Retorna status detalhado da integração com GLPI.

#### Response

```json
{
  "integration": "glpi",
  "status": "connected",
  "metrics": {
    "last_sync": "2026-03-15T10:00:00Z",
    "total_tickets": 150,
    "new_tickets": 5,
    "assigned_tickets": 25,
    "overdue_tickets": 3
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Métricas GLPI

| Métrica | Descrição |
|---------|-----------|
| `last_sync` | Timestamp da última sincronização bem-sucedida |
| `total_tickets` | Total de tickets sincronizados (últimas 24h) |
| `new_tickets` | Tickets em status "novo" |
| `assigned_tickets` | Tickets em status "atribuído" |
| `overdue_tickets` | Tickets com SLA vencido |

#### Exemplo de Uso

```bash
GET /api/integrations/glpi
```

---

## Casos de Uso

### Monitoramento de Sistema

```javascript
// Health check geral
const systemHealth = await fetch('/api/integrations');
const health = await systemHealth.json();

if (health.status === 'degraded') {
  console.warn('Sistema degradado - verificar alertas críticos');
}

if (health.integrations.glpi.status !== 'connected') {
  console.error('GLPI desconectado - verificar sincronização');
}
```

### Dashboard Operacional

```javascript
// Status do GLPI para dashboard
const glpiStatus = await fetch('/api/integrations/glpi');
const glpi = await glpiStatus.json();

// Exibir métricas
console.log(`Tickets ativos: ${glpi.metrics.total_tickets}`);
console.log(`Tickets atrasados: ${glpi.metrics.overdue_tickets}`);
console.log(`Última sincronização: ${glpi.metrics.last_sync}`);
```

### Automação e Alertas

```javascript
// Verificação automatizada de saúde
setInterval(async () => {
  const response = await fetch('/api/integrations');
  const health = await response.json();
  
  if (health.status === 'error') {
    // Enviar notificação para equipe de operações
    await sendAlert('Sistema em estado de erro', health);
  }
}, 300000); // Verificar a cada 5 minutos
```

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 503 | Serviço indisponível (erro de sistema) |

## Formatos de Data

Todos os timestamps seguem o formato **ISO 8601**:
```
2026-03-15T10:00:00Z
```

## Limites e Considerações

- **Frequência**: Evitar polling excessivo (mínimo 30 segundos entre requisições)
- **Cache**: Dados são cacheados internamente por 60 segundos
- **Retenção**: Métricas baseadas nos últimos 24 horas de atividade

---

## Exemplos de Respostas de Erro

### Sistema Degradado

```json
{
  "status": "degraded",
  "integrations": {
    "glpi": {
      "status": "connected",
      "last_sync": "2026-03-15T08:00:00Z",
      "metrics": {
        "last_sync": "2026-03-15T08:00:00Z",
        "total_tickets": 200,
        "new_tickets": 15,
        "assigned_tickets": 30,
        "overdue_tickets": 25
      }
    }
  },
  "alerts": {
    "critical_count": 18,
    "status": "critical"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

### Erro de Sistema

```json
{
  "status": "error",
  "error": "Database connection failed",
  "timestamp": "2026-03-15T10:00:00Z"
}
```
