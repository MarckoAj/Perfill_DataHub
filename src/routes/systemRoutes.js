import { Router } from "express";
import systemStatusService from "../services/systemStatusService.js";

const routes = Router();

routes.get("/status", (req, res) => {
  res.json(systemStatusService.getStatus());
});

export default routes;
