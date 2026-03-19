import moment from "moment";
import syncTasksService from "../src/core/tasks/syncTasksService.js";

async function run() {
  console.log("=== INICIANDO CARGA HISTÓRICA DE TAREFAS (BACKFILL) ===");
  
  const pool = (await import("../src/database/connection.js")).default;
  await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

  try {
    let current = moment("2020-01-01").startOf("month");
    const end = moment().endOf("month");

    while (current.isBefore(end)) {
      const startDate = current.clone().startOf("month").format("YYYY-MM-DDTHH:mm:ss");
      const endDate = current.clone().endOf("month").format("YYYY-MM-DDTHH:mm:ss");

      console.log(`[Backfill] Sincronizando período: ${startDate} até ${endDate}...`);
      try {
         await syncTasksService.syncTasks(startDate, endDate);
      } catch (error) {
         console.error(`[Backfill] Erro no período ${startDate} - ${endDate}:`, error.message);
      }

      current.add(1, "month");
    }
  } finally {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
  }

  console.log("=== CARGA HISTÓRICA CONCLUÍDA ===");
}

run().catch(e => console.error("Erro no Backfill:", e));
