import glpiTickets from "../../services/glpi_service.js";
import ticketRepository from "./ticketRepository.js";
import glpiUrlBuilder from "../../utils/glpiUrlBuilder.js";
import glpiClient from "../../integrations/glpi/glpiClient.js";

class SyncTicketsService {
  constructor() {
    this.batchSize = 1000;
  }

  async syncStatus(statusName) {
    console.log(`Iniciando sincronização do status: ${statusName}`);

    const statusId = glpiTickets.glpiTicketStatus[statusName];
    const endPoint = glpiUrlBuilder.requestGlpiEndpointByStatus(statusId);

    await glpiClient.glpiRequestData(endPoint, "GET");

    let currentRange = 0;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      console.log(`Buscando tickets ${currentRange} a ${currentRange + this.batchSize}...`);

      const rangeEndPoint = `search/Ticket?criteria[0][field]=12&criteria[0][searchtype]=equals&criteria[0][value]=${statusId}&range=${currentRange}-${currentRange + this.batchSize}`;
      const tickets = await glpiTickets.getTicketsByStatusFromDirectEndpoint(rangeEndPoint);

      if (!tickets || tickets.length === 0) {
        hasMore = false;
        break;
      }

      await ticketRepository.upsertTickets(tickets);

      totalSynced += tickets.length;
      console.log(`Sincronizados ${totalSynced} tickets.`);

      if (tickets.length < this.batchSize) {
        hasMore = false;
      } else {
        currentRange += tickets.length;
      }
    }

    console.log(`Sincronização de ${statusName} finalizada com sucesso!`);
  }

  async syncAll() {
    const statuses = ["novo", "atribuido", "planejado", "pendente", "solucionado", "fechado"];

    for (const status of statuses) {
      await this.syncStatus(status);
    }

    await ticketRepository.resetAtrasadoFlags();
    await this.syncStatus("atrasado");
  }
}

export default new SyncTicketsService();
