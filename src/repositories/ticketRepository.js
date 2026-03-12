import pool from "../database/connection.js";

class TicketRepository {
  async upsertTickets(tickets) {
    if (!tickets || tickets.length === 0) return;

    const query = `
      INSERT INTO tickets (
        ticketId, nomeCliente, titulo, descricao, dataCriacao, status, 
        dataFechamento, dataAtualizacao, categoriaSla, tempoSla, 
        statusSla, motivoPausa, idTecnicoAtribuido, nomeTecnico, isAtrasado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        nomeCliente = VALUES(nomeCliente),
        titulo = VALUES(titulo),
        descricao = VALUES(descricao),
        status = VALUES(status),
        dataFechamento = VALUES(dataFechamento),
        dataAtualizacao = VALUES(dataAtualizacao),
        categoriaSla = VALUES(categoriaSla),
        tempoSla = VALUES(tempoSla),
        statusSla = VALUES(statusSla),
        motivoPausa = VALUES(motivoPausa),
        idTecnicoAtribuido = VALUES(idTecnicoAtribuido),
        nomeTecnico = VALUES(nomeTecnico),
        isAtrasado = VALUES(isAtrasado)
    `;

    for (const t of tickets) {
      const values = [
        parseInt(t.ticketId) || null,
        t.nomeCliente ? String(t.nomeCliente).substring(0, 255) : null,
        t.titulo ? String(t.titulo).substring(0, 255) : null,
        t.descricao ? String(t.descricao) : null,
        t.dataCriacao || null,
        t.status ? String(t.status).substring(0, 50) : null,
        t.dataFechamento || null,
        t.dataAtualizacao || null,
        t.categoriaSla ? String(t.categoriaSla).substring(0, 100) : null,
        t.tempoSla ? String(t.tempoSla).substring(0, 100) : null,
        t.statusSla ? String(t.statusSla).substring(0, 50) : null,
        t.motivoPausa ? String(t.motivoPausa).substring(0, 255) : null,
        t.idTecnicoAtribuido ? parseInt(t.idTecnicoAtribuido) : null,
        t.nomeTecnico ? String(t.nomeTecnico).substring(0, 255) : null,
        t.isAtrasado ? 1 : 0,
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar ticket ${t.ticketId} (valores: ${values.length}):`, error.sqlMessage);
      }
    }
  }

  async getAllTickets(startDate, endDate) {
    let query = "SELECT * FROM tickets";
    const params = [];

    if (startDate || endDate) {
      query += " WHERE dataCriacao >= ? AND dataCriacao <= ?";
      params.push(startDate || '2000-01-01');
      params.push(endDate || '2099-12-31');
    }

    query += " ORDER BY dataCriacao DESC";

    try {
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar tickets do banco:", error);
      throw error;
    }
  }
}

export default new TicketRepository();
