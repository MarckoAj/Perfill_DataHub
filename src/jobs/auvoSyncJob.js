import cron from "node-cron";
import auvoSyncService from "../services/auvoSyncService.js";
import logger from "../logger.js";

export default function setupAuvoSyncJob() {
    // Roda a cada 2 horas por padrão, expansível futuramente via dotenv
    const schedule = process.env.AUVO_SYNC_CRON || "0 */2 * * *";
    
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
        }
    });

    logger.info(`✅ Auvo Sync temporizado (Agendado: ${schedule})`);
}
