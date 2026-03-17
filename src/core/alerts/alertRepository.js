import pool from "../../database/connection.js";

class AlertRepository {
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

    const formatDate = (d) => d && typeof d === 'string' && d.endsWith('Z') ? d.slice(0, 19).replace('T', ' ') : d;

    for (const alert of alerts) {
      const closedAt = alert.closedAt || new Date().toISOString();
      const values = [
        formatDate(closedAt),
        formatDate(alert.lastDetectedAt || closedAt),
        alert.ticketId,
        alert.type,
      ];

      await pool.query(query, values);
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
}

export default new AlertRepository();
