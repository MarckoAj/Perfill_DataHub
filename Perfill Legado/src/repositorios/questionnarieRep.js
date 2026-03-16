import executeQuery from "../infrastructure/database/queries.js";

class QuestionnariesRepository {

  selectQuestionnaireById(questionnarieId) {
    const sql = "select * from `questionnaires_auvo` where questionaryId = ?"
    return executeQuery(sql, questionnarieId);
  }

  selectQuestionnaireQuestionById(questionId) {
    const sql = "select * from `questionnairesquestions` where questionId = ?"
    return executeQuery(sql, questionId)
  }

  insertQuestionnarie(questionnaries) {
    const sql = "INSERT INTO `questionnaires_auvo` (questionaryId,description,header,creationDate) VALUES (?, ?, ?, ?)"
    const values = Object.values(questionnaries);
    return executeQuery(sql, values);
  }

  insertQuestionnarieQuestion(questionnarie) {
    const sql = "INSERT INTO `questionnairesquestions`(`questionId`,`answerType`,`description`,`subtitle`,`creationDate`,`requiredAnswer`,`questionnaireId`) VALUES (?,?,?,?,?,?,?)"
    const values = Object.values(questionnarie);
    return executeQuery(sql, values);
  }

}

export default new QuestionnariesRepository