import cron from "node-cron";
import syncService from "../service/sync_service.js";

const startJobs = () => {
  // Roda todos os dias às 02:00 da madrugada
  cron.schedule("0 2 * * *", async () => {
    console.log("Iniciando rotina automática de sincronização diária...");
    try {
      await syncService.syncStatus("fechado");
      console.log("Rotina de sincronização concluída com sucesso!");
    } catch (error) {
      console.error("Erro na rotina de sincronização automática:", error);
    }
  });

  console.log("Job de sincronização automática agendado (Diário às 02:00).");
};

export default startJobs;
