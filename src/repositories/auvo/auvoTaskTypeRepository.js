import BaseRepository from "../baseRepository.js";

class AuvoTaskTypeRepository extends BaseRepository {
  async upsertTaskTypes(taskTypes) {
    const query = `
      INSERT INTO tasks_types_auvo (
        tasksTypesId, userCreatorId, standardQuestionnaireId, description,
        creationDate, standardTime, toleranceTime, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userCreatorId = VALUES(userCreatorId),
        standardQuestionnaireId = VALUES(standardQuestionnaireId),
        description = VALUES(description),
        creationDate = VALUES(creationDate),
        standardTime = VALUES(standardTime),
        toleranceTime = VALUES(toleranceTime),
        active = VALUES(active),
        isActive = 1,
        deletedAt = NULL,
        lastSyncAt = CURRENT_TIMESTAMP
    `;

    return await this.executeUpsertMany(
      taskTypes,
      query,
      t => {
        const idVal = parseInt(t.id || t.taskTypeID || t.tasksTypesId, 10);
        return [
          Number.isNaN(idVal) ? null : idVal,
          t.creatorId ? parseInt(t.creatorId, 10) : null,
          t.standardQuestionnaireId ? parseInt(t.standardQuestionnaireId, 10) : 0,
          t.description ? String(t.description).substring(0, 255) : null,
          t.creationDate && t.creationDate !== "" ? t.creationDate : null,
          t.standardTime ? String(t.standardTime).substring(0, 50) : null,
          t.toleranceTime ? String(t.toleranceTime).substring(0, 50) : null,
          t.active === false ? 0 : 1
        ];
      },
      "tipo de tarefa AUVO"
    );
  }

  async exists(tasksTypesId) {
    return super.checkExists("tasks_types_auvo", "tasksTypesId", tasksTypesId);
  }
}

export default new AuvoTaskTypeRepository();
