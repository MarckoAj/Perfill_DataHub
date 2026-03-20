import pool from "../../database/connection.js";

class AuvoGroupRepository {
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
}

export default new AuvoGroupRepository();
