import questionnarieRep from "../repositorios/questionnarieRep.js";
import checkField from "../models/validations.js";
import logger from "../logger.js";

class QuestionnarieModel {
    filterQuestionnariesFields(questionnarie) {
        const orderOfKeys = [
            "id",
            "description",
            "header",
            "creationDate",
            "questions"
        ];
        return orderOfKeys.reduce((newObj, key) => {
            if (key === "id") {
                newObj["questionaryId"] = questionnarie["id"];
            } else if (key === "creationDate" && questionnarie[key] === "") {
                newObj[key] = new Date();
            } else if (questionnarie.hasOwnProperty(key)) {
                newObj[key] = questionnarie[key];
            }
            return newObj;
        }, {});
    }

    async addQuestionnarieEntity(questionnarie) {
        try {
            const filteredQuestionnarie = this.filterQuestionnariesFields(questionnarie);
            if (await checkField.questionnaireNotExistsInDB(filteredQuestionnarie.questionaryId)) {
                delete filteredQuestionnarie.questions;
                await questionnarieRep.insertQuestionnarie(filteredQuestionnarie);
            }
        } catch (error) {
            logger.error(`Error adding Questionnarie Entity:, ${JSON.stringify(error)}`);
            throw new Error('Error adding Questionnarie Entity');
        }
    }

    async addQuestionnarieQuestions(questionnarie) {
        try {
            for (const question of questionnarie.questions) {
                if (await checkField.questionnaireQuestionNotExistsInDB(question)) {
                    question.questionnarieId = questionnarie.id;
                    await questionnarieRep.insertQuestionnarieQuestion(question);
                }
            }
        } catch (error) {
            // logger.error(`Error adding Questionnarie Questions:, ${JSON.stringify(error)}`);
            console.log(error)
            // throw new Error('Error adding Questionnarie Questions');
        }
    }

    async addQuestionnarie(questionnarie) {
        try {
            await this.addQuestionnarieEntity(questionnarie);
            await this.addQuestionnarieQuestions(questionnarie);
        } catch (error) {
            logger.error(`Error adding Questionnarie:, ${JSON.stringify(error)}`);
            throw new Error('Error adding Questionnarie');
        }
    }

    async addQuestionnarieList(questionnariesList) {
        logger.info(`Adding questionnaries from list (${questionnariesList.length} questionnaries Found)`);

        for (const questionnarie of questionnariesList) {
            try {
                await this.addQuestionnarie(questionnarie);
            } catch (error) {
                logger.error(`Error adding Questionnarie from list:, ${JSON.stringify(error)}`);
                throw new Error('Error adding Questionnarie from list');
            }
        }
    }
}

export default new QuestionnarieModel();
