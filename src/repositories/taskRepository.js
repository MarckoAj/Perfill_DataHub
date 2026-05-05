import pool from "../database/connection.js";

class TaskRepository {
  async getTasksByExternalId(externalId) {
    const query = `
      SELECT 
        t.taskId,
        t.externalId,
        t.orientation AS title,
        u.name AS assignedTo,
        t.taskDate AS scheduledDate,
        t.taskCreationDate AS createdAt,
        CASE 
          WHEN t.taskStatusID = 5 THEN 'FINALIZADA'
          WHEN t.taskStatusID IN (2, 3) THEN 'EM_ANDAMENTO'
          ELSE 'PENDENTE'
        END AS status
      FROM tasks_auvo t
      LEFT JOIN users_auvo u ON t.userToId = u.userId
      WHERE t.externalId = ?
      ORDER BY t.taskDate DESC
    `;
    
    const [rows] = await pool.query(query, [externalId]);
    return rows;
  }
}

export default new TaskRepository();
