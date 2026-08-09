import asyncHandler from "../utils/asyncHandler.js";
import hubEntityService from "../services/hubEntityService.js";

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
