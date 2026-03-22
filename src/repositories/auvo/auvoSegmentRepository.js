import BaseRepository from "../baseRepository.js";

class AuvoSegmentRepository extends BaseRepository {
  async upsertSegments(segments) {
    const query = `INSERT INTO segments_auvo (segmentId, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), isActive = 1, deletedAt = NULL`;
    await this.executeUpsertMany(
      segments, 
      query, 
      s => [parseInt(s.id, 10), s.description], 
      "segmento AUVO"
    );
  }
}

export default new AuvoSegmentRepository();
