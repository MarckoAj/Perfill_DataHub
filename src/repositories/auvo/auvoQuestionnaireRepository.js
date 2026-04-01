import BaseRepository from "../baseRepository.js";

class AuvoQuestionnaireRepository extends BaseRepository {
  async upsertQuestionnaires(questionnaires) {
    const query = `
      INSERT INTO questionnaires_auvo (
        questionaryId, description, header, footer, creationDate
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        header = VALUES(header),
        footer = VALUES(footer),
        creationDate = VALUES(creationDate),
        isActive = 1,
        deletedAt = NULL,
        lastSyncAt = CURRENT_TIMESTAMP
    `;

    return await this.executeUpsertMany(
      questionnaires,
      query,
      q => {
        const idVal = parseInt(q.id || q.questionaryId || q.questionaryID || q.questionnaireId || q.questionnaireID, 10);
        return [
          Number.isNaN(idVal) ? null : idVal,
          q.description ? String(q.description).substring(0, 255) : null,
          q.header ? String(q.header) : null,
          q.footer ? String(q.footer) : null,
          q.creationDate && q.creationDate !== "" ? q.creationDate : null
        ];
      },
      "questionário AUVO"
    );
  }

  async exists(questionaryId) {
    return super.checkExists("questionnaires_auvo", "questionaryId", questionaryId);
  }
}

export default new AuvoQuestionnaireRepository();
