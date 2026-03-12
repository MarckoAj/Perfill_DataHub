import express from "express";
import { getTicketsForBi } from "../controllers/glpiController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/tickets", getTicketsForBi);

export default router;
