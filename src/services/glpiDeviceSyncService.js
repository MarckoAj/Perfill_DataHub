import glpiClient from "../integrations/glpi/glpiClient.js";
import hubEntityRepository from "../repositories/hubEntityRepository.js";

class GlpiDeviceSyncService {
  constructor() {
    this.batchSize = 1000;
  }

  buildPeripheralSearchEndpoint(start, end) {
    const params = new URLSearchParams({
      range: `${start}-${end}`,
      sort: "2",
      order: "ASC",
      reset: "reset"
    });

    [2, 1, 8, 3].forEach((fieldId, index) => {
      params.set(`forcedisplay[${index}]`, String(fieldId));
    });

    return `search/Peripheral?${params.toString()}`;
  }

  extractField(row, keys) {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== null && value !== undefined && value !== "") return value;
    }
    return null;
  }

  parseInteger(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = parseInt(String(value).replace(/\D+/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  mapPeripheral(row) {
    const deviceId = this.parseInteger(this.extractField(row, ["2", "id", "ID"]));
    if (!deviceId) return null;

    const device = { deviceId, rawJson: { search: row } };
    for (const [field, keys, numeric] of [
      ['name', ['1','name','Name','Nome'], false],
      ['auvoCustomerId', ['8','contact_num','Peripheral.contact_num'], true],
      ['locationName', ['3','3_display','locationName'], false]
    ]) {
      if (keys.some(key => Object.hasOwn(row, key))) {
        const value = this.extractField(row, keys);
        device[field] = numeric ? this.parseInteger(value) : value;
      }
    }
    return device;
  }

  async syncDeviceDetails(deviceId) {
    const read = async (type, id) => {
      const data = (await glpiClient.glpiRequestData(type, 'GET', undefined, Number(id)))?.data;
      if (!data || Number(data.id) !== Number(id)) throw new Error(`GLPI: resposta inválida de ${type}/${id}`);
      return data;
    };
    const peripheral = await read('Peripheral', deviceId);
    const device = { deviceId: Number(deviceId), rawJson: { peripheral } };
    for (const [source, target] of [['name','name'],['contact_num','auvoCustomerId'],
      ['locations_id','locationId'],['comment','comments']]) {
      if (Object.hasOwn(peripheral, source)) device[target] = source.endsWith('_id') || source === 'contact_num'
        ? (Number(peripheral[source]) || null) : peripheral[source];
    }
    const catalogs = [
      ['states_id','State','status'], ['peripheraltypes_id','PeripheralType','deviceType'],
      ['manufacturers_id','Manufacturer','manufacturer'], ['peripheralmodels_id','PeripheralModel','model'],
      ['users_id_tech','User','hardwareTechnician'], ['groups_id_tech','Group','cicom'],
      ['users_id','User','userName']
    ];
    device.rawJson.catalogs = {};
    for (const [foreignKey, type, field] of catalogs) {
      if (!Object.hasOwn(peripheral, foreignKey)) continue;
      const id = Number(peripheral[foreignKey]);
      if (!id) { device[field] = null; continue; }
      const item = await read(type, id);
      device.rawJson.catalogs[field] = { type, id };
      device[field] = type === 'User'
        ? [item.firstname, item.realname].filter(Boolean).join(' ') || item.name || null
        : item.completename || item.name || null;
    }
    if (Object.hasOwn(peripheral, 'locations_id')) {
      const location = device.locationId ? await read('Location', device.locationId) : null;
      device.rawJson.location = location;
      device.locationName = location?.completename || location?.name || null;
      for (const key of ['latitude','longitude']) {
        if (!location || Object.hasOwn(location, key)) {
          const value = location?.[key];
          device[key] = value === null || value === undefined || value === '' ? null : Number(value);
          if (device[key] !== null && !Number.isFinite(device[key])) throw new Error('GLPI: coordenada inválida');
        }
      }
    }
    // Persist only after every required related record has been validated.
    await hubEntityRepository.upsertGlpiDevice(device);
    return device;
  }

  getTotalFromHeaders(headers) {
    if (!headers || typeof headers.get !== "function") return null;
    const rangeHeader = headers.get("content-range") || headers.get("Content-Range");
    if (!rangeHeader) return null;
    const match = rangeHeader.match(/\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  extractRows(response) {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  }

  getTotalFromResponse(response) {
    const bodyTotal = response?.data?.totalcount;
    if (Number.isFinite(Number(bodyTotal))) return Number(bodyTotal);
    return this.getTotalFromHeaders(response?.headers);
  }

  async syncAllDevices({ onProgress = null } = {}) {
    let currentRange = 0;
    let totalProcessed = 0;
    let totalTarget = null;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const endpoint = this.buildPeripheralSearchEndpoint(currentRange, currentRange + this.batchSize);
      const response = await glpiClient.glpiRequestData(endpoint);
      const rows = this.extractRows(response);

      if (totalTarget === null) {
        totalTarget = this.getTotalFromResponse(response);
      }

      if (rows.length === 0) break;

      page += 1;
      let batchProcessed = 0;

      for (const row of rows) {
        const device = this.mapPeripheral(row);
        if (!device) continue;
        await hubEntityRepository.upsertGlpiDevice(device);
        batchProcessed += 1;
      }

      totalProcessed += batchProcessed;

      if (onProgress) {
        await onProgress({
          count: totalProcessed,
          page,
          targetCount: totalTarget || totalProcessed,
          totalPages: totalTarget ? Math.ceil(totalTarget / this.batchSize) : "?"
        });
      }

      if (rows.length < this.batchSize) {
        hasMore = false;
      } else {
        currentRange += rows.length;
      }
    }

    // Detailed collection remains restricted to the approved pilot. No fleet-wide N+1 calls.
    await this.syncDeviceDetails(4412);

    return {
      inserts: 0,
      updates: totalProcessed,
      skips: 0,
      errors: 0,
      deletes: 0,
      processed: totalProcessed,
      targetCount: totalTarget || totalProcessed
    };
  }
}

export default new GlpiDeviceSyncService();
