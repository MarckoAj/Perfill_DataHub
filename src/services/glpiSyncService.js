import glpiTickets from "../services/glpi_service.js";
import glpiTicketRepository from "../repositories/glpi/glpiTicketRepository.js";
import glpiRawRepository from "../repositories/glpi/glpiRawRepository.js";
import glpiUrlBuilder from "../utils/glpiUrlBuilder.js";
import glpiClient from "../integrations/glpi/glpiClient.js";
import alertEngine from "./alertEngine.js";
import alertRepository from "../repositories/alertRepository.js";
import syncLogRepository from "../repositories/syncLogRepository.js";
import systemStatusService from "./systemStatusService.js";

class GlpiSyncService {
  constructor() {
    this.batchSize = 1000;
    this.syncState = {
      status: 'IDLE',
      message: 'Aguardando ação...',
      historyId: null,
      entities: []
    };
  }

  async _checkPause() {
    while (this.syncState.status === 'PAUSED') {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  _setEntityState(id, props) {
      const idx = this.syncState.entities.findIndex(e => e.id === id);
      if (idx !== -1) {
          this.syncState.entities[idx] = { ...this.syncState.entities[idx], ...props };
      }
  }

  async syncStatus(statusName) {
    console.log(`Iniciando sincronização do status: ${statusName}`);
    this._setEntityState(statusName, { status: 'SYNCING' });

    const statusId = glpiTickets.glpiTicketStatus[statusName];
    // Se não tiver statusId formal (exs: "atrasado"), a logic default usa endpoint de ticktes abertos, mas o map já devolve a flag.
    const endPoint = statusId ? glpiUrlBuilder.requestGlpiEndpointByStatus(statusId) : glpiUrlBuilder.requestGlpiEndpointByStatus(1);

    let currentRange = 0;
    let hasMore = true;
    let totalSynced = 0;
    let page = 0;

    while (hasMore) {
      await this._checkPause();
      if (this.syncState.status === 'CANCELED') {
         this._setEntityState(statusName, { status: 'CANCELED' });
         break;
      }

      console.log(`Buscando tickets ${currentRange} a ${currentRange + this.batchSize}...`);

      // Obter o endpoint base pelo builder (ele constrói a URL massiva do atrasado "status 7" corretamente)
      let baseEndPoint = statusId 
         ? glpiUrlBuilder.requestGlpiEndpointByStatus(statusId) 
         : `search/Ticket?criteria[0][field]=12&criteria[0][searchtype]=notequals&criteria[0][value]=6`;
      
      // Limpa os ranges default e injeta a páginação real da engine
      baseEndPoint = baseEndPoint.replace(/&range=[0-9]+-[0-9]+/g, '');
      const rangeString = `range=${currentRange}-${currentRange + this.batchSize}`;
      const rangeEndPoint = baseEndPoint.includes('?') ? `${baseEndPoint}&${rangeString}` : `${baseEndPoint}?${rangeString}`;
      
      let { processedTickets, rawTickets, headers } = await glpiTickets.getTicketsByStatusFromDirectEndpoint(rangeEndPoint);
      
      let discoveredTargetCount = '?';
      if (headers && typeof headers.get === 'function') {
          const rangeHeader = headers.get('content-range') || headers.get('Content-Range');
          if (rangeHeader) {
              const match = rangeHeader.match(/\/(\d+)/);
              if (match && match[1]) discoveredTargetCount = parseInt(match[1], 10);
          }
      }
      
      if (statusName === 'atrasado' && processedTickets && processedTickets.length > 0) {
          processedTickets = processedTickets.map(ticket => ({ ...ticket, isAtrasado: true }));
      }
 
      if (!processedTickets || processedTickets.length === 0) {
        hasMore = false;
        break;
      }

      page++;

      // 1. Salvar na Camada RAW
      await glpiRawRepository.insertRawTickets(rawTickets);
      
      // 2. Salvar na Camada Normalizada
      const batchMetrics = await glpiTicketRepository.upsertTickets(processedTickets);

      if (batchMetrics.errorLogs && batchMetrics.errorLogs.length > 0 && this.syncState.historyId) {
          await syncLogRepository.insertLogs(this.syncState.historyId, batchMetrics.errorLogs);
      }

      const alertSummary = alertEngine.processTickets(processedTickets);
      await alertRepository.upsertActiveAlerts(alertSummary.active);
      await alertRepository.closeAlerts(alertSummary.closed);
 
      totalSynced += processedTickets.length;
      console.log(`Sincronizados ${totalSynced} tickets.`);

      const currentEntity = this.syncState.entities.find(e => e.id === statusName);
      if (currentEntity && currentEntity.deltas) {
          const newDeltas = { ...currentEntity.deltas };
          newDeltas.inserts += batchMetrics.inserts || 0;
          newDeltas.updates += batchMetrics.updates || 0;
          newDeltas.errors += batchMetrics.errors || 0;
          
          const finalTargetCount = discoveredTargetCount !== '?' ? discoveredTargetCount : currentEntity.targetCount;
          const finalTotalPages = finalTargetCount !== '?' ? Math.ceil(finalTargetCount / this.batchSize) : '?';
          
          this._setEntityState(statusName, { 
             count: totalSynced, 
             page: page, 
             targetCount: finalTargetCount,
             totalPages: finalTotalPages,
             deltas: newDeltas 
          });
      }

      if (processedTickets.length < this.batchSize) {
        hasMore = false;
      } else {
        currentRange += processedTickets.length;
      }
    }

    if (this.syncState.status !== 'CANCELED') {
       this._setEntityState(statusName, { status: 'DONE', count: totalSynced, page: page });
       await glpiTicketRepository.updateLastSyncDate(statusName);
       console.log(`Sincronização de ${statusName} finalizada com sucesso!`);
    }
  }

  async runQueue(entitiesToSync = null, filters = null, originDesc = 'Gatilho Manual') {
      if (this.syncState.status === 'RUNNING' || this.syncState.status === 'PAUSED') {
          throw new Error("Uma fila já está em andamento ou pausada.");
      }

      this.syncState.status = 'RUNNING';
      this.syncState.message = "Verificando fila GLPI...";
      this.syncState.origin = originDesc;
      systemStatusService.setSyncing(true, 'GLPI', null, originDesc);
      
      try {
          const allEntities = [
             { id: 'novo', label: 'Tickets novos' },
             { id: 'planejado', label: 'Tickets planejados' },
             { id: 'atribuido', label: 'Tickets atribuídos' },
             { id: 'solucionado', label: 'Tickets solucionados' },
             { id: 'atrasado', label: 'Tickets atrasados' },
             { id: 'pendente', label: 'Tickets pendentes' },
             { id: 'fechado', label: 'Tickets fechados' }
          ];

          let modifiedEntities = allEntities;
          if (filters && filters.excludeStatus) {
             modifiedEntities = modifiedEntities.filter(e => !filters.excludeStatus.includes(e.id));
          }
          if (filters && filters.includeStatus) {
             modifiedEntities = modifiedEntities.filter(e => filters.includeStatus.includes(e.id));
          }

          const toProcess = entitiesToSync && entitiesToSync.length > 0 
              ? modifiedEntities.filter(e => entitiesToSync.includes(e.id))
              : modifiedEntities;

          this.syncState.historyId = await syncLogRepository.createHistory('GLPI');

          this.syncState.entities = toProcess.map(e => ({
              ...e,
              status: 'PENDING',
              page: 0,
              count: 0,
              targetCount: '?',
              deltas: { inserts: 0, updates: 0, skips: 0, errors: 0, deletes: 0 }
          }));
          for (const ent of toProcess) {
              await this._checkPause();
              if (this.syncState.status === 'CANCELED') break;
              
              this.syncState.message = `Sincronizando ${ent.label}...`;
              
              if (ent.id === 'atrasado') {
                  this._setEntityState(ent.id, { status: 'SYNCING' });
                  await glpiTicketRepository.resetAtrasadoFlags();
                  await this.syncStatus("atrasado"); 
              } else {
                  await this.syncStatus(ent.id);
              }
          }
      } catch (e) {
         if (this.syncState.status !== 'CANCELED') {
             this.syncState.status = 'ERROR';
             this.syncState.message = `Falha Crítica: ${e.message}`;
         }
      } finally {
          let totalProcessed = 0;
          let totalErrors = 0;
          this.syncState.entities.forEach(e => {
              if (this.syncState.status === 'CANCELED' && (e.status === 'SYNCING' || e.status === 'PENDING')) {
                  e.status = 'CANCELED';
              }
              if (e.deltas) {
                  totalProcessed += (e.deltas.inserts + e.deltas.updates + e.deltas.skips);
                  totalErrors += e.deltas.errors;
              }
          });

          if (this.syncState.status !== 'CANCELED' && this.syncState.status !== 'ERROR') {
              this.syncState.status = totalErrors > 0 ? 'PARTIAL' : 'COMPLETED';
              this.syncState.message = totalErrors > 0 ? "Finalizada com falhas parciais!" : "Fila finalizada com sucesso!";
          }

          if (this.syncState.historyId) {
             const hStatus = this.syncState.status === 'PARTIAL' ? 'PARTIAL' : (this.syncState.status === 'ERROR' ? 'ERROR' : (this.syncState.status === 'CANCELED' ? 'CANCELED' : 'SUCCESS'));
             await syncLogRepository.updateHistory(this.syncState.historyId, hStatus, totalProcessed, totalErrors);
          }
          
          systemStatusService.setSyncing(false);
      }
  }

  controlSync(action) {
      if (action === 'pause' && this.syncState.status === 'RUNNING') {
          this.syncState.status = 'PAUSED';
          this.syncState.message = "Sincronização Pausada.";
      } else if (action === 'resume' && this.syncState.status === 'PAUSED') {
          this.syncState.status = 'RUNNING';
          this.syncState.message = "Retomando sincronização...";
      } else if (action === 'cancel') {
          this.syncState.status = 'CANCELED';
          this.syncState.message = "Sincronização Abortada pelo Usuário.";
      } else if (action === 'reset') {
          this.syncState.status = 'IDLE';
          this.syncState.message = "Aguardando ação...";
          this.syncState.entities = [];
      }
      return this.syncState;
  }

  async syncAll() {
      // Alias para legacy background jobs
      return this.runQueue(["novo", "atribuido", "planejado", "pendente", "solucionado", "fechado", "atrasado"]);
  }
}

export default new GlpiSyncService();
