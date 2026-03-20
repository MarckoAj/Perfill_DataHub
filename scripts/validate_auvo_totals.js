import pool from "../src/database/connection.js";
import auvoClient from "../src/integrations/auvo/auvoClient.js";

async function getLocalCount(tableName) {
  try {
    const [rows] = await pool.query(`SELECT COUNT(1) AS total FROM \`${tableName}\``);
    return rows[0].total;
  } catch (err) {
    console.error(`Erro ao consultar tabela ${tableName}:`, err.message);
    return 0;
  }
}

async function getAuvoTotal(endpoint, params = {}) {
  try {
    if (endpoint === "taskTypes") {
      const resComplete = await auvoClient.getTaskTypesComplete(params);
      return resComplete?.result?.entityList?.length || 0;
    }

    const response = await auvoClient.request(`/${endpoint}?pageSize=1`, "GET", params);
    if (!response) return 0;

    // As vezes a API retorna na raiz
    if (response.pagedSearchReturnData && typeof response.pagedSearchReturnData.totalItems === 'number') {
      return response.pagedSearchReturnData.totalItems;
    }
    // As vezes retorna no result
    if (response.result && response.result.pagedSearchReturnData && typeof response.result.pagedSearchReturnData.totalItems === 'number') {
      return response.result.pagedSearchReturnData.totalItems;
    }
    // Entidades sem paginacao retornam Array puro ou Array em 'result'
    if (Array.isArray(response)) {
      return response.length;
    }
    if (response.result && Array.isArray(response.result)) {
      return response.result.length;
    }

    return 0;
  } catch (err) {
    console.error(`Erro ao consultar API do AUVO para ${endpoint}:`, err.message);
    return 0;
  }
}

async function validateEntity(name, endpoint, tableName, customParams = {}) {
  process.stdout.write(`\nVerificando [${name}]... `);

  const totalAuvo = await getAuvoTotal(endpoint, customParams);
  const totalLocal = await getLocalCount(tableName);

  const diff = totalLocal - totalAuvo;
  const status = diff === 0 ? "✅ [ OK ]" : "❌ [ ERRO ]";

  console.log(`\n    -> Banco Local (${tableName}): ${totalLocal}`);
  console.log(`    -> API AUVO  (${endpoint}): ${totalAuvo}`);
  console.log(`    -> Diferença: ${diff} | Status: ${status}`);

  return { name, diff, status };
}

async function run() {
  console.log("==========================================");
  console.log(" 🔍 INICIANDO AUDITORIA DE DADOS AUVO 🔍");
  console.log("==========================================");

  const validations = [];

  validations.push(await validateEntity("Usuários", "users", "users_auvo"));
  validations.push(await validateEntity("Segmentos", "segments", "segments_auvo"));
  validations.push(await validateEntity("Grupos", "customerGroups", "groups_auvo"));
  validations.push(await validateEntity("Clientes", "customers", "customers_auvo"));
  validations.push(await validateEntity("Questionários", "questionnaires", "questionnaires_auvo"));
  validations.push(await validateEntity("Tipos de Tarefa", "taskTypes", "tasks_types_auvo"));
  // Tarefas excluídas conforme pedido

  console.log("\n==========================================");
  console.log(" 📊 RESUMO FINAL DA AUDITORIA 📊");
  console.log("==========================================");
  validations.forEach(v => {
    console.log(`${v.status} - ${v.name} (Diferença: ${v.diff})`);
  });

  process.exit(0);
}

run();
