import cron from "node-cron";
import syncService from "../services/sync_service.js";

const startJobs = () => {
  // Roda a cada 4 horas
  cron.schedule("0 */4 * * *", async () => {
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
