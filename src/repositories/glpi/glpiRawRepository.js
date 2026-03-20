import pool from "../../database/connection.js";

class GlpiRawRepository {
  async insertRawTickets(rawTickets) {
    if (!rawTickets || rawTickets.length === 0) return;

    const query = `
      INSERT INTO raw_glpi_tickets (external_id, payload_json)
      VALUES (?, ?)
    `;

    for (const t of rawTickets) {
      const extId = parseInt(t["2"] || t["1"], 10);
      if (isNaN(extId)) continue;

      try {
        await pool.query(query, [extId, JSON.stringify(t)]);
      } catch (error) {
        console.error(`Erro ao salvar ticket RAW ${extId}:`, error.sqlMessage || error.message);
      }
    }
  }
}

export default new GlpiRawRepository();
