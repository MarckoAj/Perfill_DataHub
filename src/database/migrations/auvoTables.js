import pool from "../connection.js";

export async function runAuvoMigrations() {
    console.log("Iniciando Migrations do AUVO...");

    const tables = [
        // 1. Tabelas Primárias
        {
            name: "userstypes_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS userstypes_auvo (
                    userTypeId INT NOT NULL PRIMARY KEY,
                    description TEXT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "segments_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS segments_auvo (
                    segmentId INT NOT NULL PRIMARY KEY,
                    description VARCHAR(100) NULL,
                    registrationDate DATETIME NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "groups_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS groups_auvo (
                    groupId INT NOT NULL PRIMARY KEY,
                    description TEXT NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "questionnaires_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS questionnaires_auvo (
                    questionaryId INT NOT NULL PRIMARY KEY,
                    description TEXT NULL,
                    header TEXT NULL,
                    footer TEXT NULL,
                    creationDate DATETIME NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "tasks_status",
            query: `
                CREATE TABLE IF NOT EXISTS tasks_status (
                    taskStatusId INT NOT NULL PRIMARY KEY,
                    statusDescriptions VARCHAR(100) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "tasks_prioritys",
            query: `
                CREATE TABLE IF NOT EXISTS tasks_prioritys (
                    taskPriorityId INT NOT NULL PRIMARY KEY,
                    priorityDescription VARCHAR(100) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },

        // 2. Tabelas Secundárias (Dependem das primárias)
        {
            name: "users_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS users_auvo (
                    userId INT NOT NULL PRIMARY KEY,
                    externalId VARCHAR(200) NULL,
                    name VARCHAR(100) NULL,
                    login VARCHAR(100) NULL,
                    email VARCHAR(100) NULL,
                    jobPosition VARCHAR(100) NULL,
                    userType INT NOT NULL,
                    address VARCHAR(255) NULL,
                    basePoint POINT NULL,
                    registrationDate DATETIME NULL,
                    active TINYINT NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL,
                    CONSTRAINT fk_users_userstypes_auvo FOREIGN KEY (userType) REFERENCES userstypes_auvo (userTypeId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "customers_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS customers_auvo (
                    customerId INT NOT NULL PRIMARY KEY,
                    externalId VARCHAR(100) NULL,
                    description TEXT NULL,
                    cpfCnpj VARCHAR(50) NULL,
                    manager VARCHAR(100) NULL,
                    note TEXT NULL,
                    address TEXT NULL,
                    addressComplement TEXT NULL,
                    latitude VARCHAR(30) NULL,
                    longitude VARCHAR(30) NULL,
                    uriAttachments TEXT NULL,
                    active TINYINT NULL,
                    dateLastUpdate DATETIME NULL,
                    creationDate DATETIME NULL,
                    segmentId INT NOT NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL,
                    CONSTRAINT fk_customers_segments_auvo FOREIGN KEY (segmentId) REFERENCES segments_auvo (segmentId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
            `
        },

        // 3. Questionários e Subtabelas
        {
            name: "questionnairesQuestions",
            query: `
                CREATE TABLE IF NOT EXISTS questionnairesQuestions (
                    questionId INT NOT NULL PRIMARY KEY,
                    questionnaireId INT NOT NULL,
                    answerType INT NULL,
                    description TEXT NULL,
                    subtitle TEXT NULL,
                    requiredAnswer TINYINT NOT NULL,
                    creationDate DATETIME NULL,
                    CONSTRAINT fk_questions_questionnaires_auvo FOREIGN KEY (questionnaireId) REFERENCES questionnaires_auvo (questionaryId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "questionnairesAnswers",
            query: `
                CREATE TABLE IF NOT EXISTS questionnairesAnswers (
                    questionnairesAnswersId INT NOT NULL,
                    questionnairesQuestionsId INT NOT NULL,
                    questionId INT NULL,
                    replyId INT NULL,
                    PRIMARY KEY (questionnairesAnswersId, questionnairesQuestionsId),
                    CONSTRAINT fk_answers_questions_auvo FOREIGN KEY (questionnairesQuestionsId) REFERENCES questionnairesQuestions (questionId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "questionnariesReplies",
            query: `
                CREATE TABLE IF NOT EXISTS questionnariesReplies (
                    idquestionnariesReplies INT NOT NULL,
                    questionnairesAnswersId INT NOT NULL,
                    replyId INT NULL,
                    relpy TEXT NULL,
                    replyDate DATETIME NULL,
                    PRIMARY KEY (idquestionnariesReplies, questionnairesAnswersId),
                    CONSTRAINT fk_replies_answers_auvo FOREIGN KEY (questionnairesAnswersId) REFERENCES questionnairesAnswers (questionnairesAnswersId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },

        // 4. Tabelas Relacionais de Clientes
        {
            name: "customers_managers",
            query: `
                CREATE TABLE IF NOT EXISTS customers_managers (
                    userId INT NOT NULL,
                    customerId INT NOT NULL,
                    PRIMARY KEY (userId, customerId),
                    CONSTRAINT fk_managers_users_auvo FOREIGN KEY (userId) REFERENCES users_auvo (userId),
                    CONSTRAINT fk_managers_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
            `
        },
        {
            name: "customers_groups",
            query: `
                CREATE TABLE IF NOT EXISTS customers_groups (
                    customerId INT NOT NULL,
                    groupId INT NOT NULL,
                    PRIMARY KEY (customerId, groupId),
                    CONSTRAINT fk_groups_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId),
                    CONSTRAINT fk_groups_groups_auvo FOREIGN KEY (groupId) REFERENCES groups_auvo (groupId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "customers_contacts",
            query: `
                CREATE TABLE IF NOT EXISTS customers_contacts (
                    contactId INT NOT NULL PRIMARY KEY,
                    customerId INT NOT NULL,
                    description TEXT NULL,
                    contactJobPosition VARCHAR(45) NULL,
                    contactEmail VARCHAR(45) NULL,
                    contactPhone VARCHAR(45) NULL,
                    contactName VARCHAR(45) NULL,
                    CONSTRAINT fk_contacts_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "customers_uriAttachments",
            query: `
                CREATE TABLE IF NOT EXISTS customers_uriAttachments (
                    uriAttachmentsId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    urls TEXT NULL,
                    customerId INT NOT NULL,
                    CONSTRAINT fk_attachments_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "customers_emails",
            query: `
                CREATE TABLE IF NOT EXISTS customers_emails (
                    customerId INT NOT NULL,
                    customer_email VARCHAR(45) NOT NULL,
                    PRIMARY KEY (customerId, customer_email),
                    CONSTRAINT fk_emails_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },

        // 5. Requisitos e Tipos de Tarefas
        {
            name: "tasks_types_requirements",
            query: `
                CREATE TABLE IF NOT EXISTS tasks_types_requirements (
                    taskTypeRequirementId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    tasksTypesId INT NOT NULL,
                    fillReport VARCHAR(100) NULL,
                    getSignature VARCHAR(100) NULL,
                    minimumNumberOfPhotos INT NULL,
                    requiredAnswer TINYINT NULL,
                    UNIQUE KEY uniq_tasksTypesId (tasksTypesId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },
        {
            name: "tasks_types_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS tasks_types_auvo (
                    tasksTypesId INT NOT NULL,
                    userCreatorId INT NOT NULL,
                    standardQuestionnaireId INT NOT NULL,
                    description TEXT NULL,
                    creationDate DATETIME NULL,
                    standardTime TIME NULL,
                    toleranceTime TIME NULL,
                    active TINYINT NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL,
                    PRIMARY KEY (tasksTypesId, userCreatorId, standardQuestionnaireId),
                    CONSTRAINT fk_types_questionnaires FOREIGN KEY (standardQuestionnaireId) REFERENCES questionnaires_auvo (questionaryId),
                    CONSTRAINT fk_types_users_auvo FOREIGN KEY (userCreatorId) REFERENCES users_auvo (userId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        },

        // 6. Tabela Principal de Tarefas
        {
            name: "tasks_auvo",
            query: `
                CREATE TABLE IF NOT EXISTS tasks_auvo (
                    taskId INT NOT NULL PRIMARY KEY,
                    userFromId INT NOT NULL,
                    userToId INT NOT NULL,
                    taskPriorityId INT NOT NULL,
                    customerId INT NOT NULL,
                    taskStatusID INT NOT NULL,
                    tasksTypesId INT NOT NULL,
                    externalId VARCHAR(255) NULL,
                    taskDate DATETIME NULL,
                    taskCreationDate DATETIME NULL,
                    orientation TEXT NULL,
                    deliveredOnSmarthPhone VARCHAR(45) NULL,
                    deliveredDate DATETIME NULL,
                    finished TINYINT NULL,
                    report TEXT NULL,
                    visualized TINYINT NULL,
                    visualizedDate DATETIME NULL,
                    checkIn TINYINT NULL,
                    checkInDate DATETIME NULL,
                    checkOut TINYINT NULL,
                    checkOutDate DATETIME NULL,
                    checkinType INT NULL,
                    inputedKm DECIMAL(10,2) NULL,
                    adoptedKm DECIMAL(10,2) NULL,
                    attachmentsId INT NULL,
                    questionnairesId INT NULL,
                    signatureUrl TEXT NULL,
                    checkInDistance DECIMAL(10,2) NULL,
                    checkOutDistance DECIMAL(10,2) NULL,
                    taskUrl TEXT NULL,
                    pendency TEXT NULL,
                    dateLastUpdate DATETIME NULL,
                    displacementStart DATETIME NULL,
                    isActive BOOLEAN DEFAULT 1,
                    deletedAt DATETIME NULL,
                    lastSyncAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    sourceUpdatedAt DATETIME NULL,
                    CONSTRAINT fk_tasks_customers_auvo FOREIGN KEY (customerId) REFERENCES customers_auvo (customerId),
                    CONSTRAINT fk_tasks_priority_auvo FOREIGN KEY (taskPriorityId) REFERENCES tasks_prioritys (taskPriorityId),
                    CONSTRAINT fk_tasks_status_auvo FOREIGN KEY (taskStatusID) REFERENCES tasks_status (taskStatusId),
                    CONSTRAINT fk_tasks_types_auvo FOREIGN KEY (tasksTypesId) REFERENCES tasks_types_auvo (tasksTypesId),
                    CONSTRAINT fk_tasks_users_from FOREIGN KEY (userFromId) REFERENCES users_auvo (userId),
                    CONSTRAINT fk_tasks_users_to FOREIGN KEY (userToId) REFERENCES users_auvo (userId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
            `
        }
    ];

    for (const table of tables) {
        try {
            await pool.query(table.query);
            console.log(`Migration AUVO: Tabela '${table.name}' validada/criada com sucesso.`);
        } catch (error) {
            console.error(`Erro ao criar tabela AUVO '${table.name}':`, error.message);
            throw error; // Interrompe para não quebrar FKs subsequentes
        }
    }

    try {
        await pool.query("ALTER TABLE tasks_auvo MODIFY COLUMN externalId VARCHAR(255) NULL;");
        console.log("Migration AUVO: Tipo da coluna tasks_auvo.externalId garantida como VARCHAR.");
    } catch (error) {
        console.error(`Erro ao alterar coluna tasks_auvo.externalId:`, error.message);
        throw error;
    }
}
