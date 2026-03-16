import fetchRequest from "../api/fetchRequest.js";


class AcompanhamentoTecnicos {

  async fetchUserList() {
    const usersList = await fetchRequest.getAuvoListComplete("users", {}, [
      "userId",
      "name",
      "userType",
    ]);
    return usersList
  }


  filterTecnicos(usersList) {
    return usersList.filter((user) => user.userType.userTypeId === 1);
  }

  async technicalList() {
    const data = await this.fetchUserList();
    const listaTecnicos = this.filterTecnicos(data[0]);
    return listaTecnicos;
  }


  async taskList(userId) {
    const selectfields = [
      "userFromName",
      "userToName",
      "taskType",
      "taskTypeDescription",
      "customerDescription",
      "checkIn",
      "taskStatus"
    ];

    return await fetchRequest.requestListTasks("dia", { idUserTo: userId }, selectfields);
  }

  async hasTasks() {
    const listaTecnicos = await this.technicalList()
    const whitchTasks = []
    for (const tecnico of listaTecnicos) {
      const taskList = await this.taskList(tecnico.userID);
      tecnico.whitchTask = (taskList.length > 0)
      delete tecnico.userType
      whitchTasks.push(tecnico)
    }
    return whitchTasks
  }

  countTaskTypes(taskList) {
    const tiposDeTarefas = {};
    for (const task of taskList) {
      const taskTypeDescription = `TAREFA ${task.taskTypeDescription}`;
      tiposDeTarefas[taskTypeDescription] = (tiposDeTarefas[taskTypeDescription] || 0) + 1;
    }
    return tiposDeTarefas;
  }

  countTaskStatus(taskList) {
    const tasKstatus = {};
    for (const task of taskList) {
      const taskTypeDescription = `TAREFA ${task.taskTypeDescription}`;
      tasKstatus[taskTypeDescription] = (tasKstatus[taskTypeDescription] || 0) + 1;
    }
    return tasKstatus;

  }


  countTasks(taskList) {
    try {
      const finalList = []
      for (let i = 0; taskList.length > i; i++) {

        const objInFinalList = finalList.find(obj => obj["TipoDeTarefa"] === taskList[i]["taskTypeDescription"])
        const isFinalizedTask = (status) => status === 5


        taskList[i]["taskStatus"]
        if (objInFinalList) {
          if (!(isFinalizedTask(taskList[i]["taskStatus"]))) {
            objInFinalList["QtdAbertas"]++
          }
          if (isFinalizedTask(taskList[i]["taskStatus"])) {
            objInFinalList["QtdFinalidas"]++
          }

        } else {
          finalList.push({
            nome: taskList[i]["userToName"],
            TipoDeTarefa: taskList[i]["taskTypeDescription"],
            QtdFinalidas: isFinalizedTask(taskList[i]["taskStatus"]) ? 1 : 0,
            QtdAbertas:!(isFinalizedTask(taskList[i]["taskStatus"])) ? 1 : 0
          })
        }
      }
      return finalList

    } catch (error) {
      console.log(error)
    }
  }

  async resumo(statusTasks) {
    const listaTecnicos = await this.technicalList();
    const tarefas = [];

    for (const tecnico of listaTecnicos) {
      const taskList = await this.taskList(tecnico.userID, statusTasks);
      if (taskList.length) {
        tarefas.push(this.countTasks(taskList[0]))
          ;
      }


    }
    return tarefas.flat(Infinity);
  }



}

export default new AcompanhamentoTecnicos();


 