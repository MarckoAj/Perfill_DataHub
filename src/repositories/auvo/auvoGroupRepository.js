import BaseRepository from "../baseRepository.js";

class AuvoGroupRepository extends BaseRepository {
  async upsertGroups(groups) {
    const query = `INSERT INTO groups_auvo (groupId, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), isActive = 1, deletedAt = NULL`;
    await this.executeUpsertMany(
      groups, 
      query, 
      g => [parseInt(g.id, 10), g.description], 
      "grupo AUVO"
    );
  }
}

export default new AuvoGroupRepository();
