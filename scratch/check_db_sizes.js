// scratch/check_db_sizes.js - Diagnóstico de volumetria das tabelas operacionais

import pool from "../src/database/connection.js";

async function run() {
  try {
    console.log('============ VOLUMETRIA DE DADOS DATAHUB ============');
    const [[{ count: countTickets }]] = await pool.query('SELECT COUNT(*) as count FROM tickets');
    const [[{ count: countTasks }]] = await pool.query('SELECT COUNT(*) as count FROM tasks_auvo');
    const [[{ count: countTicketTasks }]] = await pool.query('SELECT COUNT(*) as count FROM glpi_tickettasks');
    const [[{ count: countAlerts }]] = await pool.query('SELECT COUNT(*) as count FROM datahub_ticket_alerts');

    console.log(`- Tabela 'tickets': ${countTickets.toLocaleString()} linhas`);
    console.log(`- Tabela 'tasks_auvo': ${countTasks.toLocaleString()} linhas`);
    console.log(`- Tabela 'glpi_tickettasks': ${countTicketTasks.toLocaleString()} linhas`);
    console.log(`- Tabela 'datahub_ticket_alerts': ${countAlerts.toLocaleString()} linhas`);
    console.log('=====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao ler volumetria:', err);
    process.exit(1);
  }
}

run();
