import BaseRepository from "../baseRepository.js";
import pool from "../../database/connection.js";

class AuvoTaskRepository extends BaseRepository {
  async upsertTasks(tasks) {
    const query = `
      INSERT INTO tasks_auvo (
        taskId, userFromId, userToId, taskPriorityId, customerId,
        taskStatusID, tasksTypesId, externalId, taskDate, taskCreationDate,
        orientation, deliveredOnSmarthPhone, deliveredDate, finished, report,
        visualized, visualizedDate, checkIn, checkInDate, checkOut, checkOutDate,
        checkinType, inputedKm, adoptedKm, signatureUrl, checkInDistance, 
        checkOutDistance, taskUrl, pendency, dateLastUpdate, displacementStart
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userFromId = VALUES(userFromId),
        userToId = VALUES(userToId),
        taskPriorityId = VALUES(taskPriorityId),
        customerId = VALUES(customerId),
        taskStatusID = VALUES(taskStatusID),
        tasksTypesId = VALUES(tasksTypesId),
        externalId = VALUES(externalId),
        taskDate = VALUES(taskDate),
        orientation = VALUES(orientation),
        deliveredOnSmarthPhone = VALUES(deliveredOnSmarthPhone),
        deliveredDate = VALUES(deliveredDate),
        finished = VALUES(finished),
        report = VALUES(report),
        visualized = VALUES(visualized),
        visualizedDate = VALUES(visualizedDate),
        checkIn = VALUES(checkIn),
        checkInDate = VALUES(checkInDate),
        checkOut = VALUES(checkOut),
        checkOutDate = VALUES(checkOutDate),
        checkinType = VALUES(checkinType),
        inputedKm = VALUES(inputedKm),
        adoptedKm = VALUES(adoptedKm),
        signatureUrl = VALUES(signatureUrl),
        checkInDistance = VALUES(checkInDistance),
        checkOutDistance = VALUES(checkOutDistance),
        taskUrl = VALUES(taskUrl),
        pendency = VALUES(pendency),
        dateLastUpdate = VALUES(dateLastUpdate),
        displacementStart = VALUES(displacementStart),
        isActive = 1,
        deletedAt = NULL
    `;

    await this.executeUpsertMany(
      tasks,
      query,
      t => [
        parseInt(t.taskID || t.id, 10) || null,
        parseInt(t.idUserFrom, 10) || 0,
        parseInt(t.idUserTo, 10) || 0,
        parseInt(t.priority, 10) || 1,
        parseInt(t.customerId, 10) || 0,
        parseInt(t.taskStatus, 10) || 1,
        parseInt(t.taskType, 10) || 0,
        parseInt(t.externalId, 10) || null,
        t.taskDate || null,
        t.creationDate || null,
        t.orientation ? String(t.orientation) : null,
        t.deliveredOnSmarthPhone ? String(t.deliveredOnSmarthPhone).substring(0, 45) : null,
        t.deliveredDate || null,
        t.finished ? 1 : 0,
        t.report ? String(t.report) : null,
        t.visualized ? 1 : 0,
        t.visualizedDate || null,
        t.checkIn ? 1 : 0,
        t.checkInDate || null,
        t.checkOut ? 1 : 0,
        t.checkOutDate || null,
        t.checkinType ? parseInt(t.checkinType, 10) : null,
        t.inputedKm ? parseFloat(t.inputedKm) : null,
        t.adoptedKm ? parseFloat(t.adoptedKm) : null,
        t.signatureUrl ? String(t.signatureUrl) : null,
        t.checkInDistance ? parseFloat(t.checkInDistance) : null,
        t.checkOutDistance ? parseFloat(t.checkOutDistance) : null,
        t.taskUrl ? String(t.taskUrl) : null,
        t.pendency ? String(t.pendency) : null,
        t.dateLastUpdate || null,
        t.displacementStart || null
      ],
      "tarefa AUVO"
    );
  }

  async saveRawData(tableName, items) {
    const query = `
      INSERT INTO ${tableName} (external_id, payload_json)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        payload_json = VALUES(payload_json),
        fetched_at = CURRENT_TIMESTAMP
    `;
    await this.executeUpsertMany(
      items,
      query,
      item => [parseInt(item.id, 10) || 0, JSON.stringify(item)],
      `Raw Data (${tableName})`
    );
  }

  async disableForeignKeyChecks() {
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
  }

  async enableForeignKeyChecks() {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
  }

  async updateLastSyncDate(entityId) {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS auvo_sync_metadata (
          entity_id VARCHAR(50) PRIMARY KEY,
          last_sync DATETIME NOT NULL
        )
      `;
      await pool.query(query);
      await pool.query(`INSERT INTO auvo_sync_metadata (entity_id, last_sync) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_sync = NOW()`, [entityId]);
    } catch (e) {
      console.error("Erro ao atualizar data de log da sincronizacao AUVO:", e.message);
    }
  }

  async markAsDeletedPhase(tableName, syncStartTime) {
    try {
      const formattedTime = syncStartTime.toISOString().slice(0, 19).replace('T', ' ');
      const query = `UPDATE ${tableName} SET isActive = 0, deletedAt = NOW() WHERE lastSyncAt < ? AND isActive = 1`;
      const [result] = await pool.query(query, [formattedTime]);
      if (result.affectedRows > 0) {
        console.log(`[SoftDelete] ${result.affectedRows} registros inativados na tabela ${tableName}.`);
      }
    } catch (e) {
      console.error(`Erro ao marcar registros como deletados na tabela ${tableName}:`, e.message);
    }
  }

  async getGlobalAuvoStats() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS auvo_sync_metadata (entity_id VARCHAR(50) PRIMARY KEY, last_sync DATETIME NOT NULL)`);
    } catch(e) { }

    const tables = [
      { id: 'users', table: 'users_auvo', label: 'Usuários', color: '#10b981' }, 
      { id: 'segments', table: 'segments_auvo', label: 'Segmentos', color: '#0ea5e9' },
      { id: 'groups', table: 'groups_auvo', label: 'Grupos', color: '#8b5cf6' }, 
      { id: 'customers', table: 'customers_auvo', label: 'Clientes', color: '#64748b' }, 
      { id: 'questionnaires', table: 'questionnaires_auvo', label: 'Questionários', color: '#ef4444' }, 
      { id: 'taskTypes', table: 'tasks_types_auvo', label: 'Tipos de Tarefa', color: '#f59e0b' }, 
      { id: 'tasks', table: 'tasks_auvo', label: 'Tarefas', color: '#ffffff' } 
    ];

    const stats = [];
    for (const t of tables) {
        let count = 0;
        let lastDate = null;
        try {
            const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM ${t.table}`);
            count = countRows[0].count;
        } catch (e) { /* ignore */ }
        
        try {
            const [dateRows] = await pool.query(`SELECT last_sync FROM auvo_sync_metadata WHERE entity_id = ?`, [t.id]);
            if (dateRows && dateRows.length > 0) {
               lastDate = dateRows[0].last_sync;
            }
        } catch (e) { /* ignore */ }

        stats.push({ id: t.id, label: t.label, count, lastDate, color: t.color });
    }
    return stats;
  }
}

export default new AuvoTaskRepository();
