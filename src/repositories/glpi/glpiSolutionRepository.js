import pool from "../../database/connection.js";

class GlpiSolutionRepository {
  async upsertBatch(solutions) {
    if (!solutions || solutions.length === 0) {
      return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    }

    let inserts = 0;
    let updates = 0;
    let errors = 0;
    const errorLogs = [];

    const query = `
      INSERT INTO glpi_itilsolutions (
        id,
        tickets_id,
        solutiontypes_id,
        solutiontype_name,
        content,
        date_creation,
        date_mod,
        date_approval,
        users_id,
        user_name,
        status
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        tickets_id = VALUES(tickets_id),
        solutiontypes_id = VALUES(solutiontypes_id),
        solutiontype_name = VALUES(solutiontype_name),
        content = VALUES(content),
        date_creation = VALUES(date_creation),
        date_mod = VALUES(date_mod),
        date_approval = VALUES(date_approval),
        users_id = VALUES(users_id),
        user_name = VALUES(user_name),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP()
    `;

    const batchSize = 500;
    for (let i = 0; i < solutions.length; i += batchSize) {
      const chunk = solutions.slice(i, i + batchSize);
      const values = chunk.map((solution) => [
        parseInt(solution.id, 10) || null,
        parseInt(solution.tickets_id, 10) || null,
        solution.solutiontypes_id ? String(solution.solutiontypes_id).substring(0, 255) : null,
        solution.solutiontype_name ? String(solution.solutiontype_name).substring(0, 255) : null,
        solution.content ? String(solution.content) : null,
        solution.date_creation || null,
        solution.date_mod || null,
        solution.date_approval || null,
        solution.users_id ? String(solution.users_id).substring(0, 255) : null,
        solution.user_name ? String(solution.user_name).substring(0, 255) : null,
        solution.status !== null && solution.status !== undefined ? Number(solution.status) : null,
      ]);

      try {
        const [result] = await pool.query(query, [values]);
        if (result.affectedRows === chunk.length) {
          inserts += chunk.length;
        } else {
          updates += chunk.length;
        }
      } catch (error) {
        errors += chunk.length;
        errorLogs.push({
          entityName: "glpi_itilsolutions",
          entityId: chunk[0]?.id || 0,
          message: error.sqlMessage || error.message,
        });
      }
    }

    return { inserts, updates, skips: 0, errors, errorLogs };
  }

  async getClosedTicketIds({ limit = null } = {}) {
    let query = `
      SELECT ticketId
      FROM tickets
      WHERE LOWER(status) IN ('solucionado', 'fechado')
      ORDER BY COALESCE(dataSolucao, dataFechamento, dataAtualizacao, dataCriacao) DESC
    `;
    const params = [];

    if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
      query += " LIMIT ?";
      params.push(Number(limit));
    }

    const [rows] = await pool.query(query, params);
    return rows.map((row) => row.ticketId).filter(Boolean);
  }
}

export default new GlpiSolutionRepository();
