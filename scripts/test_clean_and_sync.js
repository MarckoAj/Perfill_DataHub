import pool from "../src/database/connection.js";
import auvoSyncService from "../src/core/sync/auvoSyncService.js";

async function run() {
  console.log("==========================================");
  console.log(" 🧹 INICIANDO LIMPEZA DE DADOS AUVO 🧹");
  console.log("==========================================");

  try {
    // 1. Desabilita checagem de chave estrangeira
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    console.log("Limpando users_auvo...");
    await pool.query("TRUNCATE TABLE users_auvo");

    console.log("Limpando segments_auvo...");
    await pool.query("TRUNCATE TABLE segments_auvo");

    console.log("Limpando groups_auvo...");
    await pool.query("TRUNCATE TABLE groups_auvo");

    console.log("Limpando customers_auvo...");
    await pool.query("TRUNCATE TABLE customers_auvo");

    console.log("Limpando questionnaires_auvo...");
    await pool.query("TRUNCATE TABLE questionnaires_auvo");

    console.log("Limpando tasks_types_auvo...");
    await pool.query("TRUNCATE TABLE tasks_types_auvo");

    // Limpando as chaves raw associadas também para a carga ficar 100% real
    console.log("Limpando raw_auvo_customers...");
    await pool.query("TRUNCATE TABLE raw_auvo_customers");

  } catch (err) {
    console.error("Erro durante o TRUNCATE:", err.message);
  } finally {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  console.log("\n==========================================");
  console.log(" ⬇️ INICIANDO SINCRONIZAÇÃO COMPLETA ⬇️");
  console.log("==========================================");

  try {
    await auvoSyncService.syncUsers();
    await auvoSyncService.syncSegments();
    await auvoSyncService.syncGroups();
    await auvoSyncService.syncCustomers();
    await auvoSyncService.syncQuestionnaires();
    await auvoSyncService.syncTaskTypes();
    
    console.log("\n✅ Carga concluída com sucesso (Tarefas ignoradas).");
  } catch (err) {
    console.error("Erro durante a sincronização:", err.message);
  }

  process.exit(0);
}

run();
