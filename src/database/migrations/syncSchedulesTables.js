import db from "../connection.js";

const createSyncSchedulesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sync_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`system\` VARCHAR(50) NOT NULL COMMENT 'e.g., AUVO, GLPI',
      cron_expression VARCHAR(100) NOT NULL COMMENT 'e.g., 0 */4 * * *',
      date_range VARCHAR(50) DEFAULT NULL COMMENT 'e.g., WEEK, MONTH, YEAR, FULL',
      filters JSON DEFAULT NULL COMMENT 'e.g., {"excludeStatus": ["fechado"]}',
      is_active BOOLEAN DEFAULT TRUE,
      description VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(query);
    console.log("✅ Tabela 'sync_schedules' garantida com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao criar tabela 'sync_schedules':", error.message);
    throw error;
  }
};

export { createSyncSchedulesTable };
