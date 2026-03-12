import express from "express";
import {
  getTicketsByStatus,
} from "../controllers/glpiController.js";


import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/tickets/:status", getTicketsByStatus);

export default router;