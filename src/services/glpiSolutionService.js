import he from "he";
import glpi_client from "../integrations/glpi/glpiClient.js";
import glpiSolutionRepository from "../repositories/glpi/glpiSolutionRepository.js";

class GlpiSolutionService {
  constructor() {
    this.solutionTypeCache = new Map();
    this.userCache = new Map();
  }

  cleanContent(content) {
    if (!content) return null;

    return he
      .decode(String(content))
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null;
  }

  extractTicketId(solution, fallbackTicketId) {
    const rawTicketId = solution.items_id;
    const numericFromRaw = parseInt(rawTicketId, 10);
    return numericFromRaw || Number(fallbackTicketId);
  }

  normalizeSolution(solution, ticketId) {
    return {
      id: solution.id,
      tickets_id: this.extractTicketId(solution, ticketId),
      solutiontypes_id: solution.solutiontypes_id || null,
      solutiontype_name: solution.solutiontype_name || null,
      content: this.cleanContent(solution.content),
      date_creation: solution.date_creation || null,
      date_mod: solution.date_mod || null,
      date_approval: solution.date_approval || null,
      users_id: solution.users_id || null,
      user_name: solution.user_name || null,
      status: solution.status ?? null,
    };
  }

  async getSolutionTypeName(solutionTypeId) {
    if (!solutionTypeId) return null;
    const cacheKey = String(solutionTypeId);
    const numericId = Number(cacheKey);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      this.solutionTypeCache.set(cacheKey, null);
      return null;
    }

    if (this.solutionTypeCache.has(cacheKey)) {
      return this.solutionTypeCache.get(cacheKey);
    }

    try {
      const result = await glpi_client.glpiRequestData(
        "SolutionType",
        "GET",
        null,
        solutionTypeId,
        { suppressErrorLog: true }
      );
      const name = result?.data?.name || null;
      this.solutionTypeCache.set(cacheKey, name);
      return name;
    } catch {
      this.solutionTypeCache.set(cacheKey, null);
      return null;
    }
  }

  async getUserName(userId) {
    if (!userId) return null;
    const cacheKey = String(userId);

    if (this.userCache.has(cacheKey)) {
      return this.userCache.get(cacheKey);
    }

    try {
      const result = await glpi_client.glpiRequestData("User", "GET", null, userId);
      const name = result?.data?.name || null;
      this.userCache.set(cacheKey, name);
      return name;
    } catch {
      this.userCache.set(cacheKey, null);
      return null;
    }
  }

  async normalizeSolutions(solutions, fallbackTicketId = null) {
    const normalizedSolutions = [];

    for (const solution of solutions) {
      const normalized = this.normalizeSolution(solution, fallbackTicketId);
      normalized.solutiontype_name = await this.getSolutionTypeName(solution.solutiontypes_id);
      normalized.user_name = await this.getUserName(solution.users_id);
      normalizedSolutions.push(normalized);
    }

    return normalizedSolutions;
  }

  async syncSolutionsForTicket(ticketId) {
    if (!ticketId) {
      return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    }

    const endpoint = `Ticket/${ticketId}/ITILSolution?range=0-50`;
    const result = await glpi_client.glpiRequestData(endpoint, "GET");
    const dataPayload = result?.data;
    const solutionsArray = Array.isArray(dataPayload)
      ? dataPayload
      : Array.isArray(dataPayload?.data)
        ? dataPayload.data
        : [];

    if (solutionsArray.length === 0) {
      return { inserts: 0, updates: 0, skips: 1, errors: 0, errorLogs: [] };
    }

    const normalizedSolutions = await this.normalizeSolutions(solutionsArray, ticketId);

    return glpiSolutionRepository.upsertBatch(normalizedSolutions);
  }

  async syncAllSolutions({ batchSize = 1000 } = {}) {
    const totals = { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    let currentRange = 0;
    let hasMore = true;

    while (hasMore) {
      const rangeEnd = currentRange + batchSize - 1;
      const endpoint = `ITILSolution?sort=date_mod&order=DESC&range=${currentRange}-${rangeEnd}`;
      const result = await glpi_client.glpiRequestData(endpoint, "GET");
      const dataPayload = result?.data;
      const solutionsArray = Array.isArray(dataPayload)
        ? dataPayload
        : Array.isArray(dataPayload?.data)
          ? dataPayload.data
          : [];

      if (solutionsArray.length === 0) {
        break;
      }

      const normalizedSolutions = await this.normalizeSolutions(solutionsArray);
      const metrics = await glpiSolutionRepository.upsertBatch(normalizedSolutions);

      totals.inserts += metrics.inserts || 0;
      totals.updates += metrics.updates || 0;
      totals.skips += metrics.skips || 0;
      totals.errors += metrics.errors || 0;
      totals.errorLogs.push(...(metrics.errorLogs || []));

      if (solutionsArray.length < batchSize) {
        hasMore = false;
      } else {
        currentRange += solutionsArray.length;
      }
    }

    return totals;
  }

  async syncRecentSolutions(limit = 1000) {
    const endpoint = `ITILSolution?sort=date_mod&order=DESC&range=0-${limit}`;
    const result = await glpi_client.glpiRequestData(endpoint, "GET");
    const dataPayload = result?.data;
    const solutionsArray = Array.isArray(dataPayload)
      ? dataPayload
      : Array.isArray(dataPayload?.data)
        ? dataPayload.data
        : [];

    if (solutionsArray.length === 0) {
      return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    }

    const normalizedSolutions = await this.normalizeSolutions(solutionsArray);
    return glpiSolutionRepository.upsertBatch(normalizedSolutions);
  }

  async syncSolutionsForClosedTickets({ limit = null } = {}) {
    const ticketIds = await glpiSolutionRepository.getClosedTicketIds({ limit });
    const totals = { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };

    for (const ticketId of ticketIds) {
      try {
        const metrics = await this.syncSolutionsForTicket(ticketId);
        totals.inserts += metrics.inserts || 0;
        totals.updates += metrics.updates || 0;
        totals.skips += metrics.skips || 0;
        totals.errors += metrics.errors || 0;
        totals.errorLogs.push(...(metrics.errorLogs || []));
      } catch (error) {
        totals.errors++;
        totals.errorLogs.push({
          entityName: "glpi_itilsolutions",
          entityId: ticketId,
          message: error.message,
        });
      }
    }

    return totals;
  }
}

export default new GlpiSolutionService();
