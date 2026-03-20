import pool from "../../database/connection.js";

class AuvoCustomerRepository {
  async upsertCustomers(customers) {
    if (!customers || customers.length === 0) return;

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
        segmentId = VALUES(segmentId)
    `;

    for (const c of customers) {
      const values = [
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
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar cliente AUVO ${c.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  async exists(customerId) {
    const query = `SELECT 1 FROM customers_auvo WHERE customerId = ? LIMIT 1`;
    const [rows] = await pool.query(query, [customerId]);
    return rows.length > 0;
  }
}

export default new AuvoCustomerRepository();
