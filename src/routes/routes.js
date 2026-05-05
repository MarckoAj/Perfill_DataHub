import express from "express";
import {
  getTicketsByStatus,
  getAlertsForApi,
  getAlertsByTicketId,
  justifyAlert,
} from "../controllers/glpiController.js";

import { getInternalTasks } from "../controllers/taskController.js";


import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/tickets/:status", getTicketsByStatus);
router.get("/alerts", getAlertsForApi);
router.get("/alerts/:ticketId", getAlertsByTicketId);
router.post("/alerts/:id/justify", justifyAlert);
router.get("/internal/tasks", getInternalTasks);

export default router;