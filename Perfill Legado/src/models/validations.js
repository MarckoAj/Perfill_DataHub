import customersRepository from "../repositorios/customerRep.js";
import usersRepository from "../repositorios/userRep.js";
import groupsRepository from "../repositorios/groupRep.js";
import segmentsRepository from "../repositorios/segmentRep.js";
import questionnariesRep from "../repositorios/questionnarieRep.js";
import tasksTypesRep from "../repositorios/taskTypeRep.js";
import taskRep from "../repositorios/taskRep.js";
import ticketsRep from "../repositorios/ticketsRep.js";

class CheckField {

  async isNewEntity(selectFunction, id) {
    const result = await selectFunction(id);
    return result.length === 0;
  }

  async userNotExistsInDB(userId) {
    return this.isNewEntity(usersRepository.selectUserById, userId);
  }

  async customerNotExistsInDB(customerId) {
    return this.isNewEntity(customersRepository.selectCustomerById, customerId);
  }

  async groupNotExistsInDB(groupId) {
    return this.isNewEntity(groupsRepository.selectGroupById, groupId);
  }

  async segmentNotExistsInDB(segmentId) {
    return this.isNewEntity(segmentsRepository.selectSegmentById, segmentId);
  }

  async customerEmailNotExistsInDB(customerEmailObj) {
    return this.isNewEntity(customersRepository.selectEmailCustomer, customerEmailObj);
  }

  async customerContactNotExistsInDB(customerContactObj) {
    return this.isNewEntity(customersRepository.selectContactCustomer, customerContactObj);
  }

  async customerGroupNotExistsInDB(customerGroupObj) {
    return this.isNewEntity(customersRepository.selectGroupCustomer, customerGroupObj);
  }

  async customerURINotExistsInDB(customerURIObj) {
    return this.isNewEntity(customersRepository.selectURICustomer, customerURIObj);
  }

  async customerManagerNotExistsInDB(customerManagerObj) {
    const customerManagerRelations = await customersRepository.selectManagerCustomer(customerManagerObj);
    const userById = await usersRepository.selectUserById(customerManagerObj.managerCustomer);
    const customerById = await customersRepository.selectCustomerById(customerManagerObj.customerId);

    return customerManagerRelations.length === 0 && userById.length > 0 && customerById.length > 0;
  }

  async questionnaireNotExistsInDB(questionnaireObj) {
    return this.isNewEntity(questionnariesRep.selectQuestionnaireById, questionnaireObj);
  }

  async questionnaireQuestionNotExistsInDB(questionObj) {
    return this.isNewEntity(questionnariesRep.selectQuestionnaireQuestionById, questionObj.id);
  }

  async taskTypeNotExistsInDB(taskTypeId) {
    return this.isNewEntity(tasksTypesRep.selectTaskTypesById, taskTypeId)
  }

  async taskTypeRequirementNotExistsInDB(requirementObj) {
    return this.isNewEntity(tasksTypesRep.selectRequirementByTaskTypeId, requirementObj.taskTypeId);
  }

  async questionnaireRequirementNotExistsInDB(requiredQuestionnaireObj) {
    return this.isNewEntity(tasksTypesRep.selectQuestionnaireRequired, requiredQuestionnaireObj);
  }

  async newTaskNotExistsInDB(taskId) {
    return this.isNewEntity(taskRep.selectTaskById, taskId);
  }

  async ticketAlreadyNotInDB(ticketId) {
    return this.isNewEntity(ticketsRep.selecTicketById, ticketId)
  }
}

export default new CheckField();