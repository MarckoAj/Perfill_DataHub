import asyncHandler from "../utils/asyncHandler.js";
import glpiTickets from "../services/glpi_service.js";
import glpiTicketRepository from "../repositories/glpi/glpiTicketRepository.js";
import glpiSyncService from "../services/glpiSyncService.js";
import alertRepository from "../repositories/alertRepository.js";

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

export const syncBiManual = asyncHandler(async (req, res) => {
  // Dispara a sincronização de forma assíncrona (não prende a resposta HTTP)
  glpiSyncService.syncAll().then(() => console.log("Sincronização manual finalizada com sucesso."))
    .catch((e) => console.error("Erro na sincronização manual:", e));

  // Retorna um JSON simplificado
  res.status(200).json({
    success: true,
    message: "Sincronização Iniciada",
    detail: "A sincronização com o GLPI foi iniciada em segundo plano. Leva um curto período para as informações serem atualizadas completamente no banco de dados do BI."
  });
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
