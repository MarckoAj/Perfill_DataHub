import express from "express";
import {
  getTicketsByStatus,
  getAlertsForApi,
  getAlertsByTicketId,
} from "../controllers/glpiController.js";


import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/tickets/:status", getTicketsByStatus);
router.get("/alerts", getAlertsForApi);
router.get("/alerts/:ticketId", getAlertsByTicketId);

export default router;