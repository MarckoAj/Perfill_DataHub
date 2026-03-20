import pool from "../../database/connection.js";

class AuvoTaskRepository {
  async upsertTasks(tasks) {
    if (!tasks || tasks.length === 0) return;

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
        displacementStart = VALUES(displacementStart)
    `;

    for (const t of tasks) {
      const values = [
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
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar tarefa AUVO ${t.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  async saveRawData(tableName, items) {
    if (!items || items.length === 0) return;

    const query = `
      INSERT INTO ${tableName} (external_id, payload_json)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        payload_json = VALUES(payload_json),
        fetched_at = CURRENT_TIMESTAMP
    `;

    for (const item of items) {
      try {
        const id = parseInt(item.id, 10) || 0;
        await pool.query(query, [id, JSON.stringify(item)]);
      } catch (error) {
        console.error(`Erro ao salvar Raw Data em ${tableName} [ID ${item.id}]:`, error.message);
      }
    }
  }

  async disableForeignKeyChecks() {
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
  }

  async enableForeignKeyChecks() {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
  }
}

export default new AuvoTaskRepository();
