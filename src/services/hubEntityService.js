import hubEntityRepository from "../repositories/hubEntityRepository.js";

class HubEntityService {
  async listEntities({ refresh = "auto", limit = 100, offset = 0, search = "" } = {}) {
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
      hubEntityRepository.listEntities({ limit, offset, search }),
      hubEntityRepository.countEntities({ search })
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
}

export default new HubEntityService();
