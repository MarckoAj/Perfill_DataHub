
import auvoUsers from "./tables/auvoUsersTables.js";
import auvoGroups from "./tables/auvoGroupsTables.js";
import auvoSegments from "./tables/auvoSegmentsTables.js";
import auvoCustomers from "./tables/auvoCustomersTables.js";
import auvoQuestionnaries from "./tables/auvoQuestionnariesTables.js";
import auvoTasks from "./tables/auvoTaksTables.js";
import customerSeeds from "./seeders/customerSeeds.js";
import questionnarieSeeds from "./seeders/questionnarieSeeds.js";
import glpiTickets from "./tables/glpiTicketsTables.js";
import ticketsAlerts from "./tables/ticketsAlertsTables.js";
import segmentSeeds from "./seeders/segmentSeeds.js";
import taskSeeds from "./seeders/taskSeeds.js";
import userSeeds from "./seeders/userSeeds.js";
import auvoAuxiliaryTables from "./tables/auvoAuxiliaryTables.js";
import alertDbFunctions from "./functions/alertDbFunctions.js";
import ticketDbTriggers from "./triggers/ticketDbTriggers.js";
import ticketsAlertsTypesSeeds from "./seeders/ticketsAlertsTypesSeeds.js";


class DefinitionAuvoDb {
  async init(pool) {
    this.pool = pool;
    try {
      await this.createTables();
      await this.updateTriggers();
      await this.updateDbFunctions()
      await this.seedData();
    } catch (error) {
      console.log(error)
    }
  }


  async createTables() {
    try {
      await auvoUsers.createAllTables()
      await auvoSegments.createAllTables()
      await auvoGroups.createAllTables()
      await auvoCustomers.createAllTables()
      await auvoQuestionnaries.createAllTables()
      await auvoTasks.createAllTables()
      await glpiTickets.createAllTables()
      await ticketsAlerts.createAllTables()
      await auvoAuxiliaryTables.createAllTables()
    }
    catch (error) {
      throw error
    }
  }

  async seedData() {
    await userSeeds.addAllSeeds()
    await segmentSeeds.addAllSeeds()
    await customerSeeds.addAllSeeds()
    await questionnarieSeeds.addAllSeeds()
    await taskSeeds.addAllSeeds()
    await ticketsAlertsTypesSeeds.addAllseeds()
  }

  async updateDbFunctions() {
    await alertDbFunctions.deleteAllFunctions()
    await alertDbFunctions.createAllFunctions()
  }

  async updateTriggers() {
    await ticketDbTriggers.deleteAllTriggers()
    await ticketDbTriggers.createAllTriggers()
  }
}




export default new DefinitionAuvoDb;
