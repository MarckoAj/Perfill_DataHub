import pool from "../../database/connection.js";

class GlpiTicketRepository {
  async upsertTickets(tickets) {
    if (!tickets || tickets.length === 0) return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };

    let inserts = 0;
    let updates = 0;
    let errors = 0;
    let errorLogs = [];

    const query = `
      INSERT INTO tickets (
        ticketId, nomeCliente, titulo, descricao, dataCriacao, status,
        dataFechamento, dataSolucao, dataAtualizacao, categoriaSla, tempoSla,
        statusSla, motivoPausa, idTecnicoAtribuido, nomeTecnico, isAtrasado, tipo, projeto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nomeCliente = VALUES(nomeCliente),
        titulo = VALUES(titulo),
        descricao = VALUES(descricao),
        status = VALUES(status),
        dataFechamento = VALUES(dataFechamento),
        dataSolucao = VALUES(dataSolucao),
        dataAtualizacao = VALUES(dataAtualizacao),
        categoriaSla = VALUES(categoriaSla),
        tempoSla = VALUES(tempoSla),
        statusSla = VALUES(statusSla),
        motivoPausa = VALUES(motivoPausa),
        idTecnicoAtribuido = VALUES(idTecnicoAtribuido),
        nomeTecnico = VALUES(nomeTecnico),
        isAtrasado = VALUES(isAtrasado),
        tipo = VALUES(tipo),
        projeto = VALUES(projeto),
        updated_at = CURRENT_TIMESTAMP()
    `;

    for (const t of tickets) {
      const values = [
        parseInt(t.ticketId, 10) || null,
        t.nomeCliente ? String(t.nomeCliente).substring(0, 255) : null,
        t.titulo ? String(t.titulo).substring(0, 255) : null,
        t.descricao ? String(t.descricao) : null,
        t.dataCriacao || null,
        t.status ? String(t.status).substring(0, 50) : null,
        t.dataFechamento || null,
        t.dataSolucao || null,
        t.dataAtualizacao || null,
        t.categoriaSla ? String(t.categoriaSla).substring(0, 100) : null,
        t.tempoSla ? String(t.tempoSla).substring(0, 100) : null,
        t.statusSla ? String(t.statusSla).substring(0, 50) : null,
        t.motivoPausa ? String(t.motivoPausa).substring(0, 255) : null,
        t.idTecnicoAtribuido ? parseInt(t.idTecnicoAtribuido, 10) : null,
        t.nomeTecnico ? String(t.nomeTecnico).substring(0, 255) : null,
        t.isAtrasado ? 1 : 0,
        t.tipo ? String(t.tipo).substring(0, 100) : null,
        t.projeto ? String(t.projeto).substring(0, 100) : null
      ];

      try {
        const [result] = await pool.query(query, values);
        if (result.affectedRows === 1) {
            inserts++;
        } else if (result.affectedRows === 2) {
            updates++;
        } else {
            updates++;
        }
      } catch (error) {
        errors++;
        errorLogs.push({ entityName: 'tickets', entityId: t.ticketId || 0, message: error.sqlMessage || error.message });
      }
    }

