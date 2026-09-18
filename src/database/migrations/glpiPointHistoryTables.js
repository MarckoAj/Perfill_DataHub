import pool from '../connection.js';

export async function createGlpiPointHistoryTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS glpi_point_history_tickets (
    ticketId BIGINT PRIMARY KEY,
    ownerDeviceId BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status VARCHAR(50),
    category TEXT,
    dateUpdated DATETIME,
    interactions JSON NOT NULL,
    KEY idx_point_history_owner (ownerDeviceId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS glpi_point_history_items (
    ticketId BIGINT NOT NULL,
    itemType VARCHAR(100) NOT NULL,
    itemId BIGINT NOT NULL,
    name VARCHAR(255),
    PRIMARY KEY (ticketId, itemType, itemId),
    KEY idx_point_history_item (itemType, itemId, ticketId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS glpi_point_history_sync (
    deviceId BIGINT PRIMARY KEY,
    lastSyncedAt DATETIME NULL,
    lastAttemptAt DATETIME NULL,
    lastError VARCHAR(255) NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}
