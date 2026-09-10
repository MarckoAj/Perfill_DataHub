import pool from "../database/connection.js";

class HubMatchingRepository {
  async listHubAuvoEntities({ search = "", entityId = null } = {}) {
    const params = [];
    const conditions = [
      "src.sourceSystem = 'AUVO'",
      "src.sourceEntity = 'customer'",
      "e.isActive = 1",
      "COALESCE(e.status, 'active') <> 'inactive'",
      "COALESCE(c.active, 1) = 1"
    ];

    if (entityId !== null) {
      conditions.push("e.entityId = ?");
      params.push(entityId);
    }
    if (search) {
      conditions.push(`(
        e.displayName LIKE ?
        OR e.canonicalName LIKE ?
        OR src.sourceNativeId LIKE ?
        OR src.sourceName LIKE ?
        OR c.description LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    const [rows] = await pool.query(
      `
        SELECT
          e.entityId,
          e.displayName AS hubName,
          e.canonicalName,
          src.sourceNativeId AS auvoCustomerId,
          src.sourceName AS auvoSourceName,
          c.description AS auvoName,
          linked.linkId AS glpiLinkId,
          linked.sourceNativeId AS linkedGlpiDeviceId,
          linked.confidenceScore AS linkedConfidenceScore,
          linked.matchStrategy AS linkedMatchStrategy
        FROM hub_entities e
        JOIN hub_entity_sources src ON src.entityId = e.entityId
        LEFT JOIN customers_auvo c ON c.customerId = CAST(src.sourceNativeId AS UNSIGNED)
        LEFT JOIN hub_entity_links linked
          ON linked.entityId = e.entityId
          AND linked.sourceSystem = 'GLPI'
          AND linked.sourceEntity = 'device'
          AND linked.isActive = 1
        WHERE ${conditions.join(" AND ")}
        ORDER BY COALESCE(e.displayName, e.canonicalName, src.sourceName) ASC
      `,
      params
    );

    return rows.map(row => ({
      entityId: row.entityId,
      hubName: row.hubName || row.canonicalName || row.auvoSourceName || `HUB ${row.entityId}`,
      auvoCustomerId: row.auvoCustomerId ? String(row.auvoCustomerId) : null,
      auvoName: row.auvoName || row.auvoSourceName || row.hubName || row.canonicalName,
      alreadyLinked: Boolean(row.glpiLinkId),
      linkedGlpiDeviceId: row.linkedGlpiDeviceId ? String(row.linkedGlpiDeviceId) : null,
      linkedConfidenceScore: row.linkedConfidenceScore !== null ? Number(row.linkedConfidenceScore) : null,
      linkedMatchStrategy: row.linkedMatchStrategy || null
    }));
  }

  async listGlpiDevices() {
    const [rows] = await pool.query(
      `
        SELECT
          d.deviceId,
          d.name,
          d.auvoCustomerId,
          d.locationId,
          d.locationName,
          d.status,
          d.lastSyncAt,
          linked.entityId AS linkedHubEntityId
        FROM glpi_devices d
        LEFT JOIN hub_entity_links linked ON linked.sourceSystem = 'GLPI'
          AND linked.sourceEntity = 'device' AND CAST(linked.sourceNativeId AS UNSIGNED) = d.deviceId
        ORDER BY d.name ASC
      `
    );

    return rows.map(row => ({
      deviceId: row.deviceId ? String(row.deviceId) : null,
      name: row.name || null,
      auvoCustomerId: row.auvoCustomerId ? String(row.auvoCustomerId) : null,
      locationId: row.locationId ? String(row.locationId) : null,
      locationName: row.locationName || null,
      status: row.status || null,
      lastSyncAt: row.lastSyncAt,
      linkedHubEntityId: row.linkedHubEntityId ? String(row.linkedHubEntityId) : null
    }));
  }

  async getGlpiDevice(deviceId) {
    const [rows] = await pool.query(
      `
        SELECT
          deviceId,
          name,
          auvoCustomerId,
          locationId,
          locationName,
          status,
          lastSyncAt
        FROM glpi_devices
        WHERE deviceId = ?
        LIMIT 1
      `,
      [deviceId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      deviceId: row.deviceId ? String(row.deviceId) : null,
      name: row.name || null,
      auvoCustomerId: row.auvoCustomerId ? String(row.auvoCustomerId) : null,
      locationId: row.locationId ? String(row.locationId) : null,
      locationName: row.locationName || null,
      status: row.status || null,
      lastSyncAt: row.lastSyncAt
    };
  }

  async upsertGlpiLink({ entityId, glpiDevice, score, matchStrategy, confirmedBy = "admin" }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Serialize confirmations of the same HUB or device, including when no link exists yet.
      const [entities] = await connection.query('SELECT entityId FROM hub_entities WHERE entityId = ? FOR UPDATE', [entityId]);
      const [devices] = await connection.query('SELECT deviceId FROM glpi_devices WHERE deviceId = ? FOR UPDATE', [glpiDevice.deviceId]);
      if (!entities.length || !devices.length) {
        await connection.rollback();
        return { success: false, status: 'not_found', message: 'HUB ou dispositivo GLPI não encontrado' };
      }
      const [links] = await connection.query(`
        SELECT entityId, sourceNativeId, isActive FROM hub_entity_links
        WHERE sourceSystem = 'GLPI' AND sourceEntity = 'device'
          AND (sourceNativeId = ? OR (entityId = ? AND isActive = 1))
        FOR UPDATE`, [String(glpiDevice.deviceId), entityId]);
      const deviceLink = links.find(link => String(link.sourceNativeId) === String(glpiDevice.deviceId));
      if (deviceLink && String(deviceLink.entityId) !== String(entityId)) {
        await connection.rollback();
        return { success: false, status: 'device_already_linked', linkedHubEntityId: deviceLink.entityId,
          message: `Dispositivo GLPI já vinculado ao HUB ${deviceLink.entityId}. Atualize a prévia.` };
      }
      if (links.some(link => String(link.entityId) === String(entityId) && link.isActive && String(link.sourceNativeId) !== String(glpiDevice.deviceId))) {
        await connection.rollback();
        return { success: false, status: 'hub_already_linked', message: 'Este HUB já possui outro dispositivo GLPI vinculado. Atualize a prévia.' };
      }
      if (deviceLink?.isActive) {
        await connection.commit();
        return { success: true, status: 'already_linked', message: 'Vínculo GLPI já existia no HUB' };
      }
      await connection.query(
      `
        INSERT INTO hub_entity_links (
          entityId, sourceSystem, sourceEntity, sourceNativeId, sourceExternalId,
          relationRole, confidenceScore, matchStrategy, isPrimary, isActive,
          metadata, lastSeenAt
        ) VALUES (?, 'GLPI', 'device', ?, NULL, 'platform_record', ?, ?, 0, 1, ?, NOW())
        ON DUPLICATE KEY UPDATE
          confidenceScore = VALUES(confidenceScore),
          matchStrategy = VALUES(matchStrategy),
          relationRole = VALUES(relationRole),
          isActive = 1,
          metadata = VALUES(metadata),
          lastSeenAt = NOW()
      `,
      [
        entityId,
        String(glpiDevice.deviceId),
        score,
        matchStrategy,
        JSON.stringify({
          confirmedBy,
          confirmedAt: new Date().toISOString(),
          propagationBlocked: true,
          glpiName: glpiDevice.name || null,
          glpiAuvoCustomerId: glpiDevice.auvoCustomerId || null,
          locationId: glpiDevice.locationId || null,
          locationName: glpiDevice.locationName || null
        })
      ]
      );
      await this.insertLinkHistory({ entityId, glpiDevice, score, matchStrategy, confirmedBy }, connection);
      await connection.commit();
      return { success: true, status: 'confirmed' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async insertLinkHistory({ entityId, glpiDevice, score, matchStrategy, confirmedBy = "admin" }, connection = pool) {
    await connection.query(
      `
        INSERT INTO hub_entity_history (
          entityId, fieldKey, action, sourceSystem, targetSystem,
          oldValue, newValue, message, createdBy
        ) VALUES (?, 'glpiDeviceId', 'confirm_glpi_link', 'GLPI', 'HUB', NULL, ?, ?, ?)
      `,
      [
        entityId,
        String(glpiDevice.deviceId),
        `Vinculo GLPI ${glpiDevice.deviceId} confirmado no HUB com estrategia ${matchStrategy} e score ${score}%. Propagacao para outras plataformas bloqueada.`,
        confirmedBy
      ]
    );
  }
}

export default new HubMatchingRepository();
