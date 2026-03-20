import syncTasksService from "../src/core/tasks/syncTasksService.js";
import taskRepository from "../src/core/tasks/taskRepository.js";

async function run() {
  const step = process.argv.find(arg => arg.startsWith("--step="))?.split("=")[1] || "2";

  console.log(`\n=== INICIANDO ETAPA ${step} DO SYNC AUVO ===`);

  await taskRepository.disableForeignKeyChecks();

  try {
    if (step === "2") {
      console.log("-> Sincronizando Segmentos...");
      await syncTasksService.syncSegments();
      console.log("-> Sincronizando Grupos...");
      await syncTasksService.syncGroups();
    } else if (step === "3") {
      console.log("-> Sincronizando Clientes (e dependências)...");
      await syncTasksService.syncCustomers();
    } else if (step === "4") {
      console.log("-> Sincronizando Tarefas (Desde Janeiro 2026 até hoje)...");
      const startDate = "2026-01-01T00:00:00";
      const endDate = new Date().toISOString().substring(0, 19); // YYYY-MM-DDTHH:mm:ss
      await syncTasksService.syncTasks(startDate, endDate);
    } else {

      console.log("Etapa inválida. Use --step=2, 3 ou 4.");
    }
  } catch (error) {
    console.error(`🚨 Erro na Etapa ${step}:`, error.message);
  } finally {
    await taskRepository.enableForeignKeyChecks();
  }

  console.log(`=== ETAPA ${step} CONCLUÍDA ===\n`);
  process.exit(0);
}

run().catch(console.error);

