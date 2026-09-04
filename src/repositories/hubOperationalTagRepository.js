import pool from "../database/connection.js";

class HubOperationalTagRepository {
  async listTags({ activeOnly = true } = {}) {
    const [rows] = await pool.query(
      `
        SELECT
          tagId, label, normalizedLabel, description, color,
          hideByDefault, displayOrder, isActive, createdAt, updatedAt
        FROM hub_operational_tags
        ${activeOnly ? "WHERE isActive = 1" : ""}
        ORDER BY displayOrder ASC, label ASC
      `
    );

    const tags = rows.map(row => ({
      tagId: row.tagId,
      label: row.label,
      normalizedLabel: row.normalizedLabel,
      description: row.description,
      color: row.color,
      hideByDefault: Boolean(row.hideByDefault),
      displayOrder: Number(row.displayOrder) || 0,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    if (tags.length === 0) return tags;

    const [aliasRows] = await pool.query(
      `
        SELECT aliasId, tagId, alias, normalizedAlias, matchType, removeFromName, isActive
        FROM hub_operational_tag_aliases
        WHERE tagId IN (?)
          ${activeOnly ? "AND isActive = 1" : ""}
        ORDER BY alias ASC
      `,
      [tags.map(tag => tag.tagId)]
    );

    const aliasesByTag = new Map();
    for (const row of aliasRows) {
      const aliases = aliasesByTag.get(row.tagId) || [];
      aliases.push({
        aliasId: row.aliasId,
        alias: row.alias,
        normalizedAlias: row.normalizedAlias,
        matchType: row.matchType,
        removeFromName: Boolean(row.removeFromName),
        isActive: Boolean(row.isActive)
      });
      aliasesByTag.set(row.tagId, aliases);
    }

    return tags.map(tag => ({
      ...tag,
      aliases: aliasesByTag.get(tag.tagId) || []
    }));
  }

  async upsertTag({
    label,
    normalizedLabel,
    description = null,
    color = null,
    hideByDefault = false,
    displayOrder = 0,
    createdBy = "system"
  }) {
    await pool.query(
      `
        INSERT INTO hub_operational_tags (
          label, normalizedLabel, description, color, hideByDefault, displayOrder, isActive, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          label = VALUES(label),
          description = VALUES(description),
          color = VALUES(color),
          hideByDefault = VALUES(hideByDefault),
          displayOrder = VALUES(displayOrder),
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
      `,
      [label, normalizedLabel, description, color, hideByDefault ? 1 : 0, displayOrder || 0, createdBy]
    );

    const [rows] = await pool.query(
      `
        SELECT
          tagId, label, normalizedLabel, description, color,
          hideByDefault, displayOrder, isActive, createdAt, updatedAt
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
      color: row.color,
      hideByDefault: Boolean(row.hideByDefault),
      displayOrder: Number(row.displayOrder) || 0,
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

  async updateTag({
    tagId,
    label,
    normalizedLabel,
    description = null,
    color = null,
    hideByDefault = false,
    displayOrder = 0
  }) {
    await pool.query(
      `
        UPDATE hub_operational_tags
        SET
          label = ?,
          normalizedLabel = ?,
          description = ?,
          color = ?,
          hideByDefault = ?,
          displayOrder = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE tagId = ?
      `,
      [label, normalizedLabel, description, color, hideByDefault ? 1 : 0, displayOrder || 0, tagId]
    );

    return this.getTag(tagId);
  }

  formatTag(row) {
    if (!row) return null;
    return {
      tagId: row.tagId,
      label: row.label,
      normalizedLabel: row.normalizedLabel,
      description: row.description,
      color: row.color,
      hideByDefault: Boolean(row.hideByDefault),
      displayOrder: Number(row.displayOrder) || 0,
      isActive: Boolean(row.isActive),
      source: row.source || "manual",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async getTag(tagId) {
    const [rows] = await pool.query(
      `
        SELECT
          tagId, label, normalizedLabel, description, color,
          hideByDefault, displayOrder, isActive, createdAt, updatedAt
        FROM hub_operational_tags
        WHERE tagId = ? AND isActive = 1
        LIMIT 1
      `,
      [tagId]
    );

    return this.formatTag(rows[0]);
  }

  async upsertTagAlias({
    tagId,
    alias,
    normalizedAlias,
    matchType = "prefix",
    removeFromName = true,
    createdBy = "admin_panel"
  }) {
    await pool.query(
      `
        INSERT INTO hub_operational_tag_aliases (
          tagId, alias, normalizedAlias, matchType, removeFromName, isActive, createdBy
        ) VALUES (?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          alias = VALUES(alias),
          removeFromName = VALUES(removeFromName),
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
      `,
      [tagId, alias, normalizedAlias, matchType, removeFromName ? 1 : 0, createdBy]
    );
  }

  async deactivateTagAlias(aliasId) {
    const [rows] = await pool.query(
      `
        SELECT aliasId, tagId, alias, normalizedAlias
        FROM hub_operational_tag_aliases
        WHERE aliasId = ?
        LIMIT 1
      `,
      [aliasId]
    );
    const alias = rows[0];
    if (!alias) return null;

    await pool.query(
      `
        UPDATE hub_operational_tag_aliases
        SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
        WHERE aliasId = ?
      `,
      [aliasId]
    );

    return alias;
  }

  async listEntityTags(entityId) {
    const [rows] = await pool.query(
      `
        SELECT
          tag.tagId, tag.label, tag.normalizedLabel, tag.description,
          tag.isActive, entityTag.source, entityTag.createdAt, entityTag.updatedAt
        FROM hub_entity_operational_tags entityTag
        JOIN hub_operational_tags tag ON tag.tagId = entityTag.tagId
        WHERE entityTag.entityId = ?
          AND entityTag.isActive = 1
          AND tag.isActive = 1
        ORDER BY tag.label ASC
      `,
      [entityId]
    );

    return rows.map(row => this.formatTag(row));
  }

  async listEntityTagsMap(entityIds = []) {
    const safeIds = [...new Set(
      entityIds
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0)
    )];

    if (safeIds.length === 0) return new Map();

    const [rows] = await pool.query(
      `
        SELECT
          entityTag.entityId, tag.tagId, tag.label, tag.normalizedLabel, tag.description,
          tag.isActive, entityTag.source, entityTag.createdAt, entityTag.updatedAt
        FROM hub_entity_operational_tags entityTag
        JOIN hub_operational_tags tag ON tag.tagId = entityTag.tagId
        WHERE entityTag.entityId IN (?)
          AND entityTag.isActive = 1
          AND tag.isActive = 1
        ORDER BY tag.label ASC
      `,
      [safeIds]
    );

    const tagsByEntity = new Map();
    for (const row of rows) {
      const tags = tagsByEntity.get(row.entityId) || [];
      tags.push(this.formatTag(row));
      tagsByEntity.set(row.entityId, tags);
    }

    return tagsByEntity;
  }

  async assignEntityTag({ entityId, tagId, createdBy = "admin_panel" }) {
    const tag = await this.getTag(tagId);
    if (!tag) return null;

    await pool.query(
      `
        INSERT INTO hub_entity_operational_tags (entityId, tagId, source, isActive, createdBy)
        VALUES (?, ?, 'manual', 1, ?)
        ON DUPLICATE KEY UPDATE
          source = 'manual',
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
      `,
      [entityId, tagId, createdBy]
    );

    return tag;
  }

  async unassignEntityTag({ entityId, tagId }) {
    const tag = await this.getTag(tagId);
    if (!tag) return null;

    await pool.query(
      `
        UPDATE hub_entity_operational_tags
        SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
        WHERE entityId = ? AND tagId = ?
      `,
      [entityId, tagId]
    );

    return tag;
  }

  async insertTagHistory({ entityId, action, label, comment = "", createdBy = "admin_panel" }) {
    if (!entityId || !action || !label) return;

    const actionLabels = {
      add_operational_tag: "adicionada ao catalogo",
      remove_operational_tag: "removida do catalogo",
      assign_operational_tag: "vinculada ao ponto",
      unassign_operational_tag: "desvinculada do ponto"
    };
    const actionText = actionLabels[action] || action;

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
          : `Tag operacional ${label} ${actionText}.`,
        createdBy
      ]
    );
  }
}

export default new HubOperationalTagRepository();
