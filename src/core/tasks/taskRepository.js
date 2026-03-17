import pool from "../../database/connection.js";

class TaskRepository {
  // ---- Usuários (Users) ----

  async upsertUsers(users) {
    if (!users || users.length === 0) return;

    const query = `
      INSERT INTO users_auvo (
        userId, externalId, name, login, email, jobPosition,
        userType, address, active, registrationDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        externalId = VALUES(externalId),
        name = VALUES(name),
        login = VALUES(login),
        email = VALUES(email),
        jobPosition = VALUES(jobPosition),
        userType = VALUES(userType),
        address = VALUES(address),
        active = VALUES(active),
        registrationDate = VALUES(registrationDate)
    `;

    for (const u of users) {
      const values = [
        parseInt(u.userID, 10) || null,
        u.externalId ? String(u.externalId).substring(0, 200) : null,
        u.name ? String(u.name).substring(0, 100) : null,
        u.login ? String(u.login).substring(0, 100) : null,
        u.email ? String(u.email).substring(0, 100) : null,
        u.jobPosition ? String(u.jobPosition).substring(0, 100) : null,
        parseInt(u.userType?.userTypeId, 10) || 1, // 1: Placeholder / Padrão (inserido nos Seeds)
        u.address ? String(u.address).substring(0, 255) : null,
        u.active ? 1 : 0,
        u.registrationDate && u.registrationDate !== "" ? u.registrationDate : null
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar usuário AUVO ${u.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  // ---- Clientes (Customers) ----

  async upsertCustomers(customers) {
    if (!customers || customers.length === 0) return;

    const query = `
      INSERT INTO customers_auvo (
        customerId, externalId, description, cpfCnpj, note, address,
        addressComplement, latitude, longitude, active, segmentId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        externalId = VALUES(externalId),
        description = VALUES(description),
        cpfCnpj = VALUES(cpfCnpj),
        note = VALUES(note),
        address = VALUES(address),
        addressComplement = VALUES(addressComplement),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        active = VALUES(active),
        segmentId = VALUES(segmentId)
    `;

    for (const c of customers) {
      const values = [
        parseInt(c.id, 10) || null,
        c.externalId ? String(c.externalId).substring(0, 100) : null,
        c.description ? String(c.description) : null,
        c.cpfCnpj ? String(c.cpfCnpj).substring(0, 50) : null,
        c.note ? String(c.note) : null,
        c.address ? String(c.address) : null,
        c.addressComplement ? String(c.addressComplement) : null,
        c.latitude ? String(c.latitude).substring(0, 30) : null,
        c.longitude ? String(c.longitude).substring(0, 30) : null,
        c.active ? 1 : 0,
        parseInt(c.segmentId, 10) || 0 // 0 é o placeholder padrão
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar cliente AUVO ${c.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  // ---- Segmentos (Segments) ----
  async upsertSegments(segments) {
    if (!segments || segments.length === 0) return;
    const query = `INSERT INTO segments_auvo (segmentId, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)`;
    for (const s of segments) {
      try {
        await pool.query(query, [parseInt(s.id, 10), s.description]);
      } catch (e) {
        console.error(`Erro ao salvar segmento AUVO ${s.id}:`, e.message);
      }
    }
  }

  // ---- Grupos (Groups) ----
  async upsertGroups(groups) {
    if (!groups || groups.length === 0) return;
    const query = `INSERT INTO groups_auvo (groupId, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)`;
    for (const g of groups) {
      try {
        await pool.query(query, [parseInt(g.id, 10), g.description]);
      } catch (e) {
        console.error(`Erro ao salvar grupo AUVO ${g.id}:`, e.message);
      }
    }
  }

  // ---- Tarefas (Tasks) ----

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
        parseInt(t.id, 10) || null,
        parseInt(t.idUserFrom, 10) || 0,
        parseInt(t.idUserTo, 10) || 0,
        parseInt(t.priority, 10) || 1, // 1: Baixa
        parseInt(t.customerId, 10) || 0,
        parseInt(t.taskStatus, 10) || 1, // 1: Aberta
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

  // ---- Raw Data (Dados Brutos) ----
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

  // ---- Validações rápidas de dependência (Previne quebra de FK) ----

  async checkEntityExists(tableName, idColumn, idValue) {
    const query = `SELECT 1 FROM ${tableName} WHERE ${idColumn} = ? LIMIT 1`;
    const [rows] = await pool.query(query, [idValue]);
    return rows.length > 0;
  }
}

export default new TaskRepository();
