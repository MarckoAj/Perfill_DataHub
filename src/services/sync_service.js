import glpiTickets from "./glpi_service.js";
import ticketRepository from "../repositories/ticketRepository.js";
import glpiUrlBuilder from "../utils/glpiUrlBuilder.js";
import glpi_client from "../integrations/glpi_client.js";

class SyncService {
  constructor() {
    this.batchSize = 1000;
  }

  /**
   * Realiza a sincronização completa de um status específico (ex: fechado)
   */
  async syncStatus(statusName) {
    console.log(`Iniciando sincronização do status: ${statusName}`);
    
    // 1. Pega o total de registros via header Content-Range
    const statusId = glpiTickets.glpiTicketStatus[statusName];
    const endPoint = glpiUrlBuilder.requestGlpiEndpointByStatus(statusId);
    
    // Faz uma pequena requisição só para pegar o total
    const result = await glpi_client.glpiRequestData(endPoint, "GET");
    // O total é gerenciado pelo glpi_client e retornado no objeto (se o client fosse modificado para isso)
    // Como o client atual retorna apenas .data, vamos usar o motor de busca sequencial
    
    let currentRange = 0;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      console.log(`Buscando tickets ${currentRange} a ${currentRange + this.batchSize}...`);
      
      // Construir endpoint com range customizado
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
}

export default new SyncService();
