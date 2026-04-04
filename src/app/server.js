import dotenv from "dotenv";
import { runMigrations } from "../database/migrations.js";
import dynamicScheduler from "../jobs/dynamicScheduler.js";
import buildExpressApp from "./express.js";

dotenv.config();

export default async function startServer() {
  const app = buildExpressApp();
  await runMigrations();
  dynamicScheduler.startManager();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}
