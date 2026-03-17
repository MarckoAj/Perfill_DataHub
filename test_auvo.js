import auvoClient from "./src/integrations/auvo/auvoClient.js";

async function run() {
  console.log("=== INICIANDO TESTE AUVO ===");
  const r = await auvoClient.getCustomers();
  console.log("=== RESPOSTA DA API ===");
  console.log(r);
}

run().catch(e => console.error("Erro no teste:", e));
