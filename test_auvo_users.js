import auvoClient from "./src/integrations/auvo/auvoClient.js";

async function run() {
  console.log("=== INICIANDO TESTE USUARIOS ===");
  const r = await auvoClient.getApiList("users");
  console.log("=== RESPOSTA DA API ===");
  const list = r?.result?.entityList || r?.result || [];
  if (list.length > 0) {
    console.log("CHAVES DO PRIMEIRO USUÁRIO:", Object.keys(list[0]));
    console.log("EXEMPLO:", list[0]);
  } else {
    console.log("Nenhum usuário retornado.");
  }
}

run().catch(e => console.error("Erro no teste:", e));
