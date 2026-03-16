import executeQuery from "../infrastructure/database/queries.js";

class TaskRepository {

   async selectTaskById(taskId) {
      const sql = "SELECT * FROM `tasks_auvo` WHERE `taskId` = ?"
      return executeQuery(sql, taskId)
   }

   async selectTaskByFilters(filters) {
      let sql = `
        SELECT
          T.orientation,
          T.taskStatusID,
          UserFrom.\`name\` AS userFromName,
          UserTo.\`name\` AS userToName,
          C.\`description\` AS customerName,
          Ttype.\`description\` AS taskType,
          T.taskDate,
          T.taskCreationDate,
          T.dateLastUpdate,
          T.finished,
          T.visualized,
          T.checkIn,
          T.checkInDate,
          T.checkOut,
          T.checkOutDate,
          T.taskUrl,
          T.displacementStart
        FROM tasks_auvo AS T
        LEFT JOIN users_auvo AS UserFrom ON T.userFromId = UserFrom.userId
        LEFT JOIN users_auvo AS UserTo ON T.userToId = UserTo.userId
        LEFT JOIN customers_auvo AS C ON T.customerId = C.customerId
        LEFT JOIN tasks_types_auvo AS Ttype ON T.tasksTypesId = Ttype.tasksTypesId
        WHERE 1=1
      `;
    
      const params = [];
    
   
      if (filters.externalIdNot) {
        sql += ' AND T.externalId != ?';
        params.push(filters.externalIdNot);
      } else if (filters.externalId) {
        sql += ' AND T.externalId = ?';
        params.push(filters.externalId);
      }

      if (filters.taskStatusIDNot) {
        sql += ' AND T.taskStatusID != ?';
        params.push(filters.taskStatusIDNot);
      } else if (filters.taskStatusID) {
        sql += ' AND T.taskStatusID = ?';
        params.push(filters.taskStatusID);
      }
    

      if (filters.customerIdNot) {
        sql += ' AND T.customerId != ?';
        params.push(filters.customerIdNot);
      } else if (filters.customerId) {
        sql += ' AND T.customerId = ?';
        params.push(filters.customerId);
      }
    
      return executeQuery(sql, params);
    }
    

   async selecTaskOfDay() {
      const sql = "SELECT * FROM `tasks_auvo` WHERE DATE(taskDate) = CURDATE()"
      return executeQuery(sql)
   }

   async insertTask(task) {
      const sql = "INSERT INTO `tasks_auvo` (`taskID`,`userFromId`, `userToId`,`customerId`,`taskPriorityId`,  `taskStatusID`, `tasksTypesId`,`externalId`, `taskCreationDate`, `taskDate`, `orientation`, `deliveredOnSmarthPhone`, `deliveredDate`, `finished`, `report`, `visualized`,`visualizedDate`, `checkIn`, `checkInDate`, `checkOut`, `checkOutDate`, `checkinType`, `inputedKm`, `adoptedKm`, `signatureUrl`, `checkInDistance`, `checkOutDistance`, `taskUrl`,`pendency`,`dateLastUpdate`,`displacementStart`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      const values = Object.values(task)
      return executeQuery(sql, values)
   }

   async updateTask(task) {

      const sql = "UPDATE `tasks_auvo` SET userFromId = ?, userToId = ?, customerId = ?, taskPriorityId = ?, taskStatusID = ?, tasksTypesId = ?, externalId = ?, taskCreationDate = ?, taskDate = ?, orientation = ?, deliveredOnSmarthPhone = ?, deliveredDate = ?, finished = ?, report = ?, visualized = ?, visualizedDate = ?, checkIn = ?, checkInDate = ?, checkOut = ?, checkOutDate = ?, checkinType = ?, inputedKm = ?, adoptedKm = ?, signatureUrl = ?, checkInDistance = ?, checkOutDistance = ?, taskUrl = ?, pendency = ?, dateLastUpdate = ?, displacementStart = ?  WHERE taskID = ?";
      const values = Object.values(task)
      values.push(values.shift())
      return executeQuery(sql, values)
   }

   async deleteTask(taskId) {
      const sql = "DELETE FROM `tasks_auvo` WHERE taskID = ?"
      return executeQuery(sql, taskId)
   }

}

export default new TaskRepository