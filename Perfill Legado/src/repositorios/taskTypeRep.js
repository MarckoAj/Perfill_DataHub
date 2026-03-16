import executeQuery from "../infrastructure/database/queries.js";

class TasksTypesRepository {
  
 async selectTaskTypesById(taskTypeId){
  const sql =  "SELECT * FROM `tasks_types_auvo`  WHERE  `tasksTypesId` = ?"
  return executeQuery(sql,taskTypeId)
 }

async selectRequirementByTaskTypeId(taskTypeId){
   const sql = "SELECT * FROM `tasks_types_requirements`  WHERE  `tasksTypesId` = ?"
   return executeQuery(sql,taskTypeId)  
}

async selectQuestionnaireRequired(requiredQuestionnaireObj){
   const sql = "SELECT * FROM `requiredquestionnaires` WHERE `questionnaireId` = ? AND `TaskTypesRequirementId` = ? "
   const values = Object.values(requiredQuestionnaireObj)
   return executeQuery(sql,values)
 }

 async  insertTaksType(taskType){
    const sql = "INSERT INTO `tasks_types_auvo` (`tasksTypesId`,`userCreatorId`,`standardQuestionnaireId`,`description`,`creationDate`,`standardTime`,`toleranceTime`,`active`) VALUES (?,?,?,?,?,?,?,?)"
    const values = Object.values(taskType)
    return executeQuery(sql,values)
 }

 async insertTaksTypeRequiriments(taskTypeRequirement){
    const sql = "INSERT INTO `tasks_types_requirements` (`fillReport`,`getSignature`,`minimumNumberOfPhotos`,`requiredAnswer`,`tasksTypesId`) VALUES (?,?,?,?,?)"
    const values = Object.values(taskTypeRequirement)
   return executeQuery(sql,values)

 }

 async insertQuestionnarieRequired(questionnarieRequered){
   const sql = "INSERT INTO `requiredquestionnaires` (`questionnaireId`,`TaskTypesRequirementId`) VALUES (?,?)"
   const values = Object.values(questionnarieRequered)
   return executeQuery(sql,values)
 }


}

export default new TasksTypesRepository