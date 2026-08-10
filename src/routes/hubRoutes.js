import express from "express";
import {
  getHubEntityDetails,
  listHubEntities,
  createHubOperationalTag,
  confirmGlpiHubMatching,
  confirmSingleGlpiHubMatching,
  listHubOperationalTags,
  removeHubOperationalTag,
  previewGlpiHubMatching,
  previewSingleGlpiHubMatching
} from "../controllers/hubEntityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/entities", listHubEntities);
router.get("/tags", listHubOperationalTags);
router.post("/tags", createHubOperationalTag);
router.delete("/tags/:tagId", removeHubOperationalTag);
router.get("/matching/glpi/preview", previewGlpiHubMatching);
router.post("/matching/glpi/confirm", confirmGlpiHubMatching);
router.get("/entities/:entityId/matching/glpi/preview", previewSingleGlpiHubMatching);
router.post("/entities/:entityId/matching/glpi/confirm", confirmSingleGlpiHubMatching);
router.get("/entities/:entityId", getHubEntityDetails);

export default router;
