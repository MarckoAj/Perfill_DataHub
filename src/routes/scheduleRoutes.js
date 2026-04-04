import { Router } from "express";
import scheduleController from "../controllers/scheduleController.js";

const routes = Router();

routes.get("/", scheduleController.index);
routes.post("/", scheduleController.store);
routes.put("/:id", scheduleController.update);
routes.delete("/:id", scheduleController.destroy);
routes.post("/trigger", scheduleController.triggerManual);

export default routes;
