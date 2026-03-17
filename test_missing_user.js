import syncTasksService from "./src/core/tasks/syncTasksService.js";

async function run() {
  const pool = (await import("./src/database/connection.js")).default;

  // ID de um usuário conhecido que veio da API do AUVO (ex: Adilton)
  const TEST_USER_ID = 170009; 

  console.log(`[Teste] Deletando usuário ${TEST_USER_ID} do banco para forçar resgate...`);
  await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
  await pool.query("DELETE FROM users_auvo WHERE userId = ?", [TEST_USER_ID]);
  await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

  const mockTask = {
    id: 99912345,
    idUserFrom: TEST_USER_ID, // Deve disparar o resgate
    idUserTo: TEST_USER_ID,
    customerId: null,
    taskType: null
  };

  console.log("\n=== EXECUTANDO VALIDAÇÃO DE ENTIDADES ===");
  await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
  await syncTasksService.validateAndInsertMissingEntities(mockTask);
  await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

  console.log("\n[Teste] Verificando se o usuário voltou para o banco...");
  const [rows] = await pool.query("SELECT userId, name FROM users_auvo WHERE userId = ?", [TEST_USER_ID]);

  if (rows.length > 0) {
    console.log(`✅ SUCESSO! Usuário '${rows[0].name}' (${rows[0].userId}) resgatado via API e gravado no banco.`);
  } else {
    console.log("❌ FALHA! Usuário não foi inserido no banco.");
  }

  process.exit(0);
}

run().catch(e => {
  console.error("Erro no teste:", e);
  process.exit(1);
});
