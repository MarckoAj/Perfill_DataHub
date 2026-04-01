import asyncHandler from "../utils/asyncHandler.js";
import glpiTickets from "../services/glpi_service.js";
import glpiTicketRepository from "../repositories/glpi/glpiTicketRepository.js";
import glpiSyncService from "../services/glpiSyncService.js";
import alertRepository from "../repositories/alertRepository.js";
import syncLogRepository from "../repositories/syncLogRepository.js";

export const getTicketsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const tickets = await glpiTickets.getTicketsByStatus(status);
  res.status(200).json(tickets);
});

export const getTicketsForBi = asyncHandler(async (req, res) => {
  const { startDate, endDate, statusGroup, limit, offset } = req.query;
  
  const tickets = await glpiTicketRepository.getAllTickets(
    startDate, 
    endDate, 
    statusGroup || 'todos', 
    parseInt(limit) || 100, 
    parseInt(offset) || 0
  );
  
  res.status(200).json(tickets);
});

export const getTicketsStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await glpiTicketRepository.getStats(startDate, endDate);
  res.status(200).json(stats);
});

export const getGlpiStats = asyncHandler(async (req, res) => {
  const stats = await glpiTicketRepository.getGlobalGlpiStats();
  res.status(200).json({ success: true, stats });
});

export const syncGlpiManual = asyncHandler(async (req, res) => {
  const { entities, startDate, endDate } = req.body || {}; 
  
  try {
      await glpiSyncService.runQueue(entities, startDate, endDate);
  } catch(e) {
      if (e.message.includes("já está em andamento")) {
           return res.status(409).json({ success: false, message: e.message });
      }
      console.error("RunQueue GLPI Failed: ", e.message);
  }
  
  res.status(202).json({
      success: true,
      message: "Sincronização de entidades GLPI enfileirada com sucesso!",
      timestamp: new Date().toISOString()
  });
});

export const getGlpiSyncStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
      success: true,
      status: glpiSyncService.syncState,
      timestamp: new Date().toISOString()
  });
});

export const controlGlpiSync = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const result = glpiSyncService.controlSync(action);
  res.status(200).json({ success: true, status: result });
});

export const getGlpiSyncLogs = asyncHandler(async (req, res) => {
  const { historyId } = req.params;
  const logs = await syncLogRepository.getHistoryLogs(historyId);
  res.status(200).json({ success: true, logs });
});

export const getAlertsForApi = asyncHandler(async (req, res) => {
  const {
    state,
    type,
    severity,
    startDate,
    endDate,
    limit,
    offset,
    page,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await alertRepository.getAlerts({
    state,
    type,
    severity,
    startDate,
    endDate,
    limit,
    offset,
    page,
    sortBy,
    sortOrder,
  });

  res.status(200).json(result);
});

export const getAlertsByTicketId = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const alerts = await alertRepository.getAlertsByTicketId(ticketId);

  res.status(200).json({
    ticketId,
    alerts,
    total: alerts.length,
  });
});
