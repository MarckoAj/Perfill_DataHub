import express from "express";
import alertRepository from "../core/alerts/alertRepository.js";

const router = express.Router();

// 1. Live - O processo Node está rodando
router.get("/live", (req, res) => {
    return res.status(200).json({ 
        status: "UP", 
        uptime: process.uptime(), // tempo em segundos
        timestamp: new Date().toISOString(),
        message: "O processo está rodando" 
    });
});

// 2. Health - API está saudável (ping rápido)
router.get("/health", (req, res) => {
    return res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString() 
    });
});

// 3. Ready - Pronto para receber carga (verifica banco de dados)
router.get("/ready", async (req, res) => {
    try {
        // Executa uma query simples de 1 segundo para testar o pool
        await alertRepository.checkDatabaseConnection();
        
        return res.status(200).json({
            status: "READY",
            database: "CONNECTED",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("HealthCheck [Ready] falhou:", error.message);
        return res.status(503).json({
            status: "DOWN",
            database: "DISCONNECTED",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
