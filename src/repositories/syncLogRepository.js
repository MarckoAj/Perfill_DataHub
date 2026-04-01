import pool from "../database/connection.js";

class SyncLogRepository {
  async createHistory(module) {
    const query = `INSERT INTO sync_history (module, startedAt, status) VALUES (?, NOW(), 'RUNNING')`;
    const [result] = await pool.query(query, [module]);
    return result.insertId;
  }

  async updateHistory(historyId, status, totalProcessed, totalErrors) {
    const query = `UPDATE sync_history SET finishedAt = NOW(), status = ?, totalProcessed = ?, totalErrors = ? WHERE id = ?`;
    await pool.query(query, [status, totalProcessed, totalErrors, historyId]);
  }

  async insertLogs(historyId, errorLogs) {
    if (!errorLogs || errorLogs.length === 0) return;
    const query = `INSERT INTO sync_logs (historyId, level, entityName, entityId, message) VALUES ?`;
    const values = errorLogs.map(log => [
      historyId, 
      'ERROR', 
      log.entityName ? String(log.entityName).substring(0, 100) : 'Desconhecida', 
      log.entityId ? String(log.entityId).substring(0, 255) : 'Desconhecido', 
      log.message
    ]);
    await pool.query(query, [values]);
  }

  async getHistoryLogs(historyId) {
    const [rows] = await pool.query(`SELECT * FROM sync_logs WHERE historyId = ? ORDER BY createdAt DESC`, [historyId]);
    return rows;
  }
}

export default new SyncLogRepository();
