import pool from "../../database/connection.js";

class GlpiTicketTaskRepository {
  async upsertBatch(tasks) {
    if (!tasks || tasks.length === 0) {
      return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    }

    let inserts = 0;
    let updates = 0;
    let errors = 0;
    let errorLogs = [];

    const query = `
      INSERT INTO glpi_tickettasks (
        id, tickets_id, users_id, nomeAutor, date_creation, date_mod, begin, end, content
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        users_id = VALUES(users_id),
        nomeAutor = VALUES(nomeAutor),
        date_creation = VALUES(date_creation),
        date_mod = VALUES(date_mod),
        begin = VALUES(begin),
        end = VALUES(end),
        content = VALUES(content),
        updated_at = CURRENT_TIMESTAMP()
    `;

    // Processar num único batch inserindo de 500 em 500 para evitar payload grande demais
    const batchSize = 500;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const chunk = tasks.slice(i, i + batchSize);
      
      const values = chunk.map(t => [
        parseInt(t.id, 10) || null,
        parseInt(t.tickets_id, 10) || null,
        t.users_id ? parseInt(t.users_id, 10) : null,
        t.nomeAutor ? String(t.nomeAutor).substring(0, 255) : null,
        t.date_creation || null,
        t.date_mod || null,
        t.begin || null,
        t.end || null,
        t.content ? String(t.content) : null
      ]);

      try {
        const [result] = await pool.query(query, [values]);
        // result.affectedRows > chunk.length sinaliza updates mesclados, estimamos inserts
        const rowCount = chunk.length;
        if (result.affectedRows === rowCount) inserts += rowCount;
        else updates += rowCount; // Aproximação clássica do on-duplicate
      } catch (error) {
        errors += chunk.length;
        errorLogs.push({ entityName: 'glpi_tickettasks', entityId: chunk[0]?.id || 0, message: error.sqlMessage || error.message });
      }
    }

    return { inserts, updates, skips: 0, errors, errorLogs };
  }
}

export default new GlpiTicketTaskRepository();
