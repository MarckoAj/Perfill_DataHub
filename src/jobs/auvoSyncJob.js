import cron from "node-cron";
import auvoSyncService from "../services/auvoSyncService.js";
import logger from "../logger.js";

import { CronExpressionParser } from "cron-parser";
import systemStatusService from "../services/systemStatusService.js";

export default function setupAuvoSyncJob() {
    // Roda a cada 2 horas por padrão, expansível futuramente via dotenv
    const schedule = process.env.AUVO_SYNC_CRON || "0 */2 * * *";
    
    // Calcula a primeira carga
    try {
        const interval = CronExpressionParser.parse(schedule);
        systemStatusService.setNextAuvoRun(interval.next().toDate().toISOString());
    } catch (e) { }

    cron.schedule(schedule, async () => {
        logger.info("[AuvoSyncJob] ⏰ Disparando Sincronização Automática do AUVO em Background...");
        
        // Verifica se já não existe uma rodando (O próprio controller recusa manual, mas aqui tentamos igual)
        if (auvoSyncService.syncState.status === 'RUNNING' || auvoSyncService.syncState.status === 'SYNCING') {
             logger.warn("[AuvoSyncJob] ⚠ Sincronização cancelada: Já existe uma fila em andamento!");
             return;
        }

        try {
            // Invoca a entidade pai (null dispara allEntities por default no SyncService)
            await auvoSyncService.runQueue(null);
            logger.info("[AuvoSyncJob] ✅ Sincronização do AUVO finalizada neste ciclo.");
        } catch (error) {
            logger.error(`[AuvoSyncJob] ❌ Erro não tratado na rotina temporizada: ${error.message}`);
        } finally {
            // Calcula o próximo e salva
            try {
                const interval = CronExpressionParser.parse(schedule);
                systemStatusService.setNextAuvoRun(interval.next().toDate().toISOString());
            } catch (e) { }
        }
    });

    logger.info(`✅ Auvo Sync temporizado (Agendado: ${schedule})`);
}
