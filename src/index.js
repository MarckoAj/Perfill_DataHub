import startServer from "./app/server.js";

startServer().catch((error) => {
  console.error("Falha ao inicializar o servidor:", error);
  process.exit(1);
});




