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
  app.use("/", healthRoutes); // Acopla /live, /health, /ready na raiz
  app.use("/panel", express.static("public")); // Micro-frontend desacoplado (UI)

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default customExpress;
