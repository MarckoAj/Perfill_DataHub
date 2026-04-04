import cron from "node-cron";
import syncService from "../services/sync_service.js";
import { CronExpressionParser } from "cron-parser";
import systemStatusService from "../services/systemStatusService.js";

import { setupAuvoRetentionJob } from "./auvoRetentionJob.js";
import setupAuvoSyncJob from "./auvoSyncJob.js";

const startJobs = () => {
  // Roda a cada 4 horas
  const glpiSchedule = "0 */4 * * *";

  try {
      const interval = CronExpressionParser.parse(glpiSchedule);
      systemStatusService.setNextGlpiRun(interval.next().toDate().toISOString());
  } catch(e) { }

  cron.schedule(glpiSchedule, async () => {
    console.log("Iniciando rotina automática de sincronização diária...");
    try {
      await syncService.syncAll();
      console.log("Rotina de sincronização concluída com sucesso!");
    } catch (error) {
      console.error("Erro na rotina de sincronização automática:", error);
    } finally {
        try {
            const interval = CronExpressionParser.parse(glpiSchedule);
            systemStatusService.setNextGlpiRun(interval.next().toDate().toISOString());
        } catch(e) { }
    }
  });
  console.log("Job de sincronização GLPI agendado (A cada 4h).");

  // AUVO - Agendadores
  setupAuvoRetentionJob();
  setupAuvoSyncJob();
};

export default startJobs;
