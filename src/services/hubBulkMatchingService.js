import { randomUUID } from 'node:crypto';
import repository from '../repositories/hubMatchingRepository.js';
import matching from './hubMatchingService.js';
import tags from './hubOperationalTagService.js';

const active = state => ['PREPARING', 'RUNNING'].includes(state.status);
const nextTurn = () => new Promise(resolve => setImmediate(resolve));

// State belongs to this server process, like the manual synchronization queues.
export class HubBulkMatchingService {
  constructor(dependencies = {}) {
    this.repository = dependencies.repository || repository;
    this.matching = dependencies.matching || matching;
    this.tags = dependencies.tags || tags;
    this.state = { status: 'IDLE', total: 0, processed: 0, confirmed: 0, skipped: 0, failed: 0, conflictsExcluded: 0, errors: [] };
  }

  getStatus() { return structuredClone({ ...this.state, active: active(this.state) }); }

  start(confirmedBy = 'admin_panel') {
    if (active(this.state)) return { started: false, ...this.getStatus() };
    this.state = { runId: randomUUID(), status: 'PREPARING', total: 0, processed: 0,
      confirmed: 0, skipped: 0, failed: 0, conflictsExcluded: 0, errors: [],
      startedAt: new Date().toISOString(), finishedAt: null, current: null };
    this.completion = nextTurn().then(() => this.run(confirmedBy));
    return { started: true, ...this.getStatus() };
  }

  async run(confirmedBy) {
    try {
      const [entities, rawDevices, operationalTags] = await Promise.all([
        this.repository.listHubAuvoEntities(), this.repository.listGlpiDevices(), this.tags.listTags()
      ]);
      const devices = rawDevices.map(device => ({ ...device, deviceCode: this.matching.extractDeviceCode(device.name) }));
      const byId = new Map();
      const byCode = new Map();
      for (const device of devices) {
        for (const [map, key] of [[byId, device.auvoCustomerId], [byCode, device.deviceCode]]) {
          if (!key) continue;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(device);
        }
      }
      const claims = new Map();
      const eligible = new Map();
      for (let index = 0; index < entities.length; index += 1) {
        const entity = entities[index];
        if (entity.alreadyLinked) continue;
        const code = this.matching.extractDeviceCode(entity.auvoName || entity.hubName);
        const preview = this.matching.resolvePreview({ entity, devicesByAuvoId: byId,
          devices: byCode.get(code) || [], mode: 'both', operationalTags });
        const namePreview = this.matching.resolvePreview({ entity, devicesByAuvoId: byId,
          devices: byCode.get(code) || [], mode: 'name', operationalTags });
        const allCandidates = [...preview.candidates, ...namePreview.candidates];
        for (const candidate of allCandidates) {
          const key = String(candidate.glpiDeviceId);
          if (!claims.has(key)) claims.set(key, new Set());
          claims.get(key).add(String(entity.entityId));
        }
        const nameConflict = namePreview.status === 'ambiguo' || namePreview.candidates.some(candidate =>
          candidate.score >= 90 && String(candidate.glpiDeviceId) !== String(preview.glpiDeviceId));
        if (preview.score === 100 && preview.canAutoConfirm && !preview.requiresManualReview && preview.candidates.length === 1 && !nameConflict) {
          eligible.set(String(entity.entityId), { entityId: entity.entityId, glpiDeviceId: preview.glpiDeviceId });
        }
        if (index % 100 === 0) await nextTurn();
      }
      const items = [...eligible.values()].filter(item => claims.get(String(item.glpiDeviceId))?.size === 1);
      this.state.conflictsExcluded = eligible.size - items.length;
      this.state.total = items.length;
      this.state.status = 'RUNNING';
      for (const item of items) {
        this.state.current = item;
        try {
          const result = await this.matching.confirmSingleGlpiMatch({ ...item, matchMode: 'both',
            confirmedBy, allowManualReview: false, requireExactMatch: true });
          if (result.status === 'confirmed') this.state.confirmed += 1;
          else {
            this.state.skipped += 1;
            this.record(item, result.message || result.status);
          }
        } catch (error) {
          this.state.failed += 1;
          this.record(item, 'Falha ao gravar vínculo. Consulte o log do servidor.');
          console.error('[HUB bulk matching]', item, error);
        }
        this.state.processed += 1;
        await nextTurn();
      }
      this.state.status = this.state.failed ? 'PARTIAL' : 'COMPLETED';
    } catch (error) {
      this.state.status = 'FAILED';
      this.record(null, 'Falha ao preparar os candidatos. Tente novamente.');
      console.error('[HUB bulk matching preparation]', error);
    } finally {
      this.state.current = null;
      this.state.finishedAt = new Date().toISOString();
    }
  }

  record(item, message) {
    if (this.state.errors.length < 100) this.state.errors.push({ ...item, message });
  }
}

export default new HubBulkMatchingService();
