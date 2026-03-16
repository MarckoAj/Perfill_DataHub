import executaQuery from "../infrastructure/database/queries.js";

class UsersRepository {

    selectUserById(userId) {
        const sql = `select * from users_auvo where userId  = ?`;
        return executaQuery(sql, userId);
    }

    insertUser(user) {
        const sql = 
       "INSERT INTO users_auvo  (userID, externalId, name, login, email, jobPosition, userType, address, registrationDate, active)   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ;
        const values = Object.values(user);
        return executaQuery(sql, values);
    }
    updateUser(user) {
        const sql = `
        UPDATE users_auvo
        SET  externalId = ?, name = ?, login = ?, email = ?, jobPosition = ?, userType = ?, address = ?, registrationDate = ? active = ?
        WHERE userID = ?`
        const values = Object.values(user)
        return executaQuery(sql, values);
    }


  

}



export default new UsersRepository