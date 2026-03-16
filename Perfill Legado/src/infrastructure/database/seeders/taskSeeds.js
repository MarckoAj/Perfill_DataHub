import executeQuery from "../queries.js"

class TaskSeeds {

    async addAllSeeds() {
        await this.seedDataTasksprioritys()
        await this.seedDataTasksStatus()
        await this.seedDataTasksTypesAuvo()
    }

    seedDataTasksprioritys() {
        const sql = `
    INSERT INTO tasks_prioritys (taskPriorityId,priorityDescription)
    SELECT taskPriorityId,priorityDescription
    FROM (
    SELECT 1 AS taskPriorityId,"Low" AS priorityDescription
    UNION ALL
    SELECT 2 AS taskPriorityId,"Mediuim" AS priorityDescription
    UNION ALL
    SELECT 3 AS taskPriorityId,"High" AS priorityDescription
    )AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM tasks_prioritys WHERE tasks_prioritys.taskPriorityId = temp.taskPriorityId
    );
    `
        return executeQuery(sql)
    }

    seedDataTasksStatus() {
        const sql = `
     INSERT INTO tasks_status (taskStatusId,statusDescriptions)
    SELECT taskStatusId,statusDescriptions
    FROM (
    SELECT 1 AS taskStatusId,"Opened" AS statusDescriptions
    UNION ALL
    SELECT 2 AS taskStatusId,"InDisplacement" AS statusDescriptions
    UNION ALL
    SELECT 3 AS taskStatusId,"CheckedIn" AS statusDescriptions
    UNION ALL
    SELECT 4 AS taskStatusId,"CheckedOut" AS statusDescriptions
    UNION ALL
    SELECT 5 AS taskStatusId,"Finished" AS statusDescriptions
    UNION ALL
    SELECT 6 AS taskStatusId,"Paused" AS statusDescriptions
    )AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM tasks_status WHERE tasks_status.taskStatusId = temp.taskStatusId
    );
      `
        return executeQuery(sql)
    }


    seedDataTasksTypesAuvo() {
        const sql = `
     INSERT INTO tasks_types_auvo (tasksTypesId,userCreatorId,standardQuestionnaireId,description,creationDate,standardTime,toleranceTime,active)
    SELECT tasksTypesId,userCreatorId,standardQuestionnaireId,\`description\`,creationDate,standardTime,toleranceTime,active
    FROM (
    SELECT 0 AS tasksTypesId,0 AS userCreatorId,0 AS standardQuestionnaireId,"Tarefa sem tipo" AS \`description\` , now() AS creationDate, 0 AS standardTime, 0 AS toleranceTime, 0 AS active
    )AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM tasks_types_auvo WHERE tasks_types_auvo.tasksTypesId = temp.tasksTypesId
    );
      `
        return executeQuery(sql)
    }

}

export default new TaskSeeds()
