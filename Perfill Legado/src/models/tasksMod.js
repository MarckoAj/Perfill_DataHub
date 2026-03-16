import checkField from "./validations.js";
import taskRep from "../repositorios/taskRep.js";
import tasksValidations from "./tasksValidations.js";
import logger from "../logger.js";

class TaskModel {
    filterTaskFields(taskObj) {
        const orderOfKeys = [
            "taskID", "idUserFrom", "idUserTo", "customerId", "priority", "taskStatus", "taskType", "externalId", "creationDate", "taskDate", "orientation", "deliveredOnSmarthPhone",
            "deliveredDate", "finished", "report", "visualized", "visualizedDate", "checkIn", "checkInDate", "checkOut", "checkOutDate", "checkinType", "inputedKm", "adoptedKm", "signatureUrl",
            "checkInDistance", "checkOutDistance", "taskUrl", "pendency", "dateLastUpdate", "displacementStart"
        ];

        const newObj = {};
        const dateTypesFields = ["checkInDate", "checkOutDate", "visualizedDate", "displacementStart"];

        for (const key of orderOfKeys) {
            if (taskObj.hasOwnProperty(key)) {
                newObj[key] = taskObj[key];
            }
            if (key === "externalId" && taskObj[key] === '') {
                newObj[key] = 0;
            } else if ((dateTypesFields.includes(key)) && taskObj[key] === '') {
                newObj[key] = null;
            }
        }
        return newObj;
    }

    async addTask(task) {
        try {
            if (await checkField.newTaskNotExistsInDB(task.taskID)) {
                const filteredTask = this.filterTaskFields(task);
                await tasksValidations.insertTaskEntitiesIfNotExist(filteredTask);
                return taskRep.insertTask(filteredTask);
            }
        } catch (error) {
            console.log(error)
            // logger.error(`Failed to add task: ${error.message}`, { task });
            throw error;
        }
    }

    async addListOfTasks(tasksList) {
        logger.info(`Adding Tasks from list (${tasksList.length} Tasks Found)`);
        for (const task of tasksList) {
            try {
                await this.addTask(task);
            } catch (error) {
                console.log(error)
                // logger.error(`Failed to add task from list: ${error.message}`, { task });
            }
        }
    }

    async updateTask(task) {
        try {
            if (!(await checkField.newTaskNotExistsInDB(task.taskID))) {
                return taskRep.updateTask(this.filterTaskFields(task));
            } else {
                throw new Error("Task does not exist");
            }
        } catch (error) {
            logger.error(`Failed to update task: ${error.message}`, { task });
            throw error;
        }
    }

    async deleteTask(task) {
        try {
            if (!(await checkField.newTaskNotExistsInDB(task.taskID))) {
                return taskRep.deleteTask(task.taskID);
            } else {
                throw new Error("Task does not exist");
            }
        } catch (error) {
            logger.error(`Failed to delete task: ${error.message}`, { task });
            throw error;
        }
    }

    async getTaskByExternalId(id) {
        try {
            const tasks = await taskRep.selectTaskByFilters({externalId:id})
            return tasks
        } catch (error) {
            console.log(error)
        }
    }

    async getTasksByfilters(filters){
        try {
            const tasks = await taskRep.selectTaskByFilters(filters)
            return tasks
        } catch (error) {
            console.log(error)
        }
    }


    webHookOptions(option) {
        switch (option) {
            case "Inclusao":
                return this.addTask.bind(this);
            case "Alteracao":
                return this.updateTask.bind(this);
            case "Exclusao":
                return this.deleteTask.bind(this);
            default:
                logger.warn("Ação não disponível", { option });
                break;
        }
    }
}

export default new TaskModel();
