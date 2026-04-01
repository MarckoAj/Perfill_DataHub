import cron from "node-cron";
import syncService from "../services/sync_service.js";

import { setupAuvoRetentionJob } from "./auvoRetentionJob.js";
import setupAuvoSyncJob from "./auvoSyncJob.js";

const startJobs = () => {
  // Roda a cada 4 horas
  cron.schedule("0 */4 * * *", async () => {
    console.log("Iniciando rotina automática de sincronização diária...");
    try {
      await syncService.syncAll();
      console.log("Rotina de sincronização concluída com sucesso!");
    } catch (error) {
      console.error("Erro na rotina de sincronização automática:", error);
    }
  });
  console.log("Job de sincronização GLPI agendado (A cada 4h).");

  // AUVO - Agendadores
  setupAuvoRetentionJob();
  setupAuvoSyncJob();
};

export default startJobs;
