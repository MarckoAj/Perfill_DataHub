import asyncHandler from "../utils/asyncHandler.js";
import glpiTickets from "../services/glpi_service.js";
import glpiTicketRepository from "../repositories/glpi/glpiTicketRepository.js";
import glpiSyncService from "../services/glpiSyncService.js";
import alertRepository from "../repositories/alertRepository.js";
import syncLogRepository from "../repositories/syncLogRepository.js";
import ruleEngine from "../engine/RuleEngine.js";

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
  
  // Processo precisa rodar sem prender o Event Loop
  glpiSyncService.runQueue(entities, startDate, endDate).catch((e) => {
      console.error("RunQueue GLPI Failed: ", e.message);
  });
  
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

export const justifyAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { justifiedText, justifiedBy } = req.body;

  if (!justifiedText || justifiedText.trim() === '') {
    return res.status(400).json({ success: false, error: 'O texto da justificativa é obrigatório.' });
  }

  // Como o sistema usa token estático, o frontend enviará o nome do usuário logado no body
  const operator = justifiedBy || 'Operador Desconhecido';

  const result = await alertRepository.justifyAlert({
    alertId: id,
    justifiedBy: operator,
    justifiedText: justifiedText.trim()
  });

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, error: 'Alerta não encontrado ou já processado.' });
  }

  // Notifica via WebSocket para remoção em tempo real no frontend (Etapa 5)
  try {
    const [alertRow] = await alertRepository.selecTicketAlertById(id);
    if (alertRow) {
      import("../websocket/alertBroadcaster.js").then(m => {
        m.default.broadcast('ALERT_JUSTIFIED', {
          ticketId: alertRow.ticket_id,
          ruleId: alertRow.alert_type,
          justifiedBy: operator
        });
      });
    }
  } catch (wsErr) {
    console.error('[Controller] Erro ao disparar WebSocket de justificativa:', wsErr.message);
  }

  res.status(200).json({ success: true, message: 'Alerta justificado com sucesso.' });
});

/**
 * Retorna detalhes consolidados do alerta para o modal de detalhes
 */
export const getAlertDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const details = await alertRepository.getAlertFullDetails(id);
    
    if (!details) {
      return res.status(404).json({ success: false, error: 'Alerta não encontrado.' });
    }

    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('[GetAlertDetails] Erro:', error.message);
    res.status(500).json({ success: false, error: "Erro ao buscar detalhes do alerta" });
  }
});

export const getAlertRules = asyncHandler(async (req, res) => {
  // Garante que as regras estão carregadas em memória se ainda não estiverem
  if (ruleEngine.rules.length === 0) {
    await ruleEngine.loadRules();
  }

  const rulesData = ruleEngine.rules.map(rule => ({
    code: rule.code,
    name: rule.name,
    severity: rule.severity,
    description: rule.description,
    source: rule.source
  }));

  res.status(200).json({
    success: true,
    total: rulesData.length,
    rules: rulesData
  });
});
