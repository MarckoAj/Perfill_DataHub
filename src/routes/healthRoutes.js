import express from "express";
import alertRepository from "../repositories/alertRepository.js";

const router = express.Router();

router.get("/", (req, res) => {
    return res.status(200).json({ 
        status: "ok", 
        service: "perfill-data-hub",
        timestamp: new Date().toISOString() 
    });
});

router.get("/health", (req, res) => {
    return res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString() 
    });
});

router.get("/live", (req, res) => {
    return res.status(200).json({ 
        status: "UP", 
        uptime: process.uptime(), // tempo em segundos
        timestamp: new Date().toISOString(),
        message: "O processo está rodando" 
    });
});

router.get("/ready", async (req, res, next) => {
    try {
        await alertRepository.checkDatabaseConnection();
        return res.status(200).json({
            status: "READY",
            database: "CONNECTED",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(503).json({
            status: "DOWN",
            database: "DISCONNECTED",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const summary = await alertRepository.getSummary();
    res.status(200).json({
      status: "ok",
      alerts: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
