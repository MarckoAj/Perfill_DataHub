import hubEntityRepository from "../repositories/hubEntityRepository.js";

class HubEntityService {
  async listEntities({ refresh = "auto", limit = 100, offset = 0 } = {}) {
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
      hubEntityRepository.listEntities({ limit, offset }),
      hubEntityRepository.countEntities()
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
}

export default new HubEntityService();
