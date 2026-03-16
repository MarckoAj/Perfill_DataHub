import relatorios from "../models/relatorio.js";
import tarefas from "../models/tarefas.js";
import path from "path";
import cron from "node-cron";
import XLSX from "xlsx";



class Planilhas {

  async writeWorkBook(relatorio, pathFile, fileName) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(relatorio);
    const filePatch = path.join(pathFile, `${fileName}.xlsx`)
    XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
    XLSX.writeFile(workbook, filePatch);
    console.log(`Arquivo "${fileName}.xlsx" salvo com sucesso!`);
  }

  async WriteReportManutencaoPreventiva() {
    const relatorio = await relatorios.relatorioPreventivas()
    // const pathFile = "C:\\Users\\Marcos\\OneDrive - Perfill Tecnologia\\VIDEO POLICIA - Arquivos de Arildo Menezes\\RELATORIOS AUVO"
    const pathFile = "../"
    const fileName = "relatorioPreventivas"
    this.writeWorkBook(relatorio, pathFile, fileName)
  }

  async WriteReportManutencao() {
    const relatorio = await tarefas.TaskListManutencao("trimestre")
    const pathFile = "../../../"
    const fileName = "relatorioTarefas"
    const unicList = relatorio.reduce((acc,curretList)=>acc.concat(curretList),[])
    this.writeWorkBook(unicList, pathFile, fileName)
  }
}



// const  main = async () => {
//   const report = new Planilhas
//  await report.WriteReportMaintenance()
//   // report.writeWorkBook()
// }

// main()

// cron.schedule("*/2 * * * *", main);
// console.log("Tarefa agendada para executar a cada 2 minutos.");

