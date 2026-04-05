import glpi_client from "../integrations/glpi/glpiClient.js";
import glpiTicketTaskRepository from "../repositories/glpi/glpiTicketTaskRepository.js";

class GlpiTicketTaskService {
  async syncRecentTasks(limit = 1000) {
    try {
      // Pega as últimas 1000 tarefas alteradas globalmente.
      // Em um ambiente com poucas alterações, 1000 cobre dias/meses tranquilamente em cada sync.
      const url = `TicketTask?sort=date_mod&order=DESC&range=0-${limit}`;
      const result = await glpi_client.glpiRequestData(url, "GET");

      const dataPayload = result?.data;
      let tasksArray = null;

      if (Array.isArray(dataPayload)) {
          tasksArray = dataPayload;
      } else if (dataPayload && Array.isArray(dataPayload.data)) {
          tasksArray = dataPayload.data;
      }

      if (!tasksArray || tasksArray.length === 0) {
          return { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
      }

      // Remapeamento rapido das strings sujas
      const cleanTasks = tasksArray.map(task => {
         let cleanContent = task.content || "";
         
         // Tradução nativa que o Grafana fazia via REGEXP_REPLACE (&#60; para <, etc)
         cleanContent = cleanContent
            .replace(/&#60;/g, "<")
            .replace(/&#62;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"');
            
         // Remove tags HTML remanescentes
         cleanContent = cleanContent.replace(/<[^>]*>/g, "").trim();

         return {
            id: task.id,
            tickets_id: task.tickets_id,
            users_id: task.users_id,
            nomeAutor: null, // Pode ser preenchido se ligarmos com a cache de usuários
            date_creation: task.date_creation,
            date_mod: task.date_mod,
            begin: task.begin,
            end: task.end,
            content: cleanContent
         };
      });

      return await glpiTicketTaskRepository.upsertBatch(cleanTasks);
    } catch (e) {
       console.error("Erro no Service de Tarefas GLPI:", e.message);
       throw e;
    }
  }
}

export default new GlpiTicketTaskService();
