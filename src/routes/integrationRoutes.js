import express from "express";
import { getIntegrationHealth, getGlpiStatus } from "../controllers/integrationController.js";

const router = express.Router();

// Endpoint consolidado de todas as integrações
router.get("/", getIntegrationHealth);

// Endpoint específico para GLPI
router.get("/glpi", getGlpiStatus);

export default router;
