import usersRep from "../repositorios/userRep.js";
import checkField from "./validations.js";
import logger from "../logger.js";

class UsersRepository {
  async addUsersList(usersList) {
    logger.info(`Adding Users from list (${usersList.length} Users Found)`);
    const promises = usersList.map(user => this.addUser(user));
    return await Promise.all(promises);
  }

  async addUser(user) {
    try {
      if (await checkField.userNotExistsInDB(user.userID)) {
        const newUser = this.refactorUser(user);
        return usersRep.insertUser(newUser);
      }
    } catch (error) {
      logger.error(`Failed to add user: ${error.message}`, { user });
      throw error;
    }
  }

  async updateUser(user) {
    try {
      if (!(await checkField.userNotExistsInDB(user.userId))) {
        const updatedUser = this.refactorUser(user);
        updatedUser.active = true;
        return usersRep.updateUser(updatedUser);
      }
    } catch (error) {
      logger.error(`Failed to update user: ${error.message}`, { user });
      throw error;
    }
  }

  async deactivateUser(user) {
    try {
      if (!(await checkField.userNotExistsInDB(user.userId))) {
        const deactivatedUser = this.refactorUser(user);
        deactivatedUser.name = `Inativo - ${user.name}`;
        deactivatedUser.active = false;
        return usersRep.updateUser(deactivatedUser);
      }
    } catch (error) {
      logger.error(`Failed to deactivate user: ${error.message}`, { user });
      throw error;
    }
  }

  refactorUser(user) {
    const keysToFilter = ["userId", "externalId", "name", "login", "email", "jobPosition", "userType", "address", "registrationDate"];
    const newUser = keysToFilter.reduce((acc, key) => {
      if (key === "userType" && user[key] !== undefined && user[key].userTypeId !== undefined) {
        acc[key] = user[key].userTypeId;
      } else if (key === "userId") {
        acc[key] = user["userID"];
      } else {
        acc[key] = user[key];
      }
      if (typeof acc[key] === 'string') {
        acc[key] = acc[key].replace(/'/g, '"');
      }
      return acc;
    }, {});
    newUser["active"] = true;
    return newUser;
  }

  webHookOptions(option) {
    switch (option) {
      case "Inclusao":
        return this.addUser.bind(this);
      case "Alteracao":
        return this.updateUser.bind(this);
      case "Exclusao":
        return this.deactivateUser.bind(this);
      default:
        logger.warn("Ação não disponível", { option });
        break;
    }
  }
}

export default new UsersRepository();
