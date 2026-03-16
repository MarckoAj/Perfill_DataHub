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

    for (const alert of alerts) {
      const values = [
        alert.ticketId,
        alert.type,
        alert.severity,
        alert.message,
        alert.firstDetectedAt,
        alert.lastDetectedAt,
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
        closedAt,
        alert.lastDetectedAt || closedAt,
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
}

export default new AlertRepository();
