import pool from "../database/connection.js";

class AlertRepository {
  // ─── Helpers internos ───────────────────────────────────────────────────────

  _formatDate(d) {
    if (!d) return null;
    return typeof d === 'string' && d.endsWith('Z')
      ? d.slice(0, 19).replace('T', ' ')
      : d;
  }

  /**
   * Grava um registro imutável no histórico de alertas.
   * Chamado sempre que um alerta é fechado (pelo sistema ou manualmente).
   */
  async _insertHistory({ ticket_id, alert_type, severity, message, source, opened_at, closed_at, closed_by = 'system', closed_reason = null }) {
    try {
      const openedDate  = opened_at  ? new Date(opened_at)  : null;
      const closedDate  = closed_at  ? new Date(closed_at)  : new Date();
      const durationMin = openedDate
        ? Math.round((closedDate - openedDate) / 60000)
        : null;

      await pool.query(
        `INSERT INTO datahub_alerts_history
           (ticket_id, alert_type, severity, source, message, opened_at, closed_at, closed_by, closed_reason, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ticket_id,
          alert_type,
          severity        || 'low',
          source          || 'GLPI',
          message         || '',
          this._formatDate(opened_at),
          this._formatDate(closed_at || new Date().toISOString()),
          closed_by,
          closed_reason,
          durationMin,
        ]
      );
    } catch (err) {
      // Não bloqueia o fluxo principal se o histórico falhar
      console.error('[AlertRepository] Falha ao gravar histórico:', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  async upsertActiveAlerts(alerts) {
    if (!alerts || alerts.length === 0) return;

    const query = `
      INSERT INTO datahub_ticket_alerts (
        ticket_id,
        alert_type,
        severity,
        message,
        state,
        first_detected_at,
        last_detected_at,
        closed_at
      ) VALUES (?, ?, ?, ?, 'open', ?, ?, NULL)
      ON DUPLICATE KEY UPDATE
        severity = VALUES(severity),
        message = VALUES(message),
        state = 'open',
        last_detected_at = VALUES(last_detected_at),
        closed_at = NULL
    `;

    const formatDate = (d) => d && typeof d === 'string' && d.endsWith('Z') ? d.slice(0, 19).replace('T', ' ') : d;

    for (const alert of alerts) {
      const values = [
        alert.ticketId,
        alert.type,
        alert.severity,
        alert.message,
        formatDate(alert.firstDetectedAt),
        formatDate(alert.lastDetectedAt),
      ];

      await pool.query(query, values);
    }
  }

  async closeAlerts(alerts) {
    if (!alerts || alerts.length === 0) return;

    const query = `
      UPDATE datahub_ticket_alerts
      SET
        state = 'closed',
        closed_at = ?,
        last_detected_at = ?
      WHERE ticket_id = ? AND alert_type = ?
    `;

    for (const alert of alerts) {
      const closedAt = alert.closedAt || new Date().toISOString();
      const values = [
        this._formatDate(closedAt),
        this._formatDate(alert.lastDetectedAt || closedAt),
        alert.ticketId,
        alert.type,
      ];

      await pool.query(query, values);

      // Grava no histórico
      await this._insertHistory({
        ticket_id:    alert.ticketId,
        alert_type:   alert.type,
        severity:     alert.severity,
        message:      alert.message,
        source:       alert.source || 'GLPI',
        opened_at:    alert.firstDetectedAt,
        closed_at:    closedAt,
        closed_by:    'system',
        closed_reason: null,
      });
    }
  }

  async getSummary() {
    const query = `
      SELECT
        SUM(CASE WHEN state = 'open' THEN 1 ELSE 0 END) AS open_alerts,
        SUM(CASE WHEN state = 'closed' THEN 1 ELSE 0 END) AS closed_alerts,
        COUNT(*) AS total_alerts
      FROM datahub_ticket_alerts
    `;

    const [rows] = await pool.query(query);
    return rows[0] || { open_alerts: 0, closed_alerts: 0, total_alerts: 0 };
  }

  async getAlertsByTicketId(ticketId) {
    if (!ticketId) {
      throw new Error("Ticket ID é obrigatório");
    }

    const query = `
      SELECT
        id,
        ticket_id,
        alert_type,
        severity,
        message,
        state,
        first_detected_at,
        last_detected_at,
        closed_at,
        created_at,
        updated_at
      FROM datahub_ticket_alerts
      WHERE ticket_id = ?
      ORDER BY first_detected_at DESC
    `;

    const [rows] = await pool.query(query, [ticketId]);
    return rows;
  }

  async getAlerts({
    state,
    type,
    severity,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
    page,
    sortBy = "last_detected_at",
    sortOrder = "DESC",
  } = {}) {
    const allowedSortBy = new Set([
      "last_detected_at",
      "first_detected_at",
      "created_at",
      "updated_at",
      "severity",
      "state",
      "ticket_id",
      "alert_type",
    ]);
    const normalizedSortBy = allowedSortBy.has(sortBy) ? sortBy : "last_detected_at";
    const normalizedSortOrder = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const parsedLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 500) : 50;
    
    // Suporte a paginação por page ou offset
    let parsedOffset;
    if (page !== undefined && page !== null) {
      const pageNum = Number.isFinite(Number(page)) ? Math.max(Number(page), 1) : 1;
      parsedOffset = (pageNum - 1) * parsedLimit;
    } else {
      parsedOffset = Number.isFinite(Number(offset)) ? Math.max(Number(offset), 0) : 0;
    }

    const conditions = [];
    const params = [];

    if (state) {
      conditions.push("state = ?");
      params.push(state);
    }

    if (type) {
      conditions.push("alert_type = ?");
      params.push(type);
    }

    if (severity) {
      conditions.push("severity = ?");
      params.push(severity);
    }

    if (startDate) {
      conditions.push("first_detected_at >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("first_detected_at <= ?");
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataQuery = `
      SELECT
        id,
        ticket_id,
        alert_type,
        severity,
        message,
        state,
        first_detected_at,
        last_detected_at,
        closed_at,
        created_at,
        updated_at
      FROM datahub_ticket_alerts
      ${whereClause}
      ORDER BY ${normalizedSortBy} ${normalizedSortOrder}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM datahub_ticket_alerts
      ${whereClause}
    `;

    const [rows] = await pool.query(dataQuery, [...params, parsedLimit, parsedOffset]);
    const [countRows] = await pool.query(countQuery, params);
    const total = Number(countRows?.[0]?.total || 0);

    return {
      data: rows,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        page: page !== undefined && page !== null ? Math.max(Number(page), 1) : Math.floor(parsedOffset / parsedLimit) + 1,
        hasMore: parsedOffset + parsedLimit < total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  }
  async checkDatabaseConnection() {
    await pool.query("SELECT 1");
  }

  // Métodos para suporte à nova lógica de TicketAlertService
  async selecTicketAlert({ glpi_ticketId, ruleId }) {
    const query = `
      SELECT *, 
      (CASE WHEN state IN ('closed', 'justified') THEN 1 ELSE 0 END) as checked 
      FROM datahub_ticket_alerts 
      WHERE ticket_id = ? AND alert_type = ?
    `;
    const [rows] = await pool.query(query, [glpi_ticketId, ruleId]);
    return rows;
  }

  async selecTicketAlertById(id) {
    const query = `SELECT * FROM datahub_ticket_alerts WHERE id = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows;
  }

  async insertTicketAlert({ glpi_ticketId, rule }) {
    // Mapeando a severidade numérica para a string esperada pela tabela, se necessário.
    // 1: informativos (low), 2: atenção (medium), 3: críticos (high)
    const severityMap = {
      1: "low",
      2: "medium",
      3: "high"
    };
    
    const mappedSeverity = severityMap[rule.severity] || "low";
    
    const query = `
      INSERT INTO datahub_ticket_alerts (
        ticket_id, alert_type, severity, message, state, first_detected_at, last_detected_at
      ) VALUES (?, ?, ?, ?, 'open', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        severity = VALUES(severity),
        message = VALUES(message),
        state = 'open',
        first_detected_at = IF(
          datahub_ticket_alerts.state IN ('closed', 'justified'),
          VALUES(first_detected_at),
          datahub_ticket_alerts.first_detected_at
        ),
        last_detected_at = VALUES(last_detected_at),
        closed_at = NULL,
        justified_by = NULL,
        justified_text = NULL,
        justified_at = NULL
    `;
    const [result] = await pool.query(query, [glpi_ticketId, rule.ruleId, mappedSeverity, rule.description]);
    return result;
  }

  async updateTicketAlert({ checked, justifiedText, glpi_ticketId, ruleId }) {
    const state = checked ? 'closed' : 'open';
    const query = `
      UPDATE datahub_ticket_alerts 
      SET state = ?, 
          closed_at = IF(? = 'closed', NOW(), NULL), 
          last_detected_at = NOW() 
      WHERE ticket_id = ? AND alert_type = ?
    `;
    const [result] = await pool.query(query, [state, state, glpi_ticketId, ruleId]);

    // Se fechando → grava histórico
    if (checked) {
      try {
        const [rows] = await pool.query(
          `SELECT severity, message, first_detected_at FROM datahub_ticket_alerts
           WHERE ticket_id = ? AND alert_type = ? LIMIT 1`,
          [glpi_ticketId, ruleId]
        );
        if (rows && rows.length > 0) {
          await this._insertHistory({
            ticket_id:     glpi_ticketId,
            alert_type:    ruleId,
            severity:      rows[0].severity,
            message:       rows[0].message,
            source:        'GLPI',
            opened_at:     rows[0].first_detected_at,
            closed_at:     new Date().toISOString(),
            closed_by:     justifiedText === 'Status justificado pelo sistema' ? 'system' : 'user',
            closed_reason: justifiedText || null,
          });
        }
      } catch (histErr) {
        console.error('[AlertRepository] Histórico no updateTicketAlert falhou:', histErr.message);
      }
    }

    return result;
  }

  async justifyAlert({ alertId, justifiedBy, justifiedText }) {
    const query = `
      UPDATE datahub_ticket_alerts
      SET state = 'justified',
          justified_by = ?,
          justified_text = ?,
          justified_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [justifiedBy, justifiedText, alertId]);
    
    if (result.affectedRows > 0) {
       try {
         const [rows] = await pool.query(
            `SELECT ticket_id, alert_type, severity, message, first_detected_at FROM datahub_ticket_alerts
             WHERE id = ? LIMIT 1`,
            [alertId]
          );
          if (rows && rows.length > 0) {
            await this._insertHistory({
              ticket_id:     rows[0].ticket_id,
              alert_type:    rows[0].alert_type,
              severity:      rows[0].severity,
              message:       rows[0].message,
              source:        'GLPI',
              opened_at:     rows[0].first_detected_at,
              closed_at:     new Date().toISOString(),
              closed_by:     justifiedBy,
              closed_reason: `[JUSTIFICADO] ${justifiedText}`,
            });
          }
       } catch (histErr) {
         console.error('[AlertRepository] Histórico no justifyAlert falhou:', histErr.message);
       }
    }
    
    return result;
  }

  async getAlertFullDetails(alertId) {
    // 1. Dados do Alerta e Ticket
    const queryBase = `
      SELECT 
        a.id AS alertId,
        t.ticketId AS externalId,
        t.ticketId AS id,
        t.titulo AS title,
        t.descricao AS description,
        t.status,
        t.dataCriacao AS createdAt,
        t.tempoSla AS sla,
        t.nomeCliente AS address,
        t.projeto AS project,
        t.nomeTecnico AS noc_technician,
        CONCAT('https://glpi.perfilltecnologia.com.br/front/ticket.form.php?id=', t.ticketId) AS glpiUrl,
        'Não atribuído' AS field_technician 
      FROM datahub_ticket_alerts a
      JOIN tickets t ON a.ticket_id = t.ticketId
      WHERE a.id = ?
    `;
    const [baseRows] = await pool.query(queryBase, [alertId]);
    if (baseRows.length === 0) return null;

    const ticketData = baseRows[0];

    // 2. Interações (GLPI TicketTasks)
    const queryInteractions = `
      SELECT 
        content AS description,
        DATE_ADD(begin, INTERVAL -3 HOUR) AS date,
        nomeAutor AS author
      FROM glpi_tickettasks
      WHERE tickets_id = ?
      ORDER BY begin DESC
    `;
    const [interactions] = await pool.query(queryInteractions, [ticketData.id]);

    // 3. Tarefas AUVO
    const queryTasks = `
      SELECT 
        t.taskId,
        t.orientation AS title,
        CASE 
          WHEN t.taskStatusID = 5 THEN 'FINALIZADA'
          WHEN t.taskStatusID IN (2, 3) THEN 'EM_ANDAMENTO'
          ELSE 'PENDENTE'
        END AS status,
        u.name AS assignedTo
      FROM tasks_auvo t
      LEFT JOIN users_auvo u ON t.userToId = u.userId
      WHERE t.externalId = ?
      ORDER BY t.taskDate DESC
    `;
    const [tasks] = await pool.query(queryTasks, [ticketData.externalId]);

    return {
      alert: {
        alertId: ticketData.alertId,
        externalId: String(ticketData.externalId)
      },
      ticket: {
        id: ticketData.id,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        createdAt: ticketData.createdAt,
        sla: ticketData.sla,
        address: ticketData.address,
        project: ticketData.project,
        glpiUrl: ticketData.glpiUrl
      },
      technicians: {
        noc: ticketData.noc_technician,
        field: tasks.length > 0 ? tasks[0].assignedTo : 'Nenhum técnico em campo'
      },
      interactions: interactions,
      tasks: tasks
    };
  }
}

export default new AlertRepository();
