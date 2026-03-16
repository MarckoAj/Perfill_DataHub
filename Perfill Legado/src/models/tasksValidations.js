import validations from "./validations.js";
import fetchRequest from "../api/fetchRequest.js";
import customersMod from "./customersMod.js"
import tasksTypesMod from "./tasksTypesMod.js";
import usersMod from "./usersMod.js";
import logger from "../logger.js";

class TaskValidations {
  async insertTaskEntitiesIfNotExist(task) {
    const { idUserFrom, idUserTo, customerId, taskType } = task;
    try {

      if (await validations.userNotExistsInDB(idUserFrom)) {
        const response = await fetchRequest.fetchAuvoEntity("users", "GET", idUserFrom);
        if (response.result) {
          const userEntity = response.result;
          await usersMod.addUser(userEntity);
        } else {
          logger.warn(`User with ID ${idUserFrom} not found.`);
        }
      }

      if (await validations.userNotExistsInDB(idUserTo)) {
        const response = await fetchRequest.fetchAuvoEntity("users", "GET", idUserTo);
        if (response.result) {
          const userEntity = response.result;
          await usersMod.addUser(userEntity);
        } else {
          logger.warn(`User with ID ${idUserTo} not found.`);
        }
      }

      if (await validations.customerNotExistsInDB(customerId)) {
        const response = await fetchRequest.fetchAuvoEntity("customers", "GET", customerId);
        if (response.result) {
          const customerEntity = response.result;
          await customersMod.addCustomer(customerEntity);
        } else {
          logger.warn(`Questionnaire with ID ${customerId} not found.`);
        }
      }

      if (await validations.taskTypeNotExistsInDB(taskType)) {
        const response = await fetchRequest.fetchAuvoEntity("taskTypes", "GET", taskType);
        if (response.result) {
          const taskTypeEntity = response.result;
          await tasksTypesMod.addTaskType(taskTypeEntity);
        } else {
          logger.warn(`taskType with ID ${taskType} not found.`);
        }
      }

    } catch (error) {
      logger.error('Error inserting task type entities:', error);
      throw error;
    }
  }
}

export default new TaskValidations();
