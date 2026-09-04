import express from "express";
import {
  assignHubEntityOperationalTag,
  getHubEntityDetails,
  createManualHubPhysicalStatus,
  listHubEntities,
  createHubOperationalTag,
  createHubOperationalTagAlias,
  confirmGlpiHubMatching,
  confirmSingleGlpiHubMatching,
  listHubOperationalTags,
  previewHubOperationalTags,
  removeHubOperationalTagAlias,
  removeHubOperationalTag,
  unassignHubEntityOperationalTag,
  updateHubOperationalTag,
  previewGlpiHubMatching,
  previewSingleGlpiHubMatching
} from "../controllers/hubEntityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/entities", listHubEntities);
router.get("/tags", listHubOperationalTags);
router.post("/tags", createHubOperationalTag);
router.post("/tags/preview", previewHubOperationalTags);
router.put("/tags/:tagId", updateHubOperationalTag);
router.delete("/tags/:tagId", removeHubOperationalTag);
router.post("/tags/:tagId/aliases", createHubOperationalTagAlias);
router.delete("/tag-aliases/:aliasId", removeHubOperationalTagAlias);
router.get("/matching/glpi/preview", previewGlpiHubMatching);
router.post("/matching/glpi/confirm", confirmGlpiHubMatching);
router.get("/entities/:entityId/matching/glpi/preview", previewSingleGlpiHubMatching);
router.post("/entities/:entityId/matching/glpi/confirm", confirmSingleGlpiHubMatching);
router.post("/entities/:entityId/physical-status/manual", createManualHubPhysicalStatus);
router.post("/entities/:entityId/tags", assignHubEntityOperationalTag);
router.delete("/entities/:entityId/tags/:tagId", unassignHubEntityOperationalTag);
router.get("/entities/:entityId", getHubEntityDetails);

export default router;
