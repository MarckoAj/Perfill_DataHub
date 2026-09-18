import pool from '../../database/connection.js';

// A ticket is included only through an active, exact device link. No location/name fallback.
const entityRelation = `EXISTS (
  SELECT 1 FROM glpi_point_history_items i
  JOIN hub_entity_links l ON CAST(l.sourceNativeId AS UNSIGNED) = i.itemId AND l.sourceNativeId REGEXP '^[0-9]+$'
    AND l.sourceSystem = 'GLPI' AND l.sourceEntity = 'device' AND l.isActive = 1
  WHERE i.ticketId = t.ticketId AND i.itemType = 'Peripheral' AND l.entityId = ?
)`;

export class GlpiPointHistoryRepository {
  async scope(entityId, pilot) {
    const [entities] = await pool.query('SELECT entityId FROM hub_entities WHERE entityId = ?', [entityId]);
    if (!entities.length) return null;
    const [links] = await pool.query(`SELECT sourceNativeId FROM hub_entity_links
      WHERE entityId = ? AND sourceSystem = 'GLPI' AND sourceEntity = 'device' AND isActive = 1`, [entityId]);
    const isPilot = entityId === pilot.entityId && links.some(link => Number(link.sourceNativeId) === pilot.deviceId);
    const [shared] = await pool.query(`SELECT t.ticketId FROM glpi_point_history_tickets t
      WHERE t.ownerDeviceId = ? AND ${entityRelation} LIMIT 1`, [pilot.deviceId, entityId]);
    return { enabled: isPilot || shared.length > 0, isPilot, deviceIds: links.map(link => Number(link.sourceNativeId)) };
  }

  async syncState(deviceId) {
    const [rows] = await pool.query('SELECT lastSyncedAt, lastAttemptAt, lastError FROM glpi_point_history_sync WHERE deviceId = ?', [deviceId]);
    return rows[0] || { lastSyncedAt: null, lastAttemptAt: null, lastError: null };
  }

  async recordAttempt(deviceId) {
    await pool.query(`INSERT INTO glpi_point_history_sync (deviceId, lastAttemptAt) VALUES (?, NOW())
      ON DUPLICATE KEY UPDATE lastAttemptAt = NOW()`, [deviceId]);
  }

  async recordFailure(deviceId) {
    await pool.query(`UPDATE glpi_point_history_sync
      SET lastError = 'Nao foi possivel atualizar o historico GLPI. Os dados anteriores foram preservados.'
      WHERE deviceId = ?`, [deviceId]);
  }

  async replaceSnapshot(deviceId, tickets) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Replace only this pilot's cache, atomically; the operational tickets table is untouched.
      await connection.query(`DELETE i FROM glpi_point_history_items i
        JOIN glpi_point_history_tickets t ON t.ticketId = i.ticketId WHERE t.ownerDeviceId = ?`, [deviceId]);
      await connection.query('DELETE FROM glpi_point_history_tickets WHERE ownerDeviceId = ?', [deviceId]);
      for (const ticket of tickets) {
        await connection.query(`INSERT INTO glpi_point_history_tickets
          (ticketId, ownerDeviceId, title, description, status, category, dateUpdated, interactions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [ticket.id, deviceId, ticket.title, ticket.description,
          ticket.status, ticket.category, ticket.dateUpdated, JSON.stringify(ticket.interactions)]);
        for (const item of ticket.items) {
          await connection.query(`INSERT INTO glpi_point_history_items (ticketId, itemType, itemId, name)
            VALUES (?, ?, ?, ?)`, [ticket.id, item.itemType, item.itemId, item.name]);
        }
      }
      await connection.query(`INSERT INTO glpi_point_history_sync (deviceId, lastSyncedAt, lastAttemptAt, lastError)
        VALUES (?, NOW(), NOW(), NULL) ON DUPLICATE KEY UPDATE lastSyncedAt = NOW(), lastError = NULL`, [deviceId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async associatedItems(ticketIds) {
    if (!ticketIds.length) return [];
    const [rows] = await pool.query(`SELECT i.ticketId, i.itemType, i.itemId, i.name,
      l.entityId AS hubId, e.canonicalName AS hubName
      FROM glpi_point_history_items i
      LEFT JOIN hub_entity_links l ON i.itemType = 'Peripheral'
        AND CAST(l.sourceNativeId AS UNSIGNED) = i.itemId AND l.sourceNativeId REGEXP '^[0-9]+$' AND l.sourceSystem = 'GLPI'
        AND l.sourceEntity = 'device' AND l.isActive = 1
      LEFT JOIN hub_entities e ON e.entityId = l.entityId
      WHERE i.ticketId IN (?) ORDER BY i.itemType, i.itemId, l.entityId`, [ticketIds]);
    return rows;
  }

  async list(entityId, ownerDeviceId, limit, offset) {
    const where = `t.ownerDeviceId = ? AND ${entityRelation}`;
    const [counts] = await pool.query(`SELECT COUNT(*) AS total FROM glpi_point_history_tickets t WHERE ${where}`, [ownerDeviceId, entityId]);
    const [rows] = await pool.query(`SELECT t.ticketId AS id, t.title, t.status, t.category, t.dateUpdated
      FROM glpi_point_history_tickets t WHERE ${where}
      ORDER BY t.dateUpdated DESC, t.ticketId DESC LIMIT ? OFFSET ?`, [ownerDeviceId, entityId, limit, offset]);
    const items = await this.associatedItems(rows.map(row => row.id));
    return { items: rows.map(row => ({ ...row, devices: items.filter(item => Number(item.ticketId) === Number(row.id)) })),
      pagination: { limit, offset, total: Number(counts[0].total), hasMore: offset + rows.length < Number(counts[0].total) } };
  }

  async detail(entityId, ticketId, ownerDeviceId) {
    const [rows] = await pool.query(`SELECT t.ticketId AS id, t.title, t.description, t.status, t.category,
      t.dateUpdated, t.interactions FROM glpi_point_history_tickets t
      WHERE t.ticketId = ? AND t.ownerDeviceId = ? AND ${entityRelation}`, [ticketId, ownerDeviceId, entityId]);
    if (!rows.length) return null;
    const ticket = rows[0];
    return { ...ticket, interactions: typeof ticket.interactions === 'string' ? JSON.parse(ticket.interactions) : ticket.interactions,
      devices: await this.associatedItems([ticketId]) };
  }
}

export default new GlpiPointHistoryRepository();
