import pool from "../../database/connection.js";

class AuvoTaskTypeRepository {
  async upsertTaskTypes(taskTypes) {
    if (!taskTypes || taskTypes.length === 0) return;

    const query = `
      INSERT INTO tasks_types_auvo (
        tasksTypesId, userCreatorId, standardQuestionnaireId, description,
        creationDate, standardTime, toleranceTime, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userCreatorId = VALUES(userCreatorId),
        standardQuestionnaireId = VALUES(standardQuestionnaireId),
        description = VALUES(description),
        creationDate = VALUES(creationDate),
        standardTime = VALUES(standardTime),
        toleranceTime = VALUES(toleranceTime),
        active = VALUES(active)
    `;

    for (const t of taskTypes) {
      const values = [
        parseInt(t.id, 10),
        t.creatorId ? parseInt(t.creatorId, 10) : null,
        t.standardQuestionnaireId && t.standardQuestionnaireId > 0 ? parseInt(t.standardQuestionnaireId, 10) : null,
        t.description ? String(t.description).substring(0, 255) : null,
        t.creationDate && t.creationDate !== "" ? t.creationDate : null,
        t.standardTime ? String(t.standardTime).substring(0, 50) : null,
        t.toleranceTime ? String(t.toleranceTime).substring(0, 50) : null,
        t.active === false ? 0 : 1
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar tipo de tarefa AUVO ${t.tasksTypesId}:`, error.sqlMessage || error.message);
      }
    }
  }

  async exists(tasksTypesId) {
    if (!tasksTypesId) return false;
    try {
      const [rows] = await pool.query("SELECT 1 FROM tasks_types_auvo WHERE tasksTypesId = ?", [tasksTypesId]);
      return rows.length > 0;
    } catch (err) {
      console.error(`Erro ao verificar existência do tipo de tarefa ${tasksTypesId}:`, err.message);
      return false;
    }
  }
}

export default new AuvoTaskTypeRepository();
