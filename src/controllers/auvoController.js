import asyncHandler from "../utils/asyncHandler.js";
import auvoSyncService from "../core/sync/auvoSyncService.js";

export const syncAuvoManual = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.body; // Parametros opcionais
    
    console.log(`[AuvoController] Iniciando sincronização manual...`);
    await auvoSyncService.syncTasks(startDate, endDate);
    
    res.status(200).json({
        success: true,
        message: "Sincronização manual do AUVO executada com sucesso!",
        timestamp: new Date().toISOString()
    });
});
