import pool from "../database/connection.js";

class HubEntityRepository {
  parseNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  normalizeText(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  async findEntityIdBySource(sourceSystem, sourceEntity, sourceNativeId) {
    const [rows] = await pool.query(
      `
        SELECT entityId
        FROM hub_entity_sources
        WHERE sourceSystem = ? AND sourceEntity = ? AND sourceNativeId = ?
        LIMIT 1
      `,
      [sourceSystem, sourceEntity, sourceNativeId]
    );

    return rows[0]?.entityId || null;
  }

  async createEntityFromAuvoCustomer(customer) {
    const name = this.normalizeText(customer.description) || `AUVO Customer ${customer.customerId}`;
    const status = customer.active ? "active" : "inactive";
    const isActive = customer.isActive ? 1 : 0;

    const [result] = await pool.query(
      `
        INSERT INTO hub_entities (entityType, canonicalName, displayName, status, isActive)
        VALUES ('customer_location', ?, ?, ?, ?)
      `,
      [name, name, status, isActive]
    );

    return result.insertId;
  }

  async updateEntityFromAuvoCustomer(entityId, customer) {
    const name = this.normalizeText(customer.description) || `AUVO Customer ${customer.customerId}`;
    const status = customer.active ? "active" : "inactive";
    const isActive = customer.isActive ? 1 : 0;

    await pool.query(
      `
        UPDATE hub_entities
        SET canonicalName = ?, displayName = ?, status = ?, isActive = ?
        WHERE entityId = ?
      `,
      [name, name, status, isActive, entityId]
    );
  }

  async upsertEntitySource(entityId, customer) {
    await pool.query(
      `
        INSERT INTO hub_entity_sources (
          entityId, sourceSystem, sourceEntity, sourceNativeId, sourceExternalId,
          sourceName, confidenceScore, matchStrategy, lastSeenAt, isActive
        ) VALUES (?, 'AUVO', 'customer', ?, ?, ?, 100.00, 'source_native_id', NOW(), ?)
        ON DUPLICATE KEY UPDATE
          entityId = VALUES(entityId),
          sourceExternalId = VALUES(sourceExternalId),
          sourceName = VALUES(sourceName),
          lastSeenAt = NOW(),
          isActive = VALUES(isActive)
      `,
      [
        entityId,
        String(customer.customerId),
        customer.externalId ? String(customer.externalId).substring(0, 150) : null,
        this.normalizeText(customer.description),
        customer.isActive ? 1 : 0
      ]
    );
  }

  async upsertFieldValue({
    entityId,
    fieldKey,
    sourceSystem,
    sourceEntity,
    sourceRecordId,
    valueText,
    valueNumber,
    isCanonical = 0
  }) {
    const normalizedValue = valueNumber !== null && valueNumber !== undefined
      ? String(valueNumber)
      : this.normalizeText(valueText);

    await pool.query(
      `
        INSERT INTO hub_entity_field_values (
          entityId, fieldKey, sourceSystem, sourceEntity, sourceRecordId,
          valueText, valueNumber, normalizedValue, isCanonical, lastSeenAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          valueText = VALUES(valueText),
          valueNumber = VALUES(valueNumber),
          normalizedValue = VALUES(normalizedValue),
          isCanonical = VALUES(isCanonical),
          lastSeenAt = NOW()
      `,
      [
        entityId,
        fieldKey,
        sourceSystem,
        sourceEntity,
        sourceRecordId,
        valueText,
        valueNumber,
        normalizedValue,
        isCanonical ? 1 : 0
      ]
    );
  }

  async insertFieldValueIfMissing({
    entityId,
    fieldKey,
    sourceSystem = "HUB",
    sourceEntity = "canonical",
    sourceRecordId,
    valueText,
    valueNumber,
    isCanonical = 1
  }) {
    const normalizedValue = valueNumber !== null && valueNumber !== undefined
      ? String(valueNumber)
      : this.normalizeText(valueText);

    if (normalizedValue === null) return false;

    const [result] = await pool.query(
      `
        INSERT INTO hub_entity_field_values (
          entityId, fieldKey, sourceSystem, sourceEntity, sourceRecordId,
          valueText, valueNumber, normalizedValue, isCanonical, lastSeenAt
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        WHERE NOT EXISTS (
          SELECT 1
          FROM hub_entity_field_values existing
          WHERE existing.entityId = ?
            AND existing.fieldKey = ?
            AND existing.sourceSystem = ?
            AND existing.isCanonical = ?
            AND existing.normalizedValue IS NOT NULL
            AND existing.normalizedValue != ''
        )
      `,
      [
        entityId,
        fieldKey,
        sourceSystem,
        sourceEntity,
        sourceRecordId,
        valueText,
        valueNumber,
        normalizedValue,
        isCanonical ? 1 : 0,
        entityId,
        fieldKey,
        sourceSystem,
        isCanonical ? 1 : 0
      ]
    );

    return result.affectedRows > 0;
  }

  async upsertEntityLink({
    entityId,
    sourceSystem,
    sourceEntity,
    sourceNativeId,
    sourceExternalId = null,
    relationRole = "primary",
    confidenceScore = 100,
    matchStrategy = "manual",
    isPrimary = 0,
    metadata = null
  }) {
    if (!entityId || !sourceSystem || !sourceEntity || !sourceNativeId) return;

    await pool.query(
      `
        INSERT INTO hub_entity_links (
          entityId, sourceSystem, sourceEntity, sourceNativeId, sourceExternalId,
          relationRole, confidenceScore, matchStrategy, isPrimary, isActive,
          metadata, lastSeenAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
        ON DUPLICATE KEY UPDATE
          entityId = VALUES(entityId),
          sourceExternalId = VALUES(sourceExternalId),
          relationRole = VALUES(relationRole),
          confidenceScore = VALUES(confidenceScore),
          matchStrategy = VALUES(matchStrategy),
          isPrimary = VALUES(isPrimary),
          isActive = 1,
          metadata = VALUES(metadata),
          lastSeenAt = NOW()
      `,
      [
        entityId,
        sourceSystem,
        sourceEntity,
        String(sourceNativeId),
        sourceExternalId ? String(sourceExternalId) : null,
        relationRole,
        confidenceScore,
        matchStrategy,
        isPrimary ? 1 : 0,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  }

  async getEntityLinks(entityId) {
    const [rows] = await pool.query(
      `
        SELECT
          linkId, entityId, sourceSystem, sourceEntity, sourceNativeId, sourceExternalId,
          relationRole, confidenceScore, matchStrategy, isPrimary, isActive, metadata, lastSeenAt
        FROM hub_entity_links
        WHERE entityId = ? AND isActive = 1
        ORDER BY isPrimary DESC, sourceSystem ASC, sourceEntity ASC
      `,
      [entityId]
    );

    return rows.map(row => ({
      linkId: row.linkId,
      entityId: row.entityId,
      sourceSystem: row.sourceSystem,
      sourceEntity: row.sourceEntity,
      sourceNativeId: row.sourceNativeId,
      sourceExternalId: row.sourceExternalId,
      relationRole: row.relationRole,
      confidenceScore: row.confidenceScore !== null ? Number(row.confidenceScore) : null,
      matchStrategy: row.matchStrategy,
      isPrimary: Boolean(row.isPrimary),
      isActive: Boolean(row.isActive),
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
      lastSeenAt: this.formatDate(row.lastSeenAt)
    }));
  }

  async upsertGlpiDevice(device) {
    if (!device?.deviceId) return;

    await pool.query(
      `
        INSERT INTO glpi_devices (
          deviceId, name, auvoCustomerId, locationId, locationName, status,
          deviceType, manufacturer, model, hardwareTechnician, cicom, region,
          userName, project, comments, updateSource, latitude, longitude, rawJson,
          lastSyncAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          auvoCustomerId = VALUES(auvoCustomerId),
          locationId = VALUES(locationId),
          locationName = VALUES(locationName),
          status = VALUES(status),
          deviceType = VALUES(deviceType),
          manufacturer = VALUES(manufacturer),
          model = VALUES(model),
          hardwareTechnician = VALUES(hardwareTechnician),
          cicom = VALUES(cicom),
          region = VALUES(region),
          userName = VALUES(userName),
          project = VALUES(project),
          comments = VALUES(comments),
          updateSource = VALUES(updateSource),
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          rawJson = VALUES(rawJson),
          lastSyncAt = NOW()
      `,
      [
        device.deviceId,
        device.name || null,
        device.auvoCustomerId || null,
        device.locationId || null,
        device.locationName || null,
        device.status || null,
        device.deviceType || null,
        device.manufacturer || null,
        device.model || null,
        device.hardwareTechnician || null,
        device.cicom || null,
        device.region || null,
        device.userName || null,
        device.project || null,
        device.comments || null,
        device.updateSource || null,
        device.latitude ?? null,
        device.longitude ?? null,
        device.rawJson ? JSON.stringify(device.rawJson) : null
      ]
    );
  }

  async getGlpiDevice(deviceId) {
    if (!deviceId) return null;

    const [rows] = await pool.query(
      `
        SELECT *
        FROM glpi_devices
        WHERE deviceId = ?
        LIMIT 1
      `,
      [deviceId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      deviceId: row.deviceId,
      name: row.name,
      auvoCustomerId: row.auvoCustomerId,
      locationId: row.locationId,
      locationName: row.locationName,
      status: row.status,
      deviceType: row.deviceType,
      manufacturer: row.manufacturer,
      model: row.model,
      hardwareTechnician: row.hardwareTechnician,
      cicom: row.cicom,
      region: row.region,
      userName: row.userName,
      project: row.project,
      comments: row.comments,
      updateSource: row.updateSource,
      latitude: row.latitude !== null ? Number(row.latitude) : null,
      longitude: row.longitude !== null ? Number(row.longitude) : null,
      rawJson: typeof row.rawJson === "string" ? JSON.parse(row.rawJson) : row.rawJson,
      lastSyncAt: this.formatDate(row.lastSyncAt)
    };
  }

  async insertHubHistory({
    entityId,
    fieldKey = null,
    action,
    sourceSystem = null,
    targetSystem = "HUB",
    oldValue = null,
    newValue = null,
    message,
    createdBy = "system"
  }) {
    if (!entityId || !action || !message) return;

    await pool.query(
      `
        INSERT INTO hub_entity_history (
          entityId, fieldKey, action, sourceSystem, targetSystem,
          oldValue, newValue, message, createdBy
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1
          FROM hub_entity_history existing
          WHERE existing.entityId = ?
            AND COALESCE(existing.fieldKey, '') = COALESCE(?, '')
            AND existing.action = ?
            AND COALESCE(existing.sourceSystem, '') = COALESCE(?, '')
            AND COALESCE(existing.newValue, '') = COALESCE(?, '')
        )
      `,
      [
        entityId,
        fieldKey,
        action,
        sourceSystem,
        targetSystem,
        oldValue,
        newValue,
        message,
        createdBy,
        entityId,
        fieldKey,
        action,
        sourceSystem,
        newValue
      ]
    );
  }

  async getHubHistory(entityId, limit = 30) {
    const [rows] = await pool.query(
      `
        SELECT
          historyId, entityId, fieldKey, action, sourceSystem, targetSystem,
          oldValue, newValue, message, createdBy, createdAt
        FROM hub_entity_history
        WHERE entityId = ?
        ORDER BY createdAt DESC, historyId DESC
        LIMIT ?
      `,
      [entityId, limit]
    );

    return rows.map(row => ({
      historyId: row.historyId,
      entityId: row.entityId,
      fieldKey: row.fieldKey,
      action: row.action,
      sourceSystem: row.sourceSystem,
      targetSystem: row.targetSystem,
      oldValue: row.oldValue,
      newValue: row.newValue,
      message: row.message,
      createdBy: row.createdBy,
      createdAt: this.formatDate(row.createdAt)
    }));
  }

  async ensurePilotDeviceLinks({ entityId, auvoCustomer, deviceCode }) {
    if (deviceCode !== "64-097" || !entityId) return;

    if (auvoCustomer?.customerId) {
      await this.upsertEntityLink({
        entityId,
        sourceSystem: "AUVO",
        sourceEntity: "customer",
        sourceNativeId: auvoCustomer.customerId,
        relationRole: "platform_record",
        matchStrategy: "auvo_initial_source",
        isPrimary: 1,
        metadata: {
          deviceCode,
          label: "Cliente AUVO usado para carga inicial do HUB"
        }
      });
    }

    await this.upsertEntityLink({
      entityId,
      sourceSystem: "GLPI",
      sourceEntity: "device",
      sourceNativeId: "10301",
      relationRole: "platform_record",
      matchStrategy: "manual_pilot",
      isPrimary: 0,
      metadata: {
        deviceCode,
        label: "Dispositivo GLPI vinculado manualmente ao piloto"
      }
    });

    await this.upsertGlpiDevice({
      deviceId: 10301,
      name: "64-097_PTZ_AV IGUATEMI - EM FRENTE FARMACIA IDEAL",
      auvoCustomerId: auvoCustomer?.customerId || 14988457,
      locationId: 18892,
      locationName: "EM FRENTE FARMACIA IDEAL",
      status: "INSTALADO",
      deviceType: "CAMERA PTZ",
      manufacturer: "HUAWEI",
      model: "HUAWEI M6741-E-Z37",
      hardwareTechnician: "Marcos Araujo (20)",
      cicom: null,
      region: null,
      userName: null,
      project: "PI NOVO",
      comments: null,
      updateSource: "PI-NOVO",
      latitude: auvoCustomer?.latitude ?? null,
      longitude: auvoCustomer?.longitude ?? null,
      rawJson: {
        source: "manual_pilot_from_user_screenshot",
        capturedFields: ["name", "location", "status", "deviceType", "manufacturer", "model", "hardwareTechnician", "auvoCustomerId", "project", "updateSource"]
      }
    });
  }

  async upsertAuvoFieldValues(entityId, customer) {
    const sourceRecordId = String(customer.customerId);
    const name = this.normalizeText(customer.description);
    const latitude = this.parseNumber(customer.latitude);
    const longitude = this.parseNumber(customer.longitude);

    const fields = [
      { fieldKey: "name", valueText: name, valueNumber: null },
      { fieldKey: "latitude", valueText: latitude !== null ? String(latitude) : null, valueNumber: latitude },
      { fieldKey: "longitude", valueText: longitude !== null ? String(longitude) : null, valueNumber: longitude }
    ];

    for (const field of fields) {
      await this.upsertFieldValue({
        entityId,
        sourceSystem: "AUVO",
        sourceEntity: "customer",
        sourceRecordId,
        isCanonical: 0,
        ...field
      });

      await this.upsertFieldValue({
        entityId,
        sourceSystem: "HUB",
        sourceEntity: "canonical",
        sourceRecordId: String(entityId),
        isCanonical: 1,
        ...field
      });
    }
  }

  async refreshFromAuvoCustomers() {
    const canonicalKeyExpression = "CONCAT('AUVO:customer:', c.customerId)";
    const nameExpression = "COALESCE(NULLIF(TRIM(c.description), ''), CONCAT('AUVO Customer ', c.customerId))";
    const numericLatitudeExpression = `
      CASE
        WHEN REPLACE(TRIM(c.latitude), ',', '.') REGEXP '^-?[0-9]+(\\\\.[0-9]+)?$'
        THEN CAST(REPLACE(TRIM(c.latitude), ',', '.') AS DECIMAL(20,8))
        ELSE NULL
      END
    `;
    const numericLongitudeExpression = `
      CASE
        WHEN REPLACE(TRIM(c.longitude), ',', '.') REGEXP '^-?[0-9]+(\\\\.[0-9]+)?$'
        THEN CAST(REPLACE(TRIM(c.longitude), ',', '.') AS DECIMAL(20,8))
        ELSE NULL
      END
    `;

    const [[beforeRow]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM hub_entity_sources
      WHERE sourceSystem = 'AUVO' AND sourceEntity = 'customer'
    `);

    await pool.query(`
      INSERT INTO hub_entities (canonicalKey, entityType, canonicalName, displayName, status, isActive)
      SELECT
        ${canonicalKeyExpression},
        'customer_location',
        ${nameExpression},
        ${nameExpression},
        CASE WHEN c.active = 1 THEN 'active' ELSE 'inactive' END,
        IFNULL(c.isActive, 1)
      FROM customers_auvo c
      WHERE c.customerId IS NOT NULL
      ON DUPLICATE KEY UPDATE
        canonicalName = VALUES(canonicalName),
        displayName = VALUES(displayName),
        status = VALUES(status),
        isActive = VALUES(isActive)
    `);

    await pool.query(`
      INSERT INTO hub_entity_sources (
        entityId, sourceSystem, sourceEntity, sourceNativeId, sourceExternalId,
        sourceName, confidenceScore, matchStrategy, lastSeenAt, isActive
      )
      SELECT
        e.entityId,
        'AUVO',
        'customer',
        CAST(c.customerId AS CHAR),
        LEFT(c.externalId, 150),
        NULLIF(TRIM(c.description), ''),
        100.00,
        'source_native_id',
        NOW(),
        IFNULL(c.isActive, 1)
      FROM customers_auvo c
      JOIN hub_entities e ON e.canonicalKey = ${canonicalKeyExpression}
      WHERE c.customerId IS NOT NULL
      ON DUPLICATE KEY UPDATE
        entityId = VALUES(entityId),
        sourceExternalId = VALUES(sourceExternalId),
        sourceName = VALUES(sourceName),
        lastSeenAt = NOW(),
        isActive = VALUES(isActive)
    `);

    await this.upsertFieldValuesFromAuvo("AUVO", "customer", "name", "NULLIF(TRIM(c.description), '')", "NULL");
    await this.upsertFieldValuesFromAuvo("HUB", "canonical", "name", "NULLIF(TRIM(c.description), '')", "NULL", true);

    await this.upsertFieldValuesFromAuvo("AUVO", "customer", "latitude", "NULLIF(TRIM(c.latitude), '')", numericLatitudeExpression);
    await this.upsertFieldValuesFromAuvo("HUB", "canonical", "latitude", "NULLIF(TRIM(c.latitude), '')", numericLatitudeExpression, true);

    await this.upsertFieldValuesFromAuvo("AUVO", "customer", "longitude", "NULLIF(TRIM(c.longitude), '')", numericLongitudeExpression);
    await this.upsertFieldValuesFromAuvo("HUB", "canonical", "longitude", "NULLIF(TRIM(c.longitude), '')", numericLongitudeExpression, true);

    const [[afterRow]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM hub_entity_sources
      WHERE sourceSystem = 'AUVO' AND sourceEntity = 'customer'
    `);

    return {
      processed: afterRow.count,
      created: Math.max(0, afterRow.count - beforeRow.count),
      updated: Math.min(beforeRow.count, afterRow.count),
      errors: 0
    };
  }

  async countSources(sourceSystem = "AUVO", sourceEntity = "customer") {
    const [[row]] = await pool.query(
      `
        SELECT COUNT(*) AS count
        FROM hub_entity_sources
        WHERE sourceSystem = ? AND sourceEntity = ?
      `,
      [sourceSystem, sourceEntity]
    );

    return row.count || 0;
  }

  async upsertFieldValuesFromAuvo(sourceSystem, sourceEntity, fieldKey, valueTextExpression, valueNumberExpression, isCanonical = false) {
    const sourceRecordExpression = sourceSystem === "HUB"
      ? "CAST(e.entityId AS CHAR)"
      : "CAST(c.customerId AS CHAR)";
    const normalizedExpression = valueNumberExpression === "NULL"
      ? valueTextExpression
      : `CAST(${valueNumberExpression} AS CHAR)`;

    await pool.query(`
      INSERT INTO hub_entity_field_values (
        entityId, fieldKey, sourceSystem, sourceEntity, sourceRecordId,
        valueText, valueNumber, normalizedValue, isCanonical, lastSeenAt
      )
      SELECT
        e.entityId,
        ?,
        ?,
        ?,
        ${sourceRecordExpression},
        ${valueTextExpression},
        ${valueNumberExpression},
        ${normalizedExpression},
        ?,
        NOW()
      FROM customers_auvo c
      JOIN hub_entities e ON e.canonicalKey = CONCAT('AUVO:customer:', c.customerId)
      WHERE c.customerId IS NOT NULL
      ON DUPLICATE KEY UPDATE
        valueText = VALUES(valueText),
        valueNumber = VALUES(valueNumber),
        normalizedValue = VALUES(normalizedValue),
        isCanonical = VALUES(isCanonical),
        lastSeenAt = NOW()
    `, [fieldKey, sourceSystem, sourceEntity, isCanonical ? 1 : 0]);
  }

  buildEntitySearchClause(search, params) {
    const normalizedSearch = this.normalizeText(search);
    if (!normalizedSearch) return "";

    const like = `%${normalizedSearch}%`;
    params.push(like, like, like, like, like, like);

    return `
      AND (
        e.displayName LIKE ?
        OR e.canonicalName LIKE ?
        OR src.sourceNativeId LIKE ?
        OR src.sourceExternalId LIKE ?
        OR src.sourceName LIKE ?
        OR EXISTS (
          SELECT 1
          FROM hub_entity_field_values fvSearch
          WHERE fvSearch.entityId = e.entityId
            AND fvSearch.fieldKey = 'name'
            AND fvSearch.valueText LIKE ?
        )
      )
    `;
  }

  async countEntities({ search = "" } = {}) {
    const params = [];
    const searchClause = this.buildEntitySearchClause(search, params);
    const [[row]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM hub_entities e
      JOIN hub_entity_sources src
        ON src.entityId = e.entityId
       AND src.sourceSystem = 'AUVO'
       AND src.sourceEntity = 'customer'
      WHERE e.isActive = 1
      ${searchClause}
    `, params);

    return row.count || 0;
  }

  async listEntities({ limit = 100, offset = 0, search = "" } = {}) {
    const params = [];
    const searchClause = this.buildEntitySearchClause(search, params);
    const query = `
      SELECT
        e.entityId,
        e.entityType,
        e.displayName,
        e.status,
        e.isActive,
        src.sourceSystem,
        src.sourceEntity,
        src.sourceNativeId AS sourceRecordId,
        src.sourceExternalId,
        hubName.valueText AS name,
        hubLat.valueNumber AS latitude,
        hubLng.valueNumber AS longitude,
        auvoName.valueText AS auvoName,
        auvoLat.valueNumber AS auvoLatitude,
        auvoLng.valueNumber AS auvoLongitude
      FROM hub_entities e
      JOIN hub_entity_sources src
        ON src.entityId = e.entityId
       AND src.sourceSystem = 'AUVO'
       AND src.sourceEntity = 'customer'
      LEFT JOIN hub_entity_field_values hubName
        ON hubName.entityId = e.entityId
       AND hubName.fieldKey = 'name'
       AND hubName.sourceSystem = 'HUB'
       AND hubName.isCanonical = 1
      LEFT JOIN hub_entity_field_values hubLat
        ON hubLat.entityId = e.entityId
       AND hubLat.fieldKey = 'latitude'
       AND hubLat.sourceSystem = 'HUB'
       AND hubLat.isCanonical = 1
      LEFT JOIN hub_entity_field_values hubLng
        ON hubLng.entityId = e.entityId
       AND hubLng.fieldKey = 'longitude'
       AND hubLng.sourceSystem = 'HUB'
       AND hubLng.isCanonical = 1
      LEFT JOIN hub_entity_field_values auvoName
        ON auvoName.entityId = e.entityId
       AND auvoName.fieldKey = 'name'
       AND auvoName.sourceSystem = 'AUVO'
      LEFT JOIN hub_entity_field_values auvoLat
        ON auvoLat.entityId = e.entityId
       AND auvoLat.fieldKey = 'latitude'
       AND auvoLat.sourceSystem = 'AUVO'
      LEFT JOIN hub_entity_field_values auvoLng
        ON auvoLng.entityId = e.entityId
       AND auvoLng.fieldKey = 'longitude'
       AND auvoLng.sourceSystem = 'AUVO'
      WHERE e.isActive = 1
      ${searchClause}
      ORDER BY COALESCE(hubName.valueText, e.displayName, e.canonicalName) ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    return rows.map(row => ({
      entityId: row.entityId,
      entityType: row.entityType,
      name: row.name || row.displayName,
      latitude: row.latitude !== null ? Number(row.latitude) : null,
      longitude: row.longitude !== null ? Number(row.longitude) : null,
      status: row.status,
      sourceSystem: row.sourceSystem,
      sourceEntity: row.sourceEntity,
      sourceRecordId: row.sourceRecordId,
      sourceExternalId: row.sourceExternalId,
      sources: {
        auvo: {
          name: row.auvoName,
          latitude: row.auvoLatitude !== null ? Number(row.auvoLatitude) : null,
          longitude: row.auvoLongitude !== null ? Number(row.auvoLongitude) : null
        }
      }
    }));
  }

  extractDeviceCode(value) {
    const match = String(value || "").match(/(?:^|[^0-9])(\d{2}-\d{3})(?=[^0-9]|$)/);
    return match ? match[1] : null;
  }

  formatDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

  async getCanonicalFieldValues(entityId) {
    const [rows] = await pool.query(
      `
        SELECT fieldKey, sourceSystem, sourceEntity, sourceRecordId, valueText, valueNumber, valueDate, isCanonical, lastSeenAt
        FROM hub_entity_field_values
        WHERE entityId = ?
        ORDER BY fieldKey ASC, isCanonical DESC, sourceSystem ASC
      `,
      [entityId]
    );

    return rows.map(row => ({
      fieldKey: row.fieldKey,
      sourceSystem: row.sourceSystem,
      sourceEntity: row.sourceEntity,
      sourceRecordId: row.sourceRecordId,
      valueText: row.valueText,
      valueNumber: row.valueNumber !== null ? Number(row.valueNumber) : null,
      valueDate: this.formatDate(row.valueDate),
      isCanonical: Boolean(row.isCanonical),
      lastSeenAt: this.formatDate(row.lastSeenAt)
    }));
  }

  async getAuvoCustomer(customerId) {
    const [rows] = await pool.query(
      `
        SELECT
          c.customerId,
          c.externalId,
          c.description,
          c.address,
          c.addressComplement,
          c.latitude,
          c.longitude,
          c.active,
          c.isActive,
          c.lastSyncAt,
          s.description AS segmentName
        FROM customers_auvo c
        LEFT JOIN segments_auvo s ON s.segmentId = c.segmentId
        WHERE c.customerId = ?
        LIMIT 1
      `,
      [customerId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      customerId: row.customerId,
      externalId: row.externalId,
      description: row.description,
      address: row.address,
      addressComplement: row.addressComplement,
      latitude: this.parseNumber(row.latitude),
      longitude: this.parseNumber(row.longitude),
      active: Boolean(row.active),
      isActive: Boolean(row.isActive),
      segmentName: row.segmentName,
      lastSyncAt: this.formatDate(row.lastSyncAt)
    };
  }

  async getRecentAuvoTasks(customerId, limit = 8) {
    const [rows] = await pool.query(
      `
        SELECT
          t.taskId,
          t.customerId,
          t.taskStatusID,
          st.statusDescriptions AS statusDescription,
          t.tasksTypesId,
          tt.description AS taskType,
          t.taskDate,
          t.taskCreationDate,
          t.finished,
          t.dateLastUpdate,
          t.taskUrl
        FROM tasks_auvo t
        LEFT JOIN tasks_status st ON st.taskStatusId = t.taskStatusID
        LEFT JOIN tasks_types_auvo tt ON tt.tasksTypesId = t.tasksTypesId
        WHERE t.customerId = ?
        ORDER BY COALESCE(t.dateLastUpdate, t.taskDate, t.taskCreationDate) DESC
        LIMIT ?
      `,
      [customerId, limit]
    );

    return rows.map(row => ({
      taskId: row.taskId,
      customerId: row.customerId,
      taskStatusId: row.taskStatusID,
      statusDescription: row.statusDescription,
      taskTypeId: row.tasksTypesId,
      taskType: row.taskType,
      taskDate: this.formatDate(row.taskDate),
      taskCreationDate: this.formatDate(row.taskCreationDate),
      finished: Boolean(row.finished),
      dateLastUpdate: this.formatDate(row.dateLastUpdate),
      taskUrl: row.taskUrl
    }));
  }

  async getRelatedGlpiTickets({ name, deviceCode, locationId = null, limit = 8 }) {
    const conditions = [];
    const params = [];

    if (locationId) {
      conditions.push("idLocalizacaoPonto = ?");
      params.push(locationId);
    }

    if (deviceCode) {
      conditions.push("(nomeCliente LIKE ? OR titulo LIKE ?)");
      params.push(`%${deviceCode}%`, `%${deviceCode}%`);
    }

    if (name) {
      conditions.push("nomeCliente = ?");
      params.push(name);
    }

    if (conditions.length === 0) return [];

    const [rows] = await pool.query(
      `
        SELECT
          ticketId,
          nomeCliente,
          idLocalizacaoPonto,
          titulo,
          status,
          tipo,
          projeto,
          dataCriacao,
          dataAtualizacao,
          updated_at
        FROM tickets
        WHERE ${conditions.map(condition => `(${condition})`).join(" OR ")}
        ORDER BY COALESCE(dataAtualizacao, dataCriacao, updated_at) DESC
        LIMIT ?
      `,
      [...params, limit]
    );

    return rows.map(row => ({
      ticketId: row.ticketId,
      nomeCliente: row.nomeCliente,
      idLocalizacaoPonto: row.idLocalizacaoPonto,
      titulo: row.titulo,
      status: row.status,
      tipo: row.tipo,
      projeto: row.projeto,
      dataCriacao: this.formatDate(row.dataCriacao),
      dataAtualizacao: this.formatDate(row.dataAtualizacao),
      updatedAt: this.formatDate(row.updated_at)
    }));
  }

  async hydrateHubMissingFields({ entityId, auvoCustomer, glpiDevice }) {
    const sourceRecordId = String(entityId);
    const fieldsByPriority = [
      { fieldKey: "name", valueText: auvoCustomer?.description, source: "AUVO" },
      { fieldKey: "latitude", valueText: auvoCustomer?.latitude !== null && auvoCustomer?.latitude !== undefined ? String(auvoCustomer.latitude) : null, valueNumber: auvoCustomer?.latitude, source: "AUVO" },
      { fieldKey: "longitude", valueText: auvoCustomer?.longitude !== null && auvoCustomer?.longitude !== undefined ? String(auvoCustomer.longitude) : null, valueNumber: auvoCustomer?.longitude, source: "AUVO" },
      { fieldKey: "address", valueText: auvoCustomer?.address, source: "AUVO" },
      { fieldKey: "status", valueText: glpiDevice?.status, source: "GLPI" },
      { fieldKey: "deviceType", valueText: glpiDevice?.deviceType, source: "GLPI" },
      { fieldKey: "manufacturer", valueText: glpiDevice?.manufacturer, source: "GLPI" },
      { fieldKey: "model", valueText: glpiDevice?.model, source: "GLPI" },
      { fieldKey: "hardwareTechnician", valueText: glpiDevice?.hardwareTechnician, source: "GLPI" },
      { fieldKey: "locationName", valueText: glpiDevice?.locationName, source: "GLPI" },
      { fieldKey: "locationId", valueText: glpiDevice?.locationId ? String(glpiDevice.locationId) : null, valueNumber: glpiDevice?.locationId || null, source: "GLPI" },
      { fieldKey: "project", valueText: glpiDevice?.project, source: "GLPI" },
      { fieldKey: "updateSource", valueText: glpiDevice?.updateSource, source: "GLPI" }
    ];

    const history = [];

    for (const field of fieldsByPriority) {
      const inserted = await this.insertFieldValueIfMissing({
        entityId,
        fieldKey: field.fieldKey,
        sourceRecordId,
        valueText: field.valueText,
        valueNumber: field.valueNumber ?? null
      });

      if (inserted) {
        await this.insertHubHistory({
          entityId,
          fieldKey: field.fieldKey,
          action: "auto_fill_missing_hub_field",
          sourceSystem: field.source,
          targetSystem: "HUB",
          newValue: field.valueNumber !== null && field.valueNumber !== undefined ? String(field.valueNumber) : field.valueText,
          message: `Campo ${field.fieldKey} preenchido no HUB a partir do ${field.source}.`
        });

        history.push({
          type: "success",
          title: `Campo ${field.fieldKey} preenchido no HUB`,
          description: `Valor aplicado automaticamente a partir do ${field.source} porque o HUB ainda estava vazio.`,
          at: new Date().toISOString(),
          sourceSystem: field.source
        });
      }
    }

    return history;
  }

  buildPlatformFields({ entityId, fieldValues, auvoCustomer, glpiDevice }) {
    const getHubValue = (fieldKey) => {
      const row = fieldValues.find(field => field.fieldKey === fieldKey && field.sourceSystem === "HUB" && field.isCanonical);
      if (!row) return null;
      return row.valueNumber !== null && row.valueNumber !== undefined ? row.valueNumber : row.valueText;
    };

    const omitEmpty = (fields) => Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && value !== "")
    );

    const auvo = omitEmpty({
      id: auvoCustomer?.customerId,
      name: auvoCustomer?.description,
      address: auvoCustomer?.address,
      latitude: auvoCustomer?.latitude,
      longitude: auvoCustomer?.longitude,
      segment: auvoCustomer?.segmentName,
      active: auvoCustomer ? auvoCustomer.active : null
    });

    const glpi = omitEmpty({
      id: glpiDevice?.deviceId,
      name: glpiDevice?.name,
      locationId: glpiDevice?.locationId,
      locationName: glpiDevice?.locationName,
      status: glpiDevice?.status,
      deviceType: glpiDevice?.deviceType,
      manufacturer: glpiDevice?.manufacturer,
      model: glpiDevice?.model,
      hardwareTechnician: glpiDevice?.hardwareTechnician,
      cicom: glpiDevice?.cicom,
      region: glpiDevice?.region,
      userName: glpiDevice?.userName,
      project: glpiDevice?.project,
      comments: glpiDevice?.comments,
      updateSource: glpiDevice?.updateSource,
      latitude: glpiDevice?.latitude,
      longitude: glpiDevice?.longitude,
      auvoCustomerId: glpiDevice?.auvoCustomerId
    });

    const hub = omitEmpty({
      id: entityId,
      name: getHubValue("name") || auvo.name || glpi.name,
      address: getHubValue("address") || auvo.address,
      locationId: getHubValue("locationId") || glpi.locationId,
      locationName: getHubValue("locationName") || glpi.locationName,
      status: getHubValue("status") || glpi.status,
      deviceType: getHubValue("deviceType") || glpi.deviceType,
      manufacturer: getHubValue("manufacturer") || glpi.manufacturer,
      model: getHubValue("model") || glpi.model,
      hardwareTechnician: getHubValue("hardwareTechnician") || glpi.hardwareTechnician,
      project: getHubValue("project") || glpi.project,
      updateSource: getHubValue("updateSource") || glpi.updateSource,
      latitude: getHubValue("latitude") ?? auvo.latitude ?? glpi.latitude,
      longitude: getHubValue("longitude") ?? auvo.longitude ?? glpi.longitude
    });

    return { hub, auvo, glpi, zabbix: {} };
  }

  buildFieldRelations({ entityId, auvoCustomer, glpiTickets, glpiDevice }) {
    const locationIds = [
      ...new Set(
        glpiTickets
          .map(ticket => ticket.idLocalizacaoPonto)
          .filter(Boolean)
          .map(String)
      )
    ];

    return {
      id: [
        { platform: "HUB", entity: "device", field: "entityId", value: String(entityId), role: "Identificador canonico do dispositivo no Data Hub" },
        auvoCustomer ? { platform: "AUVO", entity: "customer", field: "customerId", value: String(auvoCustomer.customerId), role: "Cadastro operacional usado como fonte inicial do HUB" } : null,
        glpiDevice ? { platform: "GLPI", entity: "device", field: "deviceId", value: String(glpiDevice.deviceId), role: "Dispositivo relacionado ao ponto no GLPI" } : null
      ].filter(Boolean),
      name: [
        { platform: "HUB", entity: "device", field: "name", value: auvoCustomer?.description || null, role: "Nome canonico atual do dispositivo" },
        auvoCustomer ? { platform: "AUVO", entity: "customer", field: "description", value: auvoCustomer.description, role: "Fonte inicial de nome" } : null,
        glpiDevice ? { platform: "GLPI", entity: "device", field: "name", value: glpiDevice.name, role: "Nome do dispositivo no GLPI" } : null
      ].filter(Boolean),
      location: [
        auvoCustomer ? { platform: "AUVO", entity: "customer", field: "address", value: auvoCustomer.address, role: "Endereco cadastrado no AUVO" } : null,
        glpiDevice?.locationId ? { platform: "GLPI", entity: "device.location", field: "locationId", value: String(glpiDevice.locationId), role: "Localizacao associada ao dispositivo GLPI" } : null,
        ...locationIds.map(value => ({ platform: "GLPI", entity: "ticket.location", field: "idLocalizacaoPonto", value, role: "Localizacao observada em chamado GLPI" }))
      ].filter(Boolean),
      latitude: [
        auvoCustomer ? { platform: "AUVO", entity: "customer", field: "latitude", value: auvoCustomer.latitude, role: "Coordenada sincronizada inicialmente para o HUB" } : null,
        glpiDevice?.latitude !== null && glpiDevice?.latitude !== undefined ? { platform: "GLPI", entity: "device.location", field: "latitude", value: glpiDevice.latitude, role: "Latitude derivada da subestrutura de localizacao do GLPI" } : null
      ].filter(Boolean),
      longitude: [
        auvoCustomer ? { platform: "AUVO", entity: "customer", field: "longitude", value: auvoCustomer.longitude, role: "Coordenada sincronizada inicialmente para o HUB" } : null,
        glpiDevice?.longitude !== null && glpiDevice?.longitude !== undefined ? { platform: "GLPI", entity: "device.location", field: "longitude", value: glpiDevice.longitude, role: "Longitude derivada da subestrutura de localizacao do GLPI" } : null
      ].filter(Boolean),
      status: [
        glpiDevice?.status ? { platform: "GLPI", entity: "device", field: "status", value: glpiDevice.status, role: "Estado do dispositivo no GLPI" } : null
      ].filter(Boolean),
      model: [
        glpiDevice?.model ? { platform: "GLPI", entity: "device", field: "model", value: glpiDevice.model, role: "Modelo do dispositivo no GLPI" } : null
      ].filter(Boolean)
    };
  }

  buildSyncHistory({ auvoCustomer, glpiTickets, glpiDevice, hydrationHistory = [] }) {
    const history = [];

    if (auvoCustomer) {
      history.push({
        type: "success",
        title: "HUB inicializado a partir do AUVO",
        description: `Cliente AUVO ${auvoCustomer.customerId} aplicado como fonte inicial do dispositivo.`,
        at: auvoCustomer.lastSyncAt,
        sourceSystem: "AUVO"
      });
    }

    if (glpiDevice) {
      history.push({
        type: "success",
        title: "Dispositivo GLPI vinculado ao HUB",
        description: `Dispositivo GLPI ${glpiDevice.deviceId} carregado como fonte complementar do HUB.`,
        at: glpiDevice.lastSyncAt,
        sourceSystem: "GLPI"
      });
    }

    if (glpiTickets[0]) {
      history.push({
        type: "success",
        title: "Chamado GLPI relacionado encontrado",
        description: `Ticket ${glpiTickets[0].ticketId} localizado por nome/codigo do dispositivo.`,
        at: glpiTickets[0].dataAtualizacao || glpiTickets[0].dataCriacao,
        sourceSystem: "GLPI"
      });
    }

    return [...hydrationHistory, ...history];
  }

  async getEntityDetails(entityId) {
    const [rows] = await pool.query(
      `
        SELECT
          e.entityId,
          e.canonicalKey,
          e.entityType,
          e.canonicalName,
          e.displayName,
          e.status,
          e.isActive,
          src.sourceSystem,
          src.sourceEntity,
          src.sourceNativeId,
          src.sourceExternalId,
          src.sourceName
        FROM hub_entities e
        LEFT JOIN hub_entity_sources src ON src.entityId = e.entityId
        WHERE e.entityId = ?
        ORDER BY src.sourceSystem ASC, src.sourceEntity ASC
      `,
      [entityId]
    );

    if (rows.length === 0) return null;

    const first = rows[0];
    const sources = rows
      .filter(row => row.sourceSystem)
      .map(row => ({
        sourceSystem: row.sourceSystem,
        sourceEntity: row.sourceEntity,
        sourceNativeId: row.sourceNativeId,
        sourceExternalId: row.sourceExternalId,
        sourceName: row.sourceName
      }));

    const auvoSource = sources.find(source => source.sourceSystem === "AUVO" && source.sourceEntity === "customer");
    const auvoCustomer = auvoSource ? await this.getAuvoCustomer(auvoSource.sourceNativeId) : null;
    const deviceCode = this.extractDeviceCode(first.displayName || auvoCustomer?.description || auvoSource?.sourceName);
    await this.ensurePilotDeviceLinks({ entityId, auvoCustomer, deviceCode });

    const entityLinks = await this.getEntityLinks(entityId);
    const glpiDeviceLink = entityLinks.find(link => link.sourceSystem === "GLPI" && link.sourceEntity === "device");
    const glpiDevice = glpiDeviceLink ? await this.getGlpiDevice(glpiDeviceLink.sourceNativeId) : null;
    const glpiTickets = await this.getRelatedGlpiTickets({
      name: auvoCustomer?.description || first.displayName,
      deviceCode,
      locationId: glpiDevice?.locationId || null
    });
    const initialFieldValues = await this.getCanonicalFieldValues(entityId);
    const hydrationHistory = await this.hydrateHubMissingFields({ entityId, auvoCustomer, glpiDevice });
    const fieldValues = hydrationHistory.length > 0
      ? await this.getCanonicalFieldValues(entityId)
      : initialFieldValues;
    const platformFields = this.buildPlatformFields({ entityId, fieldValues, auvoCustomer, glpiDevice });
    const persistedHistory = hydrationHistory.length > 0 ? [] : await this.getHubHistory(entityId);

    return {
      entityId: first.entityId,
      canonicalKey: first.canonicalKey,
      entityType: "device",
      originalEntityType: first.entityType,
      canonicalName: first.canonicalName,
      displayName: first.displayName,
      status: first.status,
      isActive: Boolean(first.isActive),
      deviceCode,
      sources: {
        hub: {
          entityId: first.entityId,
          canonicalKey: first.canonicalKey,
          displayName: first.displayName,
          status: first.status
        },
        auvo: {
          source: auvoSource || null,
          customer: auvoCustomer,
          recentTasks: auvoCustomer ? await this.getRecentAuvoTasks(auvoCustomer.customerId) : []
        },
        glpi: {
          device: glpiDevice,
          link: glpiDeviceLink || null,
          tickets: glpiTickets
        },
        zabbix: null
      },
      entityLinks,
      fieldValues,
      platformFields,
      fieldRelations: this.buildFieldRelations({
        entityId: first.entityId,
        auvoCustomer,
        glpiTickets,
        glpiDevice
      }),
      syncHistory: this.buildSyncHistory({
        auvoCustomer,
        glpiTickets,
        glpiDevice,
        hydrationHistory
      })
        .concat(persistedHistory.map(item => ({
          type: item.action === "auto_fill_missing_hub_field" ? "success" : "warning",
          title: item.action,
          description: item.message,
          at: item.createdAt,
          sourceSystem: item.sourceSystem || "HUB"
        })))
    };
  }
}

export default new HubEntityRepository();
