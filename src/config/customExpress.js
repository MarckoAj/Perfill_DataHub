import express from "express";
import cors from "cors";
import biRoutes from "../routes/biRoutes.js";
import routes from "../routes/routes.js";
import authRoutes from "../routes/authRoutes.js";
import healthRoutes from "../routes/healthRoutes.js";
import apiHealthRoutes from "../api/routes/health.routes.js";
import integrationRoutes from "../routes/integrationRoutes.js";
import notFoundHandler from "../shared/errors/notFoundHandler.js";
import errorHandler from "../shared/errors/errorHandler.js";
import auvoRoutes from "../routes/auvoRoutes.js";

const customExpress = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/bi", biRoutes);
  app.use("/api/health", apiHealthRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/auvo", auvoRoutes);
  app.use("/api", routes);
  app.use("/", healthRoutes); // Acopla /live, /health, /ready na raiz

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default customExpress;
