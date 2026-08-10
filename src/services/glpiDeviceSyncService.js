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

    return {
      deviceId,
      name: this.extractField(row, ["1", "name", "Name", "Nome"]),
      auvoCustomerId: this.parseInteger(this.extractField(row, ["8", "contact_num", "Peripheral.contact_num"])),
      locationId: null,
      locationName: this.extractField(row, ["3", "3_display", "locationName"]),
      updateSource: "glpi_peripheral_sync",
      rawJson: row
    };
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
