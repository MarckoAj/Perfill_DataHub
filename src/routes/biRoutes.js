import express from "express";
import { getTicketsForBi, syncBiManual } from "../controllers/glpiController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// A rota de sync manual não passa pelo authMiddleware para poder ser clicável no navegador
router.get("/sync", syncBiManual);

router.use(authMiddleware);
router.get("/tickets", getTicketsForBi);

export default router;
