import executeQuery from "../queries.js";


class Tasks {

  async createAllTables() {
    try {
      await this.createTableAuvoTasksStatus()
      await this.createTableAuvoTasksPrioritys()
      await this.createTableAuvoTasksTypes();
      await this.createTableAuvoTaskTypesRequiremments()
      await this.createTableAuvoTasks()
      await this.createTableAuvoTasksPrioritys()
      await this.createTableAuvoTasksUpdates()

    } catch (error) {
      throw error
    }

  }

  async createTableAuvoTasksStatus() {
    const sql = `
    CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_Status\` (
      \`taskStatusId\` INT NOT NULL,
      \`statusDescriptions\` VARCHAR(100) NULL,
    PRIMARY KEY (\`taskStatusId\`))
    ENGINE = InnoDB; `
    return executeQuery(sql)
  }


  async createTableAuvoTasksPrioritys() {
    const sql = `
  CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_prioritys\` (
    \`taskPriorityId\` INT NOT NULL,
    \`priorityDescription\` VARCHAR(100) NULL,
     PRIMARY KEY (\`taskPriorityId\`))
     ENGINE = InnoDB;`
    return executeQuery(sql)
  }


  async createTableAuvoTaskTypesRequiremments() {
    const sql = `CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_types_requirements\` (
      \`taskTypeRequirementId\` INT NOT NULL AUTO_INCREMENT,
      \`tasksTypesId\` INT NOT NULL,
      \`fillReport\` VARCHAR(100) NULL DEFAULT NULL,
      \`getSignature\` VARCHAR(100) NULL DEFAULT NULL,
      \`minimumNumberOfPhotos\` INT NULL DEFAULT NULL,
      \`requiredAnswer\` TINYINT NULL DEFAULT NULL,
      PRIMARY KEY (\`taskTypeRequirementId\`, \`tasksTypesId\`),
      INDEX \`fk_tasks_types_requirements_tasks_types_auvo1_idx\` (\`tasksTypesId\` ASC) VISIBLE,
      UNIQUE INDEX \`tasksTypesId_UNIQUE\` (\`tasksTypesId\` ASC) VISIBLE,
      CONSTRAINT \`fk_tasks_types_requirements_tasks_types_auvo1\`
        FOREIGN KEY (\`tasksTypesId\`)
        REFERENCES \`auvodb\`.\`tasks_types_auvo\` (\`tasksTypesId\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION)
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci;`
    return executeQuery(sql)
  }


  async createTableAuvoTasksTypes() {
    const sql = `CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_types_auvo\` (
      \`tasksTypesId\` INT NOT NULL,
      \`userCreatorId\` INT NOT NULL,
      \`standardQuestionnaireId\` INT NOT NULL,
      \`description\` TEXT NULL DEFAULT NULL,
      \`creationDate\` DATETIME NULL DEFAULT NULL,
      \`standardTime\` TIME NULL DEFAULT NULL,
      \`toleranceTime\` TIME NULL DEFAULT NULL,
      \`active\` TINYINT NULL DEFAULT NULL,
      PRIMARY KEY (\`tasksTypesId\`, \`userCreatorId\`, \`standardQuestionnaireId\`),
      INDEX \`fk_tasks_types_auvo_users_auvo1_idx\` (\`userCreatorId\` ASC) VISIBLE,
      INDEX \`fk_tasks_types_auvo_questionnaires_auvo1_idx\` (\`standardQuestionnaireId\` ASC) VISIBLE,
      CONSTRAINT \`fk_tasks_types_auvo_questionnaires_auvo1\`
        FOREIGN KEY (\`standardQuestionnaireId\`)
        REFERENCES \`auvodb\`.\`questionnaires_auvo\` (\`questionaryId\`),
      CONSTRAINT \`fk_tasks_types_auvo_users_auvo1\`
        FOREIGN KEY (\`userCreatorId\`)
        REFERENCES \`auvodb\`.\`users_auvo\` (\`userId\`))
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci;`

    return executeQuery(sql)
  }


  async createTableAuvoTasksTypes() {
    const sql = `CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_types_auvo\` (
      \`tasksTypesId\` INT NOT NULL,
      \`userCreatorId\` INT NOT NULL,
      \`standardQuestionnaireId\` INT NOT NULL,
      \`description\` TEXT NULL DEFAULT NULL,
      \`creationDate\` DATETIME NULL DEFAULT NULL,
      \`standardTime\` TIME NULL DEFAULT NULL,
      \`toleranceTime\` TIME NULL DEFAULT NULL,
      \`active\` TINYINT NULL DEFAULT NULL,
      PRIMARY KEY (\`tasksTypesId\`, \`userCreatorId\`, \`standardQuestionnaireId\`),
      INDEX \`fk_tasks_types_auvo_users_auvo1_idx\` (\`userCreatorId\` ASC) VISIBLE,
      INDEX \`fk_tasks_types_auvo_questionnaires_auvo1_idx\` (\`standardQuestionnaireId\` ASC) VISIBLE,
      CONSTRAINT \`fk_tasks_types_auvo_questionnaires_auvo1\`
        FOREIGN KEY (\`standardQuestionnaireId\`)
        REFERENCES \`auvodb\`.\`questionnaires_auvo\` (\`questionaryId\`),
      CONSTRAINT \`fk_tasks_types_auvo_users_auvo1\`
        FOREIGN KEY (\`userCreatorId\`)
        REFERENCES \`auvodb\`.\`users_auvo\` (\`userId\`))
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci;`

    return executeQuery(sql)
  }


