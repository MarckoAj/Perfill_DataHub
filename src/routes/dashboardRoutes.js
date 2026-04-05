import express from "express";
import dashboardController from "../controllers/dashboardController.js";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/dashboard/auvo", dashboardController.getAuvoData);
dashboardRoutes.get("/dashboard/glpi", dashboardController.getGlpiData);

export default dashboardRoutes;
