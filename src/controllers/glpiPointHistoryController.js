import asyncHandler from '../utils/asyncHandler.js';
import service from '../services/glpiPointHistoryService.js';

const positiveId = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

export const listGlpiPointHistory = asyncHandler(async (req, res) => {
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!positiveId(req.params.entityId) || !Number.isInteger(limit) || limit < 1 || limit > 100
      || !Number.isSafeInteger(offset) || offset < 0) {
    return res.status(400).json({ success: false, message: 'Parametros de historico invalidos.' });
  }
  const data = await service.list(Number(req.params.entityId), limit, offset);
  if (!data) return res.status(404).json({ success: false, message: 'Ponto nao encontrado.' });
  res.json({ success: true, data });
});

export const getGlpiPointHistoryTicket = asyncHandler(async (req, res) => {
  if (!positiveId(req.params.entityId) || !positiveId(req.params.ticketId)) {
    return res.status(400).json({ success: false, message: 'Identificador invalido.' });
  }
  const data = await service.detail(Number(req.params.entityId), Number(req.params.ticketId));
  if (!data) return res.status(404).json({ success: false, message: 'Chamado nao vinculado a este ponto.' });
  res.json({ success: true, data });
});

export const syncGlpiPointHistory = asyncHandler(async (req, res) => {
  if (!positiveId(req.params.entityId) || (req.body?.force !== undefined && typeof req.body.force !== 'boolean')) {
    return res.status(400).json({ success: false, message: 'Parametros de sincronizacao invalidos.' });
  }
  try {
    const data = await service.syncForEntity(Number(req.params.entityId), req.body?.force === true);
    if (!data) return res.status(404).json({ success: false, message: 'Ponto fora do piloto e dos chamados compartilhados.' });
    res.json({ success: true, data });
  } catch {
    res.status(502).json({ success: false, message: 'Nao foi possivel atualizar o historico GLPI. Os dados anteriores foram preservados.' });
  }
});
