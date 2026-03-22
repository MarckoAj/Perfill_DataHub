import express from "express";
import { syncAuvoManual, getAuvoSyncStatus, controlAuvoSync, getAuvoStats } from "../controllers/auvoController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Temporariamente desabilitado para o painel
// router.use(authMiddleware);

router.post("/sync", syncAuvoManual);
router.post("/sync/control", controlAuvoSync);
router.get("/sync/status", getAuvoSyncStatus);
router.get("/stats", getAuvoStats);

export default router;
