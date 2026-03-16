import express from "express";
import {
  getTicketsByStatus,
  getAlertsForApi,
} from "../controllers/glpiController.js";


import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/tickets/:status", getTicketsByStatus);
router.get("/alerts", getAlertsForApi);

export default router;