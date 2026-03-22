import BaseRepository from "../baseRepository.js";

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
        deletedAt = NULL
    `;

    await this.executeUpsertMany(
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
  }

  async exists(customerId) {
    return super.checkExists("customers_auvo", "customerId", customerId);
  }
}

export default new AuvoCustomerRepository();
