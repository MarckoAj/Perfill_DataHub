import pool from "../connection.js";

export async function createHubOperationalLinksTables() {
  const tables = [
    {
      name: "hub_entity_links",
      query: `
        CREATE TABLE IF NOT EXISTS hub_entity_links (
          linkId BIGINT AUTO_INCREMENT PRIMARY KEY,
          entityId BIGINT NOT NULL,
          sourceSystem VARCHAR(30) NOT NULL,
          sourceEntity VARCHAR(50) NOT NULL,
          sourceNativeId VARCHAR(100) NOT NULL,
          sourceExternalId VARCHAR(150) NULL,
          relationRole VARCHAR(50) NOT NULL DEFAULT 'primary',
          confidenceScore DECIMAL(5,2) DEFAULT 100.00,
          matchStrategy VARCHAR(50) DEFAULT 'manual',
          isPrimary BOOLEAN DEFAULT 0,
          isActive BOOLEAN DEFAULT 1,
          metadata JSON NULL,
          lastSeenAt DATETIME NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_hub_entity_link_source (sourceSystem, sourceEntity, sourceNativeId),
          KEY idx_hub_entity_links_entity (entityId),
          CONSTRAINT fk_hub_entity_links_entities FOREIGN KEY (entityId) REFERENCES hub_entities (entityId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
      `
    },
    {
      name: "glpi_devices",
      query: `
        CREATE TABLE IF NOT EXISTS glpi_devices (
          deviceId BIGINT PRIMARY KEY,
          name VARCHAR(255) NULL,
          auvoCustomerId BIGINT NULL,
          locationId BIGINT NULL,
          locationName VARCHAR(255) NULL,
          status VARCHAR(100) NULL,
          deviceType VARCHAR(120) NULL,
          manufacturer VARCHAR(120) NULL,
          model VARCHAR(160) NULL,
          hardwareTechnician VARCHAR(160) NULL,
          cicom VARCHAR(120) NULL,
          region VARCHAR(120) NULL,
          userName VARCHAR(160) NULL,
          project VARCHAR(160) NULL,
          comments TEXT NULL,
          updateSource VARCHAR(160) NULL,
          latitude DECIMAL(20,8) NULL,
          longitude DECIMAL(20,8) NULL,
          rawJson JSON NULL,
          lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_glpi_devices_auvo (auvoCustomerId),
          KEY idx_glpi_devices_location (locationId),
          KEY idx_glpi_devices_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
      `
    },
    {
      name: "hub_entity_history",
      query: `
        CREATE TABLE IF NOT EXISTS hub_entity_history (
          historyId BIGINT AUTO_INCREMENT PRIMARY KEY,
          entityId BIGINT NOT NULL,
          fieldKey VARCHAR(80) NULL,
          action VARCHAR(80) NOT NULL,
          sourceSystem VARCHAR(30) NULL,
          targetSystem VARCHAR(30) NULL,
          oldValue TEXT NULL,
          newValue TEXT NULL,
          referenceUrl VARCHAR(500) NULL,
          message TEXT NOT NULL,
          createdBy VARCHAR(100) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_hub_history_entity (entityId),
          KEY idx_hub_history_field (fieldKey),
          CONSTRAINT fk_hub_history_entities FOREIGN KEY (entityId) REFERENCES hub_entities (entityId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
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
    await pool.query("ALTER TABLE hub_entity_history ADD COLUMN referenceUrl VARCHAR(500) NULL AFTER newValue;");
    console.log("Migration HUB: Coluna hub_entity_history.referenceUrl adicionada.");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("Migration HUB: Coluna hub_entity_history.referenceUrl ja existe.");
    } else {
      console.error("Erro ao adicionar coluna hub_entity_history.referenceUrl:", error.message);
      throw error;
    }
  }
}
