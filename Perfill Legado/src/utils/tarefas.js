import fetchRequest from "../api/fetchRequest.js";
import tecnico from "./acompanhamentoTecnico.js"


class Tarefas {
   async TaskList(periodo, selectedFields) {
      try{
         const completeList = []
      const tecnicoList = await tecnico.technicalList()
      for (const tecnico of tecnicoList) {
         const newList = await fetchRequest.requestListTasks(periodo, { idUserTo: tecnico.userID }, selectedFields)
         completeList.push(newList)
         
      }
      const listFiltred =  completeList.filter(item => item.length > 0);
      console.log(listFiltred)
      return listFiltred
      }catch(error){
    
      }
      
   }

   async TaskListByTecnicos(periodo) {
      const selectedFields = ["userToName", "userFromName", "customerDescription", "orientation", "creationDate", "checkOutDate", "taskStatus", "taskTypeDescription", "taskUrl", "taskType", "taskTypeDescription","externalId"]
     const listComplete = await this.TaskList(periodo, selectedFields)
      return listComplete.flat(Infinity)
   }


   async TaskListManutencao(periodo) {
      const todas_tarefas = await fetchRequest.requestListTasks(periodo, {}, "")
      const todas = todas_tarefas.reduce((acc,listaAtual)=>acc.concat(listaAtual),[]).filter(task=>{ return task.taskType !== 136913 && task.taskType !== 85233})
      return todas
   }
   
}


export default new Tarefas
