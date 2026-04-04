import pool from "../connection.js";

export async function runScheduleSeeds() {
    console.log("Iniciando Seeders de Relógios (Cron)...");

    const seeds = [
        {
            name: "auvo_sync_5m",
            query: `
                INSERT INTO sync_schedules (\`system\`, cron_expression, date_range, filters, description)
                SELECT 'AUVO', '*/5 * * * *', 'WEEK', NULL, 'Sinc. AUVO últimos 7 dias a cada 5m'
                WHERE NOT EXISTS (SELECT 1 FROM sync_schedules WHERE \`system\` = 'AUVO' AND date_range = 'WEEK')
            `
        },
        {
            name: "auvo_sync_1h",
            query: `
                INSERT INTO sync_schedules (\`system\`, cron_expression, date_range, filters, description)
                SELECT 'AUVO', '0 * * * *', 'MONTH', NULL, 'Sinc. AUVO últimos 30 dias a cada 1h'
                WHERE NOT EXISTS (SELECT 1 FROM sync_schedules WHERE \`system\` = 'AUVO' AND date_range = 'MONTH')
            `
        },
        {
            name: "auvo_sync_12h",
            query: `
                INSERT INTO sync_schedules (\`system\`, cron_expression, date_range, filters, description)
                SELECT 'AUVO', '0 */12 * * *', 'YEAR', NULL, 'Sinc. AUVO últimos 365 dias a cada 12h'
                WHERE NOT EXISTS (SELECT 1 FROM sync_schedules WHERE \`system\` = 'AUVO' AND date_range = 'YEAR')
            `
        },
        {
            name: "glpi_sync_10m",
            query: `
                INSERT INTO sync_schedules (\`system\`, cron_expression, date_range, filters, description)
                SELECT 'GLPI', '*/10 * * * *', 'FULL', '{"excludeStatus":["fechado"]}', 'Sinc. GLPI exceto fechados a cada 10m'
                WHERE NOT EXISTS (SELECT 1 FROM sync_schedules WHERE \`system\` = 'GLPI' AND description LIKE '%exceto fechados%')
            `
        },
        {
            name: "glpi_sync_6h",
            query: `
                INSERT INTO sync_schedules (\`system\`, cron_expression, date_range, filters, description)
                SELECT 'GLPI', '0 */6 * * *', 'FULL', '{"includeStatus":["fechado"]}', 'Sinc. GLPI apenas fechados a cada 6h'
                WHERE NOT EXISTS (SELECT 1 FROM sync_schedules WHERE \`system\` = 'GLPI' AND description LIKE '%apenas fechados%')
            `
        }
    ];

    for (const seed of seeds) {
        try {
            await pool.query(seed.query);
            console.log(`Seeders Crons: Inserido '${seed.name}' com sucesso.`);
        } catch (error) {
            console.error(`Erro ao rodar seed '${seed.name}':`, error.message);
        }
    }
}
