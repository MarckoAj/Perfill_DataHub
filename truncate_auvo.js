import pool from "./src/database/connection.js";

async function run() {
  console.log("=== LIMPANDO TABELAS AUVO ===");
  await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
  
  const tables = [
    "tasks_auvo",
    "customers_groups", 
    "customers_contacts", 
    "customers_uriAttachments", 
    "customers_emails", 
    "customers_managers",
    "customers_auvo",
    "groups_auvo",
    "segments_auvo",
    "users_auvo",
    "raw_auvo_tasks", 
    "raw_auvo_customers"
  ];
  
  for (const t of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${t}`);
      console.log(`✅ Tabela '${t}' limpa.`);
    } catch (e) {
      console.log(`⚠️ Erro ao limpar ${t}:`, e.message);
    }
  }
  
  await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("=== LIMPEZA CONCLUÍDA ===");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
