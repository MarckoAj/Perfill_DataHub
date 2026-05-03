import pool from "../connection.js";

export async function createAlertsHistoryTable() {
  console.log("Verificando tabela de histórico de alertas (datahub_alerts_history)...");

  const createHistoryTable = `
    CREATE TABLE IF NOT EXISTS datahub_alerts_history (
      id              BIGINT AUTO_INCREMENT PRIMARY KEY,
      ticket_id       BIGINT NOT NULL,
      alert_type      VARCHAR(100) NOT NULL,
      severity        ENUM('low', 'medium', 'high') NOT NULL,
      source          VARCHAR(50) NOT NULL DEFAULT 'GLPI',
      message         TEXT NOT NULL,
      opened_at       DATETIME NOT NULL,
      closed_at       DATETIME NOT NULL,
      closed_by       VARCHAR(100) NOT NULL DEFAULT 'system',
      closed_reason   TEXT NULL,
      duration_minutes INT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_hist_ticket   (ticket_id),
      KEY idx_hist_type     (alert_type),
      KEY idx_hist_opened   (opened_at),
      KEY idx_hist_closed   (closed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(createHistoryTable);
    console.log("✅ Tabela datahub_alerts_history validada.");
  } catch (error) {
    console.error("❌ Erro ao criar tabela datahub_alerts_history:", error.message);
  }
}
