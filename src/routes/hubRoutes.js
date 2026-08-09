import express from "express";
import { getHubEntityDetails, listHubEntities } from "../controllers/hubEntityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/entities", listHubEntities);
router.get("/entities/:entityId", getHubEntityDetails);

export default router;
