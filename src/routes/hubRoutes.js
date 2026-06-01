import express from "express";
import { listHubEntities } from "../controllers/hubEntityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/entities", listHubEntities);

export default router;
