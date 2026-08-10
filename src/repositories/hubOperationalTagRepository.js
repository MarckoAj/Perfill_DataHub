import pool from "../database/connection.js";

class HubOperationalTagRepository {
  async listTags({ activeOnly = true } = {}) {
    const [rows] = await pool.query(
      `
        SELECT tagId, label, normalizedLabel, description, isActive, createdAt, updatedAt
        FROM hub_operational_tags
        ${activeOnly ? "WHERE isActive = 1" : ""}
        ORDER BY label ASC
      `
    );

    return rows.map(row => ({
      tagId: row.tagId,
      label: row.label,
      normalizedLabel: row.normalizedLabel,
      description: row.description,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async upsertTag({ label, normalizedLabel, description = null, createdBy = "system" }) {
    await pool.query(
      `
        INSERT INTO hub_operational_tags (label, normalizedLabel, description, isActive, createdBy)
        VALUES (?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          label = VALUES(label),
          description = VALUES(description),
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
      `,
      [label, normalizedLabel, description, createdBy]
    );

    const [rows] = await pool.query(
      `
        SELECT tagId, label, normalizedLabel, description, isActive, createdAt, updatedAt
        FROM hub_operational_tags
        WHERE normalizedLabel = ?
        LIMIT 1
      `,
      [normalizedLabel]
    );

    const row = rows[0];
    return row ? {
      tagId: row.tagId,
      label: row.label,
      normalizedLabel: row.normalizedLabel,
      description: row.description,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    } : null;
  }

  async deactivateTag(tagId) {
    const [rows] = await pool.query(
      `
        SELECT tagId, label, normalizedLabel
        FROM hub_operational_tags
        WHERE tagId = ?
        LIMIT 1
      `,
      [tagId]
    );
    const tag = rows[0];
    if (!tag) return null;

    await pool.query(
      `
        UPDATE hub_operational_tags
        SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
        WHERE tagId = ?
      `,
      [tagId]
    );

    return {
      tagId: tag.tagId,
      label: tag.label,
      normalizedLabel: tag.normalizedLabel
    };
  }

  async insertTagHistory({ entityId, action, label, comment = "", createdBy = "admin_panel" }) {
    if (!entityId || !action || !label) return;

    await pool.query(
      `
        INSERT INTO hub_entity_history (
          entityId, fieldKey, action, sourceSystem, targetSystem,
          oldValue, newValue, message, createdBy
        ) VALUES (?, 'operationalTags', ?, 'HUB', 'HUB', NULL, ?, ?, ?)
      `,
      [
        entityId,
        action,
        label,
        comment
          ? `Tag operacional ${label}: ${comment}`
          : `Tag operacional ${label} ${action === "add_operational_tag" ? "adicionada" : "removida"}.`,
        createdBy
      ]
    );
  }
}

export default new HubOperationalTagRepository();
