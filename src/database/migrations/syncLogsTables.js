import pool from "../connection.js";

export async function createSyncLogsTables() {
  console.log("Verificando tabelas de auditoria (sync_history e sync_logs)...");

  const createHistoryTable = `
    CREATE TABLE IF NOT EXISTS sync_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      module VARCHAR(50) NOT NULL,
      startedAt DATETIME NOT NULL,
      finishedAt DATETIME NULL,
      status ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'ERROR', 'CANCELED') NOT NULL DEFAULT 'RUNNING',
      totalProcessed INT DEFAULT 0,
      totalErrors INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createLogsTable = `
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      historyId INT NOT NULL,
      level ENUM('INFO', 'WARN', 'ERROR') NOT NULL DEFAULT 'ERROR',
      entityName VARCHAR(100) NOT NULL,
      entityId VARCHAR(255) NULL,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (historyId) REFERENCES sync_history(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(createHistoryTable);
    console.log("✅ Tabela sync_history validada.");
    
    await pool.query(createLogsTable);
    console.log("✅ Tabela sync_logs validada.");
  } catch (error) {
    console.error("❌ Erro ao criar tabelas de logs da sincronização:", error.message);
  }
}
