import fetchRequest from "../api/fetchRequest.js";
import tarefas from "./tarefas.js";
import customDate from "./customDate.js";

const taskTypeId = {
  PreventivaPiLegado821: 95220,
  PreventivaPINovo: 96985,
  PreventivaCFTV: 41430,
  PINovoManutencao: 96440,
  RelatorioRact: 82683,
};
const status = { aberta:0, finalizada: 3 };

class GerarRelatorio {
  async getCounts(type, status) {
    const periodo = "mes";
    const counts = await Promise.all([
      fetchRequest.getAuvoList("tasks", { ...customDate.getDate(periodo), type, status: status.aberta }),
      fetchRequest.getAuvoList("tasks", { ...customDate.getDate(periodo), type, status: status.finalizada }),
      fetchRequest.getAuvoList("tasks", { ...customDate.getDate(periodo), type, })
    ]);
    const countValues = counts.map(element => (element.result?.pagedSearchReturnData.totalItems) || 0);
    const values = {
      Abertas: countValues[0],
      Finalizadas: countValues[1],
      Total: countValues[2]
    };

    return values;
  }

  async relatorioPreventivas() {
    const preventivas = [
      {
        Preventivas: "PI Legado",
        Previstas: 150,
        ...(await this.getCounts(taskTypeId.PreventivaPiLegado821, status)),
      },
      {
        Preventivas: "PI Novo",
        Previstas: 600,
        ...(await this.getCounts(taskTypeId.PreventivaPINovo, status)),
      },
      {
        Preventivas: "CFTV",
        Previstas: 326,
        ...(await this.getCounts(taskTypeId.PreventivaCFTV, status)),
      },

    ];
    preventivas.forEach(preventiva => {
      const { Finalizadas, Previstas } = preventiva;
      preventiva.PendenciaMensal = Finalizadas < Previstas ? Previstas - Finalizadas : "META MENSAL ALCANÇADA";
    });

    return preventivas;
  }

  async relatorioTarefas() {
    const listaDeTarefas = await tarefas.TaskList("mes")   
    const countObject = lista => lista.reduce((acumulador, tarefa) => {
      acumulador.tecnico = tarefa.userToName
      acumulador[tarefa.taskTypeDescription] = (acumulador[tarefa.taskTypeDescription] || 0) + 1;
      return acumulador;
    }, {});
    const list = listaDeTarefas.map(item => countObject(item[0]))
    console.log(list)
    return list
  }

}





export default new GerarRelatorio();


