import pool from "../../database/connection.js";

class AuvoQuestionnaireRepository {
  async upsertQuestionnaires(questionnaires) {
    if (!questionnaires || questionnaires.length === 0) return;

    const query = `
      INSERT INTO questionnaires_auvo (
        questionaryId, description, header, footer, creationDate
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        header = VALUES(header),
        footer = VALUES(footer),
        creationDate = VALUES(creationDate)
    `;

    for (const q of questionnaires) {
      const values = [
        parseInt(q.id, 10),
        q.description ? String(q.description).substring(0, 255) : null,
        q.header ? String(q.header) : null,
        q.footer ? String(q.footer) : null,
        q.creationDate && q.creationDate !== "" ? q.creationDate : null
      ];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error(`Erro ao salvar questionário AUVO ${q.id}:`, error.sqlMessage || error.message);
      }
    }
  }

  async exists(questionaryId) {
    if (!questionaryId) return false;
    try {
      const [rows] = await pool.query("SELECT 1 FROM questionnaires_auvo WHERE questionaryId = ?", [questionaryId]);
      return rows.length > 0;
    } catch (err) {
      console.error(`Erro ao verificar existência do questionário ${questionaryId}:`, err.message);
      return false;
    }
  }
}

export default new AuvoQuestionnaireRepository();
