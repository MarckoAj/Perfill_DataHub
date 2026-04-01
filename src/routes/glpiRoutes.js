import express from "express";
import {
    syncGlpiManual,
    getGlpiSyncStatus,
    controlGlpiSync,
    getGlpiStats,
    getGlpiSyncLogs
} from "../controllers/glpiController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Ações de Sincronização (Sem middleware no momento para faciliatar chamadas pelo browser/painel local se necessário)
router.post("/sync", syncGlpiManual);
router.get("/sync/status", getGlpiSyncStatus);
router.post("/sync/control", controlGlpiSync);
router.get("/sync/logs/:historyId", getGlpiSyncLogs);
router.get("/stats", getGlpiStats);

export default router;
