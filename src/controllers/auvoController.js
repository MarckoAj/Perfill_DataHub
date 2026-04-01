import asyncHandler from "../utils/asyncHandler.js";
import auvoSyncService from "../services/auvoSyncService.js";
import auvoTaskRepository from "../repositories/auvo/auvoTaskRepository.js";
import syncLogRepository from "../repositories/syncLogRepository.js";

export const syncAuvoManual = asyncHandler(async (req, res) => {
    const { entities, startDate, endDate } = req.body || {}; 
    
    // Roda em BG
    try {
        await auvoSyncService.runQueue(entities, startDate, endDate);
    } catch(e) {
        if (e.message.includes("já está em andamento")) {
             return res.status(409).json({ success: false, message: e.message });
        }
        console.error("RunQueue Failed: ", e.message);
    }
    
    res.status(202).json({
        success: true,
        message: "Sincronização de entidades AUVO enfileirada com sucesso!",
        timestamp: new Date().toISOString()
    });
});

export const getAuvoSyncStatus = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        status: auvoSyncService.syncState,
        timestamp: new Date().toISOString()
    });
});

export const controlAuvoSync = asyncHandler(async (req, res) => {
    const { action } = req.body;
    const result = auvoSyncService.controlSync(action);
    res.status(200).json({ success: true, status: result });
});

export const getAuvoStats = asyncHandler(async (req, res) => {
    const stats = await auvoTaskRepository.getGlobalAuvoStats();
    res.status(200).json({ success: true, stats });
});

export const getAuvoSyncLogs = asyncHandler(async (req, res) => {
    const { historyId } = req.params;
    const logs = await syncLogRepository.getHistoryLogs(historyId);
    res.status(200).json({ success: true, logs });
});
