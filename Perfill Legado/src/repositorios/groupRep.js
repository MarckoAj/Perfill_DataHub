import executeQuery from "../infrastructure/database/queries.js";


class groupsRepository {

    selectGroupById(groupId){
      const sql = "select * from `groups_auvo` where groupId = ?"
      return executeQuery(sql,groupId)

    }

    insertGroups(group) {
        const sql = "INSERT INTO `groups_auvo` (groupId, description) VALUES (?, ?)"
        const values = Object.values(group);
        return executeQuery(sql, values);
    }


}

export default new groupsRepository