import glpi_client from "../integrations/glpi/glpiClient.js";
import glpiTicketTaskRepository from "../repositories/glpi/glpiTicketTaskRepository.js";

class GlpiTicketTaskService {
  cleanContent(content) {
    let cleanContent = content || "";

    cleanContent = cleanContent
      .replace(/&#60;/g, "<")
      .replace(/&#62;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');

    return cleanContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  normalizeTasks(tasksArray) {
    return tasksArray.map((task) => ({
      id: task.id,
      tickets_id: task.tickets_id,
      users_id: task.users_id,
      nomeAutor: null,
      date_creation: task.date_creation,
      date_mod: task.date_mod,
      begin: task.begin,
      end: task.end,
      content: this.cleanContent(task.content),
    }));
  }

  async syncRecentTasks(limit = 1000) {
    try {
      const url = `TicketTask?sort=date_mod&order=DESC&range=0-${limit}`;
      const result = await glpi_client.glpiRequestData(url, "GET");

      const dataPayload = result?.data;
      const tasksArray = Array.isArray(dataPayload)
        ? dataPayload
        : Array.isArray(dataPayload?.data)
          ? dataPayload.data
          : [];

      if (tasksArray.length === 0) {
        return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
      }

      return glpiTicketTaskRepository.upsertBatch(this.normalizeTasks(tasksArray));
    } catch (e) {
      console.error("Erro no Service de Tarefas GLPI:", e.message);
      throw e;
    }
  }

  async syncAllTasks({ batchSize = 1000 } = {}) {
    const totals = { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    let currentRange = 0;
    let hasMore = true;

    while (hasMore) {
      const rangeEnd = currentRange + batchSize - 1;
      const url = `TicketTask?sort=date_mod&order=DESC&range=${currentRange}-${rangeEnd}`;
      const result = await glpi_client.glpiRequestData(url, "GET");

      const dataPayload = result?.data;
      const tasksArray = Array.isArray(dataPayload)
        ? dataPayload
        : Array.isArray(dataPayload?.data)
          ? dataPayload.data
          : [];

      if (tasksArray.length === 0) {
        break;
      }

      const metrics = await glpiTicketTaskRepository.upsertBatch(this.normalizeTasks(tasksArray));

      totals.inserts += metrics.inserts || 0;
      totals.updates += metrics.updates || 0;
      totals.skips += metrics.skips || 0;
      totals.errors += metrics.errors || 0;
      totals.errorLogs.push(...(metrics.errorLogs || []));

      if (tasksArray.length < batchSize) {
        hasMore = false;
      } else {
        currentRange += tasksArray.length;
      }
    }

    return totals;
  }
}

export default new GlpiTicketTaskService();
