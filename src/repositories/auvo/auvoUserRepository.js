import BaseRepository from "../baseRepository.js";

class AuvoUserRepository extends BaseRepository {
  async upsertUsers(users, isAlternative = false) {
    const query = `
      INSERT INTO users_auvo (
        userId, externalId, name, login, email, jobPosition,
        userType, address, active, registrationDate, insertedByAlternativeMethod
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        externalId = VALUES(externalId),
        name = VALUES(name),
        login = VALUES(login),
        email = VALUES(email),
        jobPosition = VALUES(jobPosition),
        userType = VALUES(userType),
        address = VALUES(address),
        active = VALUES(active),
        registrationDate = VALUES(registrationDate),
        insertedByAlternativeMethod = VALUES(insertedByAlternativeMethod),
        isActive = 1,
        deletedAt = NULL,
        lastSyncAt = CURRENT_TIMESTAMP
    `;

    return await this.executeUpsertMany(
      users,
      query,
      u => {
        const idVal = parseInt(u.userID || u.userId || u.id, 10);
        return [
          Number.isNaN(idVal) ? null : idVal,
          u.externalId ? String(u.externalId).substring(0, 200) : null,
          u.name ? String(u.name).substring(0, 100) : null,
          u.login ? String(u.login).substring(0, 100) : null,
          u.email ? String(u.email).substring(0, 100) : null,
          u.jobPosition ? String(u.jobPosition).substring(0, 100) : null,
          parseInt(u.userType?.userTypeId, 10) || 1,
          u.address ? String(u.address).substring(0, 255) : null,
          u.unavailableForTasks === true ? 0 : 1,
          u.registrationDate && u.registrationDate !== "" ? u.registrationDate : null,
          isAlternative ? 1 : 0
        ];
      },
      "usuário AUVO"
    );
  }

  async exists(userId) {
    return super.checkExists("users_auvo", "userId", userId);
  }
}

export default new AuvoUserRepository();
