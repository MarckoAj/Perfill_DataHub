import groupRep from "../repositorios/groupRep.js";
import checkField from "../models/validations.js";
import logger from "../logger.js";

class GroupsModel {
  async addGroupsList(groupList) {
    logger.info(`Adding groups from list (${groupList.length} Groups Found)`);

    for (const group of groupList) {
      try {
        await this.addGroup(group);
      } catch (error) {
        logger.error('Error adding group from list:', error);
        throw new Error('Error adding group from list');
      }
    }
  }

  async addGroup(group) {
    try {
      if (await checkField.groupNotExistsInDB(group.id)) {
        await groupRep.insertGroups(group);
      }
    } catch (error) {
      logger.error('Error adding group:', error);
      throw new Error('Error adding group');
    }
  }
}

export default new GroupsModel();
