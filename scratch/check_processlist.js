// scratch/check_processlist.js - Diagnóstico de locks ativos no MySQL

import pool from "../src/database/connection.js";

async function run() {
  try {
    console.log('============ PROCESSLIST DO MYSQL ============');
    const [rows] = await pool.query('SHOW FULL PROCESSLIST');
    console.table(rows.map(r => ({
      Id: r.Id,
      User: r.User,
      Host: r.Host,
      db: r.db,
      Command: r.Command,
      Time: r.Time,
      State: r.State,
      Info: r.Info ? r.Info.substring(0, 100) : 'NULL'
    })));
    console.log('==============================================');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao ler processlist:', err);
    process.exit(1);
  }
}

run();
