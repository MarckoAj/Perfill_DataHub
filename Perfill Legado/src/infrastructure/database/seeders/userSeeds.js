import executeQuery from "../queries.js";

class UserSeeds {

    async addAllSeeds() {
        await this.seedDataUsersTypes()
        await this.seedDataUsersAuvo()
    }

    seedDataUsersTypes() {
        const sql = `
   INSERT INTO userstypes_auvo (userTypeId, description)
   SELECT userTypeId, description
   FROM (
    SELECT 3 AS userTypeId, 'Administrator' AS description
    UNION ALL
    SELECT 4 AS userTypeId, 'Main_Administrator' AS description
    UNION ALL
    SELECT 1 AS userTypeId, 'User' AS description
    ) AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM userstypes_auvo WHERE userstypes_auvo.userTypeId = temp.userTypeId
    );
    `
        return executeQuery(sql)
    }


    seedDataUsersAuvo() {
        const sql = `
     INSERT INTO users_auvo (userId,\`name\`,userType)
     SELECT userId,\`name\`,\`userType\`
     FROM (
     SELECT 0 AS userId,"NÃO ATRIBUIDO" AS \`name\`, 1 AS userType
    )AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM users_auvo WHERE users_auvo.userId = temp.userId
    );
      `
        return executeQuery(sql)
    }


}

export default new UserSeeds()