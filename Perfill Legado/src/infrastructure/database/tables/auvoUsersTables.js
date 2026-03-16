import executeQuery from "../queries.js";


class Users {

    async createAllTables() {
        try {
            await this.createTableUsersTypes()
            await this.createTableUsers()

        } catch (error) {
            throw error
        }
    }

    async createTableUsersTypes() {

        const sql = `
        CREATE TABLE IF NOT EXISTS \`auvodb\`.\`userstypes_auvo\` (
          \`userTypeId\` INT NOT NULL,
          \`description\` TEXT NULL DEFAULT NULL,
          PRIMARY KEY (\`userTypeId\`)) 
        ENGINE = InnoDB
        DEFAULT CHARACTER SET = utf8mb4;
        `
        return executeQuery(sql)
    }


    async createTableUsers() {
        const sql = `
         CREATE TABLE IF NOT EXISTS \`auvodb\`.\`users_auvo\` (
            \`userId\` INT NOT NULL,
            \`externalId\` VARCHAR(200) NULL DEFAULT NULL,
            \`name\` VARCHAR(100) NULL DEFAULT NULL,
            \`login\` VARCHAR(100) NULL DEFAULT NULL,
            \`email\` VARCHAR(100) NULL DEFAULT NULL,
            \`jobPosition\` VARCHAR(100) NULL DEFAULT NULL,
            \`userType\` INT NOT NULL,
            \`address\` VARCHAR(255) NULL DEFAULT NULL,
            \`basePoint\` POINT NULL DEFAULT NULL,
            \`registrationDate\` DATETIME NULL,
            \`active\` tinyint,
            PRIMARY KEY (\`userId\`),
            INDEX \`fk_users_usersTypes_idx\` (\`userType\` ASC) VISIBLE,
            CONSTRAINT \`fk_users_usersTypes\`
              FOREIGN KEY (\`userType\`)
              REFERENCES \`auvodb\`.\`userstypes_auvo\` (\`userTypeId\`))
          ENGINE = InnoDB
          DEFAULT CHARACTER SET = utf8mb4; `
        return executeQuery(sql)
    }

}

export default new Users()


