import { Router } from "express";
import pool from "../../database/connection.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "perfill-data-hub",
    timestamp: new Date().toISOString(),
  });
});

router.get("/live", (req, res) => {
  res.status(200).json({
    status: "up",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
