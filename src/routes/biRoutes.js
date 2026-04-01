import express from "express";
import { getTicketsForBi, syncGlpiManual, getTicketsStats } from "../controllers/glpiController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// A rota de sync manual não passa pelo authMiddleware para poder ser clicável no navegador
router.get("/sync", syncGlpiManual);
router.post("/sync", syncGlpiManual);

router.use(authMiddleware);
router.get("/tickets", getTicketsForBi);
router.get("/stats", getTicketsStats);

export default router;
