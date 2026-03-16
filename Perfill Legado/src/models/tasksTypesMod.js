import checkField from "./validations.js";
import tasksTypeRep from "../repositorios/taskTypeRep.js";
import tasksTypesValidations from "./tasksTypesValidations.js";

class TasksTypesModel {
    fiterRequerimentsFields(requerimentObj) {
        const oderOfKeys = [
            "fillReport",
            "getSignature",
            "fillRolledKilometer",
            "minimumNumberOfPhotos",
            "taskTypeId"
        ]
        return oderOfKeys.reduce((newObj, key) => {
            if (requerimentObj.hasOwnProperty(key)) {
                newObj[key] = requerimentObj[key];
            }
            return newObj
        }, {})
    }

    filterTaskTypesFields(taskType) {
        const orderOfKeys = [
            "id",
            "creatorId",
            "standardQuestionnaireId",
            "taskTypeRequirementId",
            "description",
            "creationDate",
            "standardTime",
            "toleranceTime",
            "active",
            "requirements"
        ];
        return orderOfKeys.reduce((newObj, key) => {
            if (key === "id") {
                newObj["taskTypeId"] = taskType["id"];
            } else if (key === "creationDate" && taskType[key] === "") {
                newObj[key] = new Date
            }
            else if (taskType.hasOwnProperty(key)) {
                newObj[key] = taskType[key];
            }
            return newObj;
        }, {});
    }

    async addTaskTypeEntity(taskType) {
        if (await checkField.taskTypeNotExistsInDB(taskType.taskTypeId)) {
            delete taskType.requerimentes
            return tasksTypeRep.insertTaksType(taskType)
        }
    }

    async addTaskTypeRequirement(taskType) {
        taskType.requirements.taskTypeId = taskType.taskTypeId
        const requerimentObj = this.fiterRequerimentsFields(taskType.requirements)
        if (await checkField.taskTypeRequirementNotExistsInDB(requerimentObj)) {
            return tasksTypeRep.insertTaksTypeRequiriments(requerimentObj)
        }
    }

    async addTasksTypesRequiredQuestionaries(taskType) {
        for (const questionnaire of taskType.requirements.requiredQuestionnaires) {
            const taskTypeRequerimentInDb = await tasksTypeRep.selectRequirementByTaskTypeId(taskType.taskTypeId)
            const requiredQuestionnaireObj = { requiredQuestionnaire: questionnaire, taskTypeRequirementId: taskTypeRequerimentInDb[0].taskTypeRequirementId }
            if (await checkField.questionnaireRequirementNotExistsInDB(requiredQuestionnaireObj)) {
                return tasksTypeRep.insertQuestionnarieRequired(requiredQuestionnaireObj)
            }
        }
    }

    async addTaskTypeList(taskTypeList) {
        console.log(`Adding TaskTypes from list (${taskTypeList.length} taskTypes Found)`)
        for (const taskType of taskTypeList) {
            try {
                await this.addTaskType(taskType)
            } catch (error) {
                console.log(error);
            }
        }
    }

    async addTaskType(taskType) {
        const filtredTaskType = this.filterTaskTypesFields(taskType)
        try {
            await tasksTypesValidations.insertTaskTypeEntitiesIfNotExist(filtredTaskType).then(async () => {
                await this.addTaskTypeEntity(filtredTaskType);
                await this.addTaskTypeRequirement(filtredTaskType);
                await this.addTasksTypesRequiredQuestionaries(filtredTaskType);

            })
        } catch (error) {
            console.log(error);
        }
    }


}









export default new TasksTypesModel