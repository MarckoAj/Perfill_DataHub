export async function runFullSyncJob(syncService) {
  await syncService.syncAll();
}
