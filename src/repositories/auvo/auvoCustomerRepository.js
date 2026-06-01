import BaseRepository from "../baseRepository.js";
import pool from "../../database/connection.js";

class AuvoCustomerRepository extends BaseRepository {
  async upsertCustomers(customers) {
    const query = `
      INSERT INTO customers_auvo (
        customerId, externalId, description, cpfCnpj, note, address,
        addressComplement, latitude, longitude, active, segmentId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        externalId = VALUES(externalId),
        description = VALUES(description),
        cpfCnpj = VALUES(cpfCnpj),
        note = VALUES(note),
        address = VALUES(address),
        addressComplement = VALUES(addressComplement),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        active = VALUES(active),
        segmentId = VALUES(segmentId),
        isActive = 1,
        deletedAt = NULL,
        lastSyncAt = CURRENT_TIMESTAMP
    `;

    const metrics = await this.executeUpsertMany(
      customers,
      query,
      c => [
        parseInt(c.id, 10) || null,
        c.externalId ? String(c.externalId).substring(0, 100) : null,
        c.description ? String(c.description) : null,
        c.cpfCnpj ? String(c.cpfCnpj).substring(0, 50) : null,
        c.note ? String(c.note) : null,
        c.address ? String(c.address) : null,
        c.addressComplement ? String(c.addressComplement) : null,
        c.latitude ? String(c.latitude).substring(0, 30) : null,
        c.longitude ? String(c.longitude).substring(0, 30) : null,
        c.active ? 1 : 0,
        parseInt(c.segmentId, 10) || 0
      ],
      "cliente AUVO"
    );

    const groupMetrics = await this.syncCustomerGroups(customers);
    metrics.errors += groupMetrics.errors;
    metrics.errorLogs.push(...groupMetrics.errorLogs);

    return metrics;
  }

  async exists(customerId) {
    return super.checkExists("customers_auvo", "customerId", customerId);
  }

  normalizeIdList(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map(id => parseInt(id, 10))
      .filter(id => Number.isInteger(id) && id > 0);
  }

  async syncCustomerGroups(customers) {
    const metrics = { errors: 0, errorLogs: [] };
    if (!customers || customers.length === 0) return metrics;

    const deleteQuery = "DELETE FROM customers_groups WHERE customerId = ?";
    const insertQuery = `
      INSERT INTO customers_groups (customerId, groupId)
      SELECT ?, ?
      WHERE EXISTS (SELECT 1 FROM customers_auvo WHERE customerId = ?)
        AND EXISTS (SELECT 1 FROM groups_auvo WHERE groupId = ?)
      ON DUPLICATE KEY UPDATE groupId = VALUES(groupId)
    `;

    for (const customer of customers) {
      if (!Object.prototype.hasOwnProperty.call(customer, "groupsId")) continue;

      const customerId = parseInt(customer.id, 10);
      if (!Number.isInteger(customerId) || customerId <= 0) continue;

      const groupIds = this.normalizeIdList(customer.groupsId);

      try {
        await pool.query(deleteQuery, [customerId]);

        for (const groupId of groupIds) {
          await pool.query(insertQuery, [customerId, groupId, customerId, groupId]);
        }
      } catch (error) {
        metrics.errors++;
        metrics.errorLogs.push({
          entityName: "grupo do cliente AUVO",
          entityId: customerId,
          message: error.sqlMessage || error.message
        });
        console.error(`Erro ao salvar grupos do cliente AUVO ${customerId}:`, error.sqlMessage || error.message);
      }
    }

    return metrics;
  }
}

export default new AuvoCustomerRepository();