  async createTableAuvoTasks() {
    const sql = `
  CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tasks_auvo\` (
    \`taskId\` INT NOT NULL,
    \`userFromId\` INT NOT NULL,
    \`userToId\` INT NOT NULL,
    \`taskPriorityId\` INT NOT NULL,
    \`customerId\` INT NOT NULL,
    \`taskStatusID\` INT NOT NULL,
    \`tasksTypesId\` INT NOT NULL,
    \`externalId\` INT NULL,
    \`taskDate\` DATETIME NULL,
    \`taskCreationDate\` DATETIME NULL,
    \`orientation\` TEXT NULL,
    \`deliveredOnSmarthPhone\` VARCHAR(45) NULL,
    \`deliveredDate\` DATETIME NULL,
    \`finished\` TINYINT NULL,
    \`report\` TEXT NULL,
    \`visualized\` TINYINT NULL,
    \`visualizedDate\` DATETIME NULL,
    \`checkIn\` TINYINT NULL,
    \`checkInDate\` DATETIME NULL,
    \`checkOut\` TINYINT NULL,
    \`checkOutDate\` DATETIME NULL,
    \`checkinType\` INT NULL,
    \`inputedKm\` DECIMAL(10,2) NULL,
    \`adoptedKm\` DECIMAL(10,2) NULL,
    \`attachmentsId\` INT NULL,
    \`questionnairesId\` INT NULL,
    \`signatureUrl\` TEXT NULL,
    \`checkInDistance\` DECIMAL(10,2) NULL,
    \`checkOutDistance\` DECIMAL(10,2) NULL,
    \`taskUrl\` TEXT NULL,
    \`pendency\` TEXT NULL,
    \`dateLastUpdate\` DATETIME NULL,
    \`displacementStart\` DATETIME NULL,
    PRIMARY KEY (\`taskId\`),
    INDEX \`fk_tasks_auvo_users_auvo1_idx\` (\`userFromId\` ASC) VISIBLE,
    INDEX \`fk_tasks_auvo_users_auvo2_idx\` (\`userToId\` ASC) VISIBLE,
    INDEX \`fk_tasks_auvo_customers_auvo1_idx\` (\`customerId\` ASC) VISIBLE,
    INDEX \`fk_tasks_auvo_tasks_Status1_idx\` (\`taskStatusID\` ASC) VISIBLE,
    INDEX \`fk_tasks_auvo_tasks_prioritys1_idx\` (\`taskPriorityId\` ASC) VISIBLE,
    INDEX \`fk_tasks_auvo_tasks_types_auvo2_idx\` (\`tasksTypesId\` ASC) VISIBLE,
    CONSTRAINT \`fk_tasks_auvo_users_auvo1\`
      FOREIGN KEY (\`userFromId\`)
      REFERENCES \`auvodb\`.\`users_auvo\` (\`userId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    CONSTRAINT \`fk_tasks_auvo_users_auvo2\`
      FOREIGN KEY (\`userToId\`)
      REFERENCES \`auvodb\`.\`users_auvo\` (\`userId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    CONSTRAINT \`fk_tasks_auvo_customers_auvo1\`
      FOREIGN KEY (\`customerId\`)
      REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    CONSTRAINT \`fk_tasks_auvo_tasks_Status1\`
      FOREIGN KEY (\`taskStatusID\`)
      REFERENCES \`auvodb\`.\`tasks_Status\` (\`taskStatusId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    CONSTRAINT \`fk_tasks_auvo_tasks_prioritys1\`
      FOREIGN KEY (\`taskPriorityId\`)
      REFERENCES \`auvodb\`.\`tasks_prioritys\` (\`taskPriorityId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    CONSTRAINT \`fk_tasks_auvo_tasks_types_auvo2\`
      FOREIGN KEY (\`tasksTypesId\`)
      REFERENCES \`auvodb\`.\`tasks_types_auvo\` (\`tasksTypesId\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION)
  ENGINE = InnoDB;
  `
    return executeQuery(sql)
  }

  async createTableAuvoTasksUpdates() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`auvo_tasks_updates\` (
        \`taskUpdateId\` INT PRIMARY KEY AUTO_INCREMENT,
        \`taskId\` INT,
        \`externalId\` INT,
        \`taskPreviousStatus\` INT,
        \`taskStatus\` INT,
        \`taskLastAtualization\` DATETIME
      )
      ENGINE = InnoDB;
    `;

    return executeQuery(sql);
  }

}
export default new Tasks()


