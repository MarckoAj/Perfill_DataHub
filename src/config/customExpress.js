import express from "express";
import cors from "cors";
import biRoutes from "../routes/biRoutes.js";

const customExpress = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static("public"));

  app.use("/api/bi", biRoutes);
  app.use("/api", routes);

  app.use(errorMiddleware);

  return app;
};

export default customExpress;
