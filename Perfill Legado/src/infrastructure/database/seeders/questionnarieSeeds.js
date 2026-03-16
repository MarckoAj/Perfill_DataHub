import executeQuery from "../queries.js";

class QuestionnarieSeeds {

    async addAllSeeds() {
        await this.seedDataQuestionnairesAuvo()

    }

    seedDataQuestionnairesAuvo() {
        const sql = `
     INSERT INTO questionnaires_auvo (questionaryId,\`description\`,creationDate)
    SELECT questionaryId,\`description\`,creationDate
    FROM (
    SELECT 0 AS questionaryId,"Selecione um questionario" AS \`description\`, now() AS creationDate
    )AS temp
WHERE NOT EXISTS (
    SELECT 1 FROM questionnaires_auvo WHERE questionnaires_auvo.questionaryId = temp.questionaryId
    );
      `
        return executeQuery(sql)
    }

}
export default new QuestionnarieSeeds()