import asyncHandler from "../utils/asyncHandler.js";
import integrationRepository from "../repositories/integrationRepository.js";

export const getIntegrationHealth = asyncHandler(async (req, res) => {
  const health = await integrationRepository.getSystemHealth();
  
  res.status(health.status === 'error' ? 503 : 200).json(health);
});

export const getGlpiStatus = asyncHandler(async (req, res) => {
  const status = await integrationRepository.getGlpiSyncStatus();
  
  res.status(200).json({
    integration: 'glpi',
    status: status.error ? 'error' : (status.last_sync ? 'connected' : 'disconnected'),
    metrics: status,
    timestamp: new Date().toISOString()
  });
});
