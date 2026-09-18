// Expand only after the 06-014 pilot has been validated.
export const GLPI_HISTORY_PILOT = Object.freeze({ entityId: 12130, deviceId: 4412 });
export const GLPI_HISTORY_TTL_MS = 5 * 60 * 1000;
export const GLPI_HISTORY_RETRY_MS = 60 * 1000;

// The current shared API token cannot establish individual information access.
// Replace this policy with verified server-side permissions when RBAC is added.
export function canReadPrivateGlpiInteractions() {
  return false;
}
