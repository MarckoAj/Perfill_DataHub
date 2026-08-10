import asyncHandler from "../utils/asyncHandler.js";
import hubEntityService from "../services/hubEntityService.js";
import hubMatchingService from "../services/hubMatchingService.js";

export const listHubEntities = asyncHandler(async (req, res) => {
  const refresh = req.query.refresh === "true"
    ? true
    : (req.query.refresh === "false" ? false : "auto");
  const requestedLimit = parseInt(req.query.limit, 10);
  const requestedOffset = parseInt(req.query.offset, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 100;
  const offset = Number.isInteger(requestedOffset) && requestedOffset > 0
    ? requestedOffset
    : 0;

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  const result = await hubEntityService.listEntities({ refresh, limit, offset, search });

  res.status(200).json({
    success: true,
    data: result.entities,
    meta: {
      refresh: result.refresh,
      pagination: result.pagination
    }
  });
});

export const getHubEntityDetails = asyncHandler(async (req, res) => {
  const entityId = parseInt(req.params.entityId, 10);

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return res.status(400).json({
      success: false,
      message: "entityId invalido"
    });
  }

  const entity = await hubEntityService.getEntityDetails(entityId);

  if (!entity) {
    return res.status(404).json({
      success: false,
      message: "Entidade HUB nao encontrada"
    });
  }

  res.status(200).json({
    success: true,
    data: entity
  });
});

const parseBooleanQuery = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
};

export const previewGlpiHubMatching = asyncHandler(async (req, res) => {
  const result = await hubMatchingService.previewGlpiMatching({
    mode: req.query.mode,
    search: typeof req.query.search === "string" ? req.query.search.trim() : "",
    status: typeof req.query.status === "string" ? req.query.status.trim() : "",
    sort: typeof req.query.sort === "string" ? req.query.sort.trim() : "",
    minScore: req.query.minScore,
    includeLinked: parseBooleanQuery(req.query.includeLinked, false),
    includeAmbiguous: parseBooleanQuery(req.query.includeAmbiguous, true),
    includeLowScore: parseBooleanQuery(req.query.includeLowScore, true),
    reviewQueueOnly: parseBooleanQuery(req.query.reviewQueueOnly, false),
    limit: req.query.limit,
    offset: req.query.offset
  });

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});

export const previewSingleGlpiHubMatching = asyncHandler(async (req, res) => {
  const entityId = parseInt(req.params.entityId, 10);

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return res.status(400).json({
      success: false,
      message: "entityId invalido"
    });
  }

  const result = await hubMatchingService.previewGlpiMatching({
    entityId,
    mode: req.query.mode,
    minScore: req.query.minScore,
    includeLinked: true,
    includeAmbiguous: true,
    includeLowScore: true,
    limit: 1,
    offset: 0
  });

  res.status(200).json({
    success: true,
    data: result.data[0] || null,
    meta: result.meta
  });
});

export const confirmGlpiHubMatching = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "items obrigatorio"
    });
  }

  if (items.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Limite maximo de 100 confirmacoes por lote"
    });
  }

  const result = await hubMatchingService.confirmGlpiMatches({
    items,
    confirmedBy: req.user?.username || "admin_panel"
  });

  res.status(result.failed > 0 ? 207 : 200).json(result);
});

export const confirmSingleGlpiHubMatching = asyncHandler(async (req, res) => {
  const entityId = parseInt(req.params.entityId, 10);

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return res.status(400).json({
      success: false,
      message: "entityId invalido"
    });
  }

  const result = await hubMatchingService.confirmSingleGlpiMatch({
    entityId,
    glpiDeviceId: req.body?.glpiDeviceId,
    matchMode: req.body?.matchMode,
    score: req.body?.score,
    confirmedBy: req.user?.username || "admin_panel",
    allowLowScoreManual: req.body?.reviewDecision === "manual_confirm"
  });

  res.status(result.success ? 200 : 400).json(result);
});
