import express from "express";
import cors from "cors";
import biRoutes from "../routes/biRoutes.js";
import routes from "../routes/routes.js";
import errorMiddleware from "../middlewares/errorMiddleware.js";
import authRoutes from "../routes/authRoutes.js";
import healthRoutes from "../routes/healthRoutes.js";

const customExpress = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static("public"));

  app.use("/api/auth", authRoutes);
  app.use("/api/bi", biRoutes);
  app.use("/api", routes);
  app.use("/", healthRoutes); // Acopla /live, /health, /ready na raiz

  app.use(errorMiddleware);

  return app;
};

export default customExpress;
