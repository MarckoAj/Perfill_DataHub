import usersMod from "./usersMod.js";
import tasksMod from "./tasksMod.js";
import customersMod from "./customersMod.js";
import logger from "../logger.js";

class WebHookMod {
  async executeAction(data) {
    try {
      // logger.info(`Received webhook data: ${JSON.stringify(data)}`);

      const webHooksEntities = { "User": usersMod, "Tarefas": tasksMod, "Cliente": customersMod };
      const webHooksAcceptedEntities = Object.keys(webHooksEntities);
      const { entityType, action, entities } = data;

      if (webHooksAcceptedEntities.includes(entityType)) {
        const entityAction = webHooksEntities[entityType].webHookOptions(action);
        const result = await entityAction(entities[0]);
        logger.info(`Successfully executed action for ${entityType} (${action}): ${JSON.stringify(result)}`);
        return result;
      } else {
        throw new Error(`Unsupported entityType: ${entityType}`);
      }
    } catch (error) {
      logger.error(`Failed to execute webhook action: ${error.message}`, { data });
      throw error;
    }
  }
}

export default new WebHookMod();
