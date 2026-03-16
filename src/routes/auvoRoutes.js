import express from "express";
import { syncAuvoManual } from "../controllers/auvoController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 1. Aplica Autenticação em Todas as rotas do AUVO
router.use(authMiddleware);

// 2. Requisição de Sincronização Manual
router.post("/sync", syncAuvoManual);

export default router;
