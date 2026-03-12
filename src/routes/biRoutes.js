import express from "express";
import { getTicketsForBi } from "../controllers/glpiController.js";

const router = express.Router();

router.get("/tickets", getTicketsForBi);

export default router;
