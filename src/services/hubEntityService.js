import hubEntityRepository from "../repositories/hubEntityRepository.js";

class HubEntityService {
  normalizeTagList(value, defaultValue = []) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (typeof value !== "string") return defaultValue;
    if (value.trim() === "") return [];
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }

  async listEntities({
    refresh = "auto",
    limit = 100,
    offset = 0,
    search = "",
    includeTags = "",
    excludeTags = undefined
  } = {}) {
    let refreshMetrics = null;

    if (refresh === true) {
      refreshMetrics = await hubEntityRepository.refreshFromAuvoCustomers();
    } else if (refresh === "auto") {
      const sourceCount = await hubEntityRepository.countSources("AUVO", "customer");
      if (sourceCount === 0) {
        refreshMetrics = await hubEntityRepository.refreshFromAuvoCustomers();
      }
    }

    const [entities, total] = await Promise.all([
      hubEntityRepository.listEntities({
        limit,
        offset,
        search,
        includeTags: this.normalizeTagList(includeTags),
        excludeTags: this.normalizeTagList(excludeTags, ["DESINSTALADO"])
      }),
      hubEntityRepository.countEntities({
        search,
        includeTags: this.normalizeTagList(includeTags),
        excludeTags: this.normalizeTagList(excludeTags, ["DESINSTALADO"])
      })
    ]);

    return {
      entities,
      refresh: refreshMetrics,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + entities.length < total
      }
    };
  }

  async getEntityDetails(entityId) {
    return hubEntityRepository.getEntityDetails(entityId);
  }

  async createManualPhysicalStatusChange({
    entityId,
    fromStatus,
    toStatus,
    comment,
    referenceUrl,
    createdBy
  }) {
    return hubEntityRepository.createManualPhysicalStatusChange({
      entityId,
      fromStatus,
      toStatus,
      comment,
      referenceUrl,
      createdBy
    });
  }
}

export default new HubEntityService();
