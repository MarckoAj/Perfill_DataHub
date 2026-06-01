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

  async countEntities() {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM hub_entities e
      JOIN hub_entity_sources src
        ON src.entityId = e.entityId
       AND src.sourceSystem = 'AUVO'
       AND src.sourceEntity = 'customer'
      WHERE e.isActive = 1
    `);

    return row.count || 0;
  }

  async listEntities({ limit = 100, offset = 0 } = {}) {
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
      ORDER BY COALESCE(hubName.valueText, e.displayName, e.canonicalName) ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [limit, offset]);

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
}

export default new HubEntityRepository();
