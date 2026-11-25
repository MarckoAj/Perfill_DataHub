import pool from '../connection.js';
export async function createPointOperationsTable() {
 await pool.query("CREATE TABLE IF NOT EXISTS hub_point_operations (operationId CHAR(36) PRIMARY KEY, entityId BIGINT NOT NULL, actorId INT NOT NULL, actorName VARCHAR(100) NOT NULL, state VARCHAR(30) NOT NULL, plan JSON NOT NULL, result JSON NULL, expiresAt DATETIME NOT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_point_operation_entity(entityId), CONSTRAINT fk_point_operations_entity FOREIGN KEY(entityId) REFERENCES hub_entities(entityId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
