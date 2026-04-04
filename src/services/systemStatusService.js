class SystemStatusService {
  constructor() {
    this.nextAuvoRun = null;
    this.nextGlpiRun = null;
    this.isSyncing = false;
    this.currentEntity = null; // 'AUVO', 'GLPI' ou null
  }

  setNextAuvoRun(date) {
    this.nextAuvoRun = date;
  }

  setNextGlpiRun(date) {
    this.nextGlpiRun = date;
  }

  setSyncing(isSyncing, entity = null) {
    this.isSyncing = isSyncing;
    this.currentEntity = isSyncing ? entity : null;
  }

  getStatus() {
    return {
      isSyncing: this.isSyncing,
      currentEntity: this.currentEntity,
      nextAuvoRun: this.nextAuvoRun,
      nextGlpiRun: this.nextGlpiRun
    };
  }
}

export default new SystemStatusService();
