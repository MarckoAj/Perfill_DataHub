import pool from "../../database/connection.js";

class AuvoUserRepository {
  async upsertUsers(users) {
    if (!users || users.length === 0) return;

    const query = `
      INSERT INTO users_auvo (
        userId, externalId, name, login, email, jobPosition,
        userType, address, active, registrationDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        externalId = VALUES(externalId),
        name = VALUES(name),
        login = VALUES(login),
        email = VALUES(email),
        jobPosition = VALUES(jobPosition),
        userType = VALUES(userType),
        address = VALUES(address),
        active = VALUES(active),
        registrationDate = VALUES(registrationDate)
    `;

    for (const u of users) {
      const values = [
        parseInt(u.userID, 10) || null,
        u.externalId ? String(u.externalId).substring(0, 200) : null,
        u.name ? String(u.name).substring(0, 100) : null,
        u.login ? String(u.login).substring(0, 100) : null,
        u.email ? String(u.email).substring(0, 100) : null,
        u.jobPosition ? String(u.jobPosition).substring(0, 100) : null,
        parseInt(u.userType?.userTypeId, 10) || 1,
        u.address ? String(u.address).substring(0, 255) : null,
        u.active ? 1 : 0,
        u.registrationDate && u.registrationDate !== "" ? u.registrationDate : null
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar usuário AUVO ${u.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  async exists(userId) {
    const query = `SELECT 1 FROM users_auvo WHERE userId = ? LIMIT 1`;
    const [rows] = await pool.query(query, [userId]);
    return rows.length > 0;
  }
}

export default new AuvoUserRepository();
