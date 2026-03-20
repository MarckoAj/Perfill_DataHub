import pool from "../../database/connection.js";

class AuvoSegmentRepository {
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
}

export default new AuvoSegmentRepository();
