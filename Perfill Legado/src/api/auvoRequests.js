import fetchRequest from "./fetchRequest.js";
import usersMod from "../models/usersMod.js";
import customersMod from "../models/customersMod.js";
import groupsMod from "../models/groupsMod.js";
import segmentsMod from "../models/segmentsMod.js";
import questionnariesMod from "../models/questionnariesMod.js";
import tasksTypesMod from "../models/tasksTypesMod.js";
import tasksMod from "../models/tasksMod.js";


async function insertDBUsersAuvo() {
  try {
    const response = await fetchRequest.getAuvoListComplete("users", {}, []);
    const usersList = response.flat();
    return usersMod.addUsersList(usersList);
  } catch (error) {
    console.error("Error inserting users into DB:", error);
    throw error;
  }
}

async function insertDBSegmentsAuvo() {
  try {
    const response = await fetchRequest.getAuvoListComplete("segments");
    const segmentList = response.flat()
    return segmentsMod.addSegmentsList(segmentList);
  } catch (error) {
    console.error("Error inserting segments into DB:", error);
    throw error;
  }
}

async function insertDBGroupsAuvo() {
  try {
    const response = await fetchRequest.getAuvoListComplete("customerGroups");
    const groupsList = response.flat()
    return groupsMod.addGroupsList(groupsList);
  } catch (error) {
    console.error("Error inserting groups into DB:", error);
    throw error;
  }
}

async function insertDBCustomersAuvo() {
  try {
    const response = await fetchRequest.getAuvoListComplete("customers");
    const customersList = response.flat()
    return customersMod.addListOfCustomers(customersList);
  } catch (error) {
    console.error("Error inserting customers into DB:", error);
    throw error;
  }
}

async function insertDbQuestionnaries() {
  try {
    const response = [];
    for (let page = 1; page <= 4; page++) {
      const data = await fetchRequest.getAuvoList("questionnaires", {}, page);
      if (data.result) {
        response.push(data.result.entityList || data.result);
      }
    }
    const questionnarieList = response.flat()
    return questionnariesMod.addQuestionnarieList(questionnarieList);
  } catch (error) {
    console.error("Error inserting questionnaires into DB:", error);
    throw error;
  }
}

async function insertDbTasksTypes() {
  try {
    const response = await fetchRequest.getAuvoListComplete("taskTypes");
    const tasksTypeList = response.flat()
    return tasksTypesMod.addTaskTypeList(tasksTypeList);
  } catch (error) {
    console.error("Error inserting task types into DB:", error);
    throw error;
  }
}

async function insertDbTasks() {
  try {
    const response = await fetchRequest.requestListTasks("ano", {});
    const taskList = response.flat();
    return await tasksMod.addListOfTasks(taskList);
  } catch (error) {
    console.error("Error inserting tasks into DB:", error);
    throw error;
  }
}


async function main() {
  try {
    await insertDBUsersAuvo();
    await insertDBGroupsAuvo();
    await insertDBSegmentsAuvo();
    await insertDBCustomersAuvo();
    await insertDbQuestionnaries();
    await insertDbTasksTypes();
    await insertDbTasks();
    console.log('All tasks completed successfully');
  } catch (error) {
    console.error('Error in main function sequence:', error);
  }
}
main();


