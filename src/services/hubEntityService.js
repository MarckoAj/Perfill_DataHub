import hubEntityRepository from "../repositories/hubEntityRepository.js";
import hubOperationalTagService from "./hubOperationalTagService.js";

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

    const normalizedIncludeTags = this.normalizeTagList(includeTags);
    let normalizedExcludeTags = this.normalizeTagList(excludeTags, null);

    if (normalizedExcludeTags === null) {
      const defaultHiddenTags = await hubOperationalTagService.listTags();
      normalizedExcludeTags = defaultHiddenTags
        .filter(tag => tag.hideByDefault)
        .map(tag => tag.normalizedLabel);
    }

    const [entities, total] = await Promise.all([
      hubEntityRepository.listEntities({
        limit,
        offset,
        search,
        includeTags: normalizedIncludeTags,
        excludeTags: normalizedExcludeTags
      }),
      hubEntityRepository.countEntities({
        search,
        includeTags: normalizedIncludeTags,
        excludeTags: normalizedExcludeTags
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
