import cron from "node-cron";
import pool from "../database/connection.js";
import logger from "../utils/logger.js";

async function runAuvoRetentionPurge() {
    logger.info("[AuvoRetentionJob] Iniciando verificação de registros marcados para exclusão (Soft Delete)...");

    const tablesToPurge = [
        'tasks_auvo',
        'customers_auvo',
        'users_auvo',
        'segments_auvo',
        'groups_auvo',
        'questionnaires_auvo',
        'tasks_types_auvo'
    ];

    let totalPurged = 0;

    for (const table of tablesToPurge) {
        try {
            const query = `
                DELETE FROM ${table} 
                WHERE isActive = 0 
                AND deletedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
            `;
            const [result] = await pool.query(query);
            
            if (result.affectedRows > 0) {
                logger.info(`[AuvoRetentionJob] ${result.affectedRows} registros expurgados fisicamente da tabela ${table}.`);
                totalPurged += result.affectedRows;
            }
        } catch (error) {
            logger.error(`[AuvoRetentionJob] Erro ao aplicar purge na tabela ${table}: ${error.message}`);
        }
    }

    if (totalPurged === 0) {
        logger.info("[AuvoRetentionJob] Nenhum registro elegível para expurgo hoje.");
    } else {
        logger.info(`[AuvoRetentionJob] Finalizado. Total de registros definitivamente excluídos: ${totalPurged}`);
    }
}

// Agendado para rodar todos os dias às 03:00 da manhã
export function setupAuvoRetentionJob() {
    cron.schedule("0 3 * * *", () => {
        runAuvoRetentionPurge();
    });
    logger.info("Auvo Retention Purge Job (Soft Delete) configurado (03:00 AM).");
}
