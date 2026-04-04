class SystemStatusService {
  constructor() {
    this.nextAuvoRun = null;
    this.nextGlpiRun = null;
    this.isSyncing = false;
    this.currentEntity = null; // 'AUVO', 'GLPI' ou null
    this.nextDesc = null;
    this.currentDesc = null;
    this.activeMotorsCount = 0;
  }

  setNextAuvoRun(date) { this.nextAuvoRun = date; }
  setNextGlpiRun(date) { this.nextGlpiRun = date; }

  setGlobalNext(desc, count) {
      this.nextDesc = desc;
      this.activeMotorsCount = count;
  }

  setSyncing(isSyncing, entity = null, desc = null) {
    this.isSyncing = isSyncing;
    this.currentEntity = isSyncing ? entity : null;
    if (desc) this.currentDesc = desc;
    if (!isSyncing) this.currentDesc = null; // reset
  }

  getStatus() {
    return {
      isSyncing: this.isSyncing,
      currentEntity: this.currentEntity,
      currentDesc: this.currentDesc,
      nextAuvoRun: this.nextAuvoRun,
      nextGlpiRun: this.nextGlpiRun,
      nextDesc: this.nextDesc,
      activeMotorsCount: this.activeMotorsCount
    };
  }
}

export default new SystemStatusService();