    return { inserts, updates, skips: 0, errors, errorLogs };
  }

  async resetAtrasadoFlags() {
    const query = "UPDATE tickets SET isAtrasado = 0";
    try {
      await pool.query(query);
    } catch (error) {
      console.error("Erro ao resetar flags de atrasado:", error);
      throw error;
    }
  }

  async getAssignedTechnicianIds({ limit = null } = {}) {
    let query = `
      SELECT DISTINCT idTecnicoAtribuido
      FROM tickets
      WHERE idTecnicoAtribuido IS NOT NULL
      ORDER BY idTecnicoAtribuido ASC
    `;
    const params = [];

    if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
      query += " LIMIT ?";
      params.push(Number(limit));
    }

    const [rows] = await pool.query(query, params);
    return rows.map((row) => row.idTecnicoAtribuido).filter(Boolean);
  }

  async updateTechnicianName(technicianId, technicianName) {
    const query = `
      UPDATE tickets
      SET nomeTecnico = ?
      WHERE idTecnicoAtribuido = ?
    `;
    const [result] = await pool.query(query, [technicianName, technicianId]);
    return result;
  }

  async getAllTickets(startDate, endDate, statusGroup = "todos", limit = null, offset = 0) {
    let query = "SELECT * FROM tickets";
    const params = [];
    const conditions = [];

    if (startDate || endDate) {
      conditions.push("dataCriacao >= ? AND dataCriacao <= ?");
      params.push(startDate || "2000-01-01");
      params.push(endDate || "2099-12-31");
    }

    if (statusGroup === "aberto") {
      conditions.push("LOWER(status) NOT IN ('fechado')");
    } else if (statusGroup === "fechado") {
      conditions.push("LOWER(status) IN ('fechado')");
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY dataCriacao DESC";

    if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
      query += " LIMIT ? OFFSET ?";
      params.push(Number(limit), Number(offset) || 0);
    }

    try {
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar tickets do banco:", error);
      throw error;
    }
  }

  async getStats(startDate, endDate) {
    let query = `
      SELECT
        CAST(SUM(CASE WHEN LOWER(status) = 'novo' THEN 1 ELSE 0 END) AS UNSIGNED) as novos,
        CAST(SUM(CASE WHEN LOWER(status) = 'planejado' THEN 1 ELSE 0 END) AS UNSIGNED) as planejados,
        CAST(SUM(CASE WHEN LOWER(status) IN ('atribuido', 'atribuído') THEN 1 ELSE 0 END) AS UNSIGNED) as atribuidos,
        CAST(SUM(CASE WHEN LOWER(status) = 'solucionado' THEN 1 ELSE 0 END) AS UNSIGNED) as solucionados,
        CAST(SUM(CASE WHEN isAtrasado = 1 THEN 1 ELSE 0 END) AS UNSIGNED) as atrasados,
        CAST(SUM(CASE WHEN LOWER(status) = 'pendente' THEN 1 ELSE 0 END) AS UNSIGNED) as pendentes,
        CAST(SUM(CASE WHEN LOWER(status) = 'fechado' THEN 1 ELSE 0 END) AS UNSIGNED) as fechados
      FROM tickets
    `;

    const params = [];

    if (startDate || endDate) {
      query += " WHERE dataCriacao >= ? AND dataCriacao <= ?";
      params.push(startDate || "2000-01-01");
      params.push(endDate || "2099-12-31");
    }

    try {
      const [rows] = await pool.query(query, params);
      return rows[0] || {
        novos: 0,
        planejados: 0,
        atribuidos: 0,
        solucionados: 0,
        atrasados: 0,
        pendentes: 0,
        fechados: 0,
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas do banco:", error);
      throw error;
    }
  }
  /**
   * Retorna todos os tickets em estado ativo (não-terminal).
   * Critério espelhado do alertEngine.evaluateTicketRules → isTicketActive.
   */
  async getActiveTickets() {
    const query = `
      SELECT 
        t.*,
        tt.content AS ultimaTarefa
      FROM tickets t
      LEFT JOIN glpi_tickettasks tt ON tt.id = (
          SELECT tt2.id
          FROM glpi_tickettasks tt2
          WHERE tt2.tickets_id = t.ticketId
          ORDER BY tt2.date_mod DESC
          LIMIT 1
      )
      WHERE LOWER(t.status) NOT IN ('solucionado', 'fechado', 'aguardando aprovação')
      ORDER BY t.dataCriacao DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  async updateLastSyncDate(entityId) {
      try {
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await pool.query(`
              INSERT INTO glpi_sync_metadata (entity_id, last_sync) 
              VALUES (?, ?) 
              ON DUPLICATE KEY UPDATE last_sync = ?
          `, [entityId, now, now]);
          return true;
      } catch (e) { return false; }
  }

  async getGlobalGlpiStats() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS glpi_sync_metadata (entity_id VARCHAR(50) PRIMARY KEY, last_sync DATETIME NOT NULL)`);
    } catch(e) { }

    const statuses = [
      { id: 'novo', label: 'Tickets novos', color: '#10b981' },
      { id: 'planejado', label: 'Tickets planejados', color: '#0ea5e9' },
      { id: 'atribuido', label: 'Tickets atribuídos', color: '#8b5cf6' },
      { id: 'solucionado', label: 'Tickets solucionados', color: '#64748b' },
      { id: 'atrasado', label: 'Tickets atrasados', color: '#ef4444' },
      { id: 'pendente', label: 'Tickets pendentes', color: '#f59e0b' },
      { id: 'fechado', label: 'Tickets fechados', color: '#ffffff' },
      { id: 'tarefas', label: 'Tarefas de chamados', color: '#22c55e' },
      { id: 'solucoes', label: 'Solucoes de chamados', color: '#06b6d4' }
    ];

    const stats = [];
    for (const t of statuses) {
        let count = 0;
        let lastDate = null;
        try {
            if (t.id === 'atrasado') {
                const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM tickets WHERE isAtrasado = 1`);
                count = countRows[0].count;
            } else if (t.id === 'tarefas') {
                const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM glpi_tickettasks`);
                count = countRows[0].count;
            } else if (t.id === 'solucoes') {
                const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM glpi_itilsolutions`);
                count = countRows[0].count;
            } else {
                const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM tickets WHERE LOWER(status) = ?`, [t.id]);
                count = countRows[0].count;
            }
        } catch (e) { /* ignore */ }
        
        try {
            const [dateRows] = await pool.query(`SELECT last_sync FROM glpi_sync_metadata WHERE entity_id = ?`, [t.id]);
            if (dateRows && dateRows.length > 0) {
               lastDate = dateRows[0].last_sync;
            }
        } catch (e) { /* ignore */ }

        stats.push({ id: t.id, label: t.label, count, lastDate, color: t.color });
    }
    return stats;
  }
}

export default new GlpiTicketRepository();
