import express from "express";
import cors from "cors";
import biRoutes from "../routes/biRoutes.js";
import routes from "../routes/routes.js";
import authRoutes from "../routes/authRoutes.js";
import healthRoutes from "../routes/healthRoutes.js";
import apiHealthRoutes from "../routes/healthRoutes.js";
import integrationRoutes from "../routes/integrationRoutes.js";
import notFoundHandler from "../shared/errors/notFoundHandler.js";
import errorHandler from "../shared/errors/errorHandler.js";
import auvoRoutes from "../routes/auvoRoutes.js";
import glpiRoutes from "../routes/glpiRoutes.js";
import systemRoutes from "../routes/systemRoutes.js";
import scheduleRoutes from "../routes/scheduleRoutes.js";
import dashboardRoutes from "../routes/dashboardRoutes.js";

import { fileURLToPath } from "url";
import path from "path";

const customExpress = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/bi", biRoutes);
  app.use("/api/health", apiHealthRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/auvo", auvoRoutes);
  app.use("/api/glpi", glpiRoutes);
  app.use("/api/system", systemRoutes);
  app.use("/api/schedules", scheduleRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", routes);
  app.use("/health-check", healthRoutes); // Movido da raiz para evitar conflito

  // --- Rotas de Frontend (Amigáveis) ---
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const publicPath = path.resolve(__dirname, "../../public");
  
  app.get("/noc", (req, res) => res.sendFile(path.join(publicPath, "video_wall_v2.html")));
  app.get("/alerts", (req, res) => res.sendFile(path.join(publicPath, "alerts.html")));
  app.get("/tickets", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
  app.get("/admin/sync", (req, res) => res.sendFile(path.join(publicPath, "sync.html")));

  app.use("/", express.static("public")); // Fallback para arquivos estáticos

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default customExpress;
