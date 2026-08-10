import pool from "../connection.js";

export async function createHubCoreTables() {
  const tables = [
    {
      name: "hub_entities",
      query: `
        CREATE TABLE IF NOT EXISTS hub_entities (
          entityId BIGINT AUTO_INCREMENT PRIMARY KEY,
          canonicalKey VARCHAR(180) NULL,
          entityType VARCHAR(50) NOT NULL,
          canonicalName VARCHAR(255) NULL,
          displayName VARCHAR(255) NULL,
          status VARCHAR(50) NULL,
          isActive BOOLEAN DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_hub_entities_canonical_key (canonicalKey),
          KEY idx_hub_entities_type (entityType),
          KEY idx_hub_entities_active (isActive)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `
    },
    {
      name: "hub_entity_sources",
      query: `
        CREATE TABLE IF NOT EXISTS hub_entity_sources (
          sourceId BIGINT AUTO_INCREMENT PRIMARY KEY,
          entityId BIGINT NOT NULL,
          sourceSystem VARCHAR(30) NOT NULL,
          sourceEntity VARCHAR(50) NOT NULL,
          sourceNativeId VARCHAR(100) NOT NULL,
          sourceExternalId VARCHAR(150) NULL,
          sourceName VARCHAR(255) NULL,
          confidenceScore DECIMAL(5,2) DEFAULT 100.00,
          matchStrategy VARCHAR(50) DEFAULT 'source_native_id',
          lastSeenAt DATETIME NULL,
          lastSyncAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          isActive BOOLEAN DEFAULT 1,
          UNIQUE KEY uniq_hub_source_record (sourceSystem, sourceEntity, sourceNativeId),
          KEY idx_hub_sources_entity (entityId),
          CONSTRAINT fk_hub_sources_entities FOREIGN KEY (entityId) REFERENCES hub_entities (entityId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `
    },
    {
      name: "hub_entity_field_values",
      query: `
        CREATE TABLE IF NOT EXISTS hub_entity_field_values (
          fieldValueId BIGINT AUTO_INCREMENT PRIMARY KEY,
          entityId BIGINT NOT NULL,
          fieldKey VARCHAR(80) NOT NULL,
          sourceSystem VARCHAR(30) NOT NULL,
          sourceEntity VARCHAR(50) NOT NULL,
          sourceRecordId VARCHAR(100) NOT NULL,
          valueText TEXT NULL,
          valueNumber DECIMAL(20,8) NULL,
          valueDate DATETIME NULL,
          valueJson JSON NULL,
          normalizedValue VARCHAR(255) NULL,
          isCanonical BOOLEAN DEFAULT 0,
          lastSeenAt DATETIME NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_hub_field_source (entityId, fieldKey, sourceSystem, sourceRecordId),
          KEY idx_hub_field_entity (entityId),
          KEY idx_hub_field_key (fieldKey),
          KEY idx_hub_field_canonical (entityId, fieldKey, isCanonical),
          CONSTRAINT fk_hub_field_values_entities FOREIGN KEY (entityId) REFERENCES hub_entities (entityId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
      `
    },
    {
      name: "hub_operational_tags",
      query: `
        CREATE TABLE IF NOT EXISTS hub_operational_tags (
          tagId BIGINT AUTO_INCREMENT PRIMARY KEY,
          label VARCHAR(80) NOT NULL,
          normalizedLabel VARCHAR(100) NOT NULL,
          description VARCHAR(255) NULL,
          isActive BOOLEAN DEFAULT 1,
          createdBy VARCHAR(100) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_hub_operational_tags_normalized (normalizedLabel),
          KEY idx_hub_operational_tags_active (isActive)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `
    }
  ];

  for (const table of tables) {
    try {
      await pool.query(table.query);
      console.log(`Migration HUB: Tabela '${table.name}' validada/criada com sucesso.`);
    } catch (error) {
      console.error(`Erro ao criar tabela HUB '${table.name}':`, error.message);
      throw error;
    }
  }

  try {
    await pool.query("ALTER TABLE hub_entities ADD COLUMN canonicalKey VARCHAR(180) NULL AFTER entityId;");
    console.log("Migration HUB: Coluna hub_entities.canonicalKey adicionada.");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("Migration HUB: Coluna hub_entities.canonicalKey ja existe.");
    } else {
      console.error("Erro ao adicionar coluna hub_entities.canonicalKey:", error.message);
      throw error;
    }
  }

  try {
    await pool.query("ALTER TABLE hub_entities ADD UNIQUE KEY uniq_hub_entities_canonical_key (canonicalKey);");
    console.log("Migration HUB: Indice uniq_hub_entities_canonical_key garantido.");
  } catch (error) {
    if (error.code === "ER_DUP_KEYNAME") {
      console.log("Migration HUB: Indice uniq_hub_entities_canonical_key ja existe.");
    } else {
      console.error("Erro ao adicionar indice uniq_hub_entities_canonical_key:", error.message);
      throw error;
    }
  }

  try {
    await pool.query(`
      INSERT INTO hub_operational_tags (label, normalizedLabel, description, isActive, createdBy)
      VALUES ('Desinstalado', 'DESINSTALADO', 'Tag operacional extraida de prefixos como **Desinstalado** no AUVO.', 1, 'migration')
      ON DUPLICATE KEY UPDATE isActive = 1
    `);
    console.log("Migration HUB: Tag operacional padrao 'Desinstalado' garantida.");
  } catch (error) {
    console.error("Erro ao semear tag operacional padrao:", error.message);
    throw error;
  }
}
