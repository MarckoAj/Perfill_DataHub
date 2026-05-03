import dotenv from "dotenv";
import { runMigrations } from "../database/migrations.js";
import dynamicScheduler from "../jobs/dynamicScheduler.js";
import buildExpressApp from "./express.js";
import alertBroadcaster from "../websocket/alertBroadcaster.js";

dotenv.config();

export default async function startServer() {
  const app = buildExpressApp();
  await runMigrations();
  dynamicScheduler.startManager();

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });

  // Inicializa o servidor WebSocket
  alertBroadcaster.init(server);
}
