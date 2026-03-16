import validations from "./validations.js";
import fetchRequest from "../api/fetchRequest.js";
import questionnariesMod from "./questionnariesMod.js";
import usersMod from "./usersMod.js";
import logger from "../logger.js";

class TaskTypeValidations {
    async insertTaskTypeEntitiesIfNotExist(taskType) {
        const { standardQuestionnaireId, creatorId } = taskType;
        try {
            if (await validations.questionnaireNotExistsInDB(standardQuestionnaireId)) {
                const response = await fetchRequest.fetchAuvoEntity("questionnaires", "GET", standardQuestionnaireId);
                if (response.result) {
                    const questionnaire = response.result;
                    await questionnariesMod.addQuestionnarie(questionnaire);
                } else {
                    logger.warn(`Questionnaire with ID ${standardQuestionnaireId} not found.`);
                }
            }

            if (await validations.userNotExistsInDB(creatorId)) {
                const response = await fetchRequest.fetchAuvoEntity("users", "GET", creatorId);
                if (response.result) {
                    const userTo = response.result;
                    await usersMod.addUser(userTo);
                } else {
                    logger.warn(`User with ID ${creatorId} not found.`);
                }
            }
        } catch (error) {
            logger.error('Error inserting task entities:', error);
            throw error;
        }
    }
}

export default new TaskTypeValidations();
