import auvoClient from "../integrations/auvo/auvoClient.js";
import auvoUserRepository from "../repositories/auvo/auvoUserRepository.js";
import auvoCustomerRepository from "../repositories/auvo/auvoCustomerRepository.js";
import auvoSegmentRepository from "../repositories/auvo/auvoSegmentRepository.js";
import auvoGroupRepository from "../repositories/auvo/auvoGroupRepository.js";
import auvoTaskRepository from "../repositories/auvo/auvoTaskRepository.js";
import auvoQuestionnaireRepository from "../repositories/auvo/auvoQuestionnaireRepository.js";
import auvoTaskTypeRepository from "../repositories/auvo/auvoTaskTypeRepository.js";
import syncLogRepository from "../repositories/syncLogRepository.js";

class AuvoSyncService {
  constructor() {
    this.syncState = {
      status: 'IDLE', // IDLE, RUNNING, PAUSED, CANCELED, COMPLETED
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

  async validateTaskTypeMissingEntities(taskType) {
    const { creatorId, standardQuestionnaireId } = taskType;
    if (creatorId && !(await auvoUserRepository.exists(creatorId))) {
      const response = await auvoClient.getAuvoEntity("users", creatorId);
      if (response && response.result) await auvoUserRepository.upsertUsers([response.result], true);
    }
    if (standardQuestionnaireId && standardQuestionnaireId > 0 && !(await auvoQuestionnaireRepository.exists(standardQuestionnaireId))) {
      const response = await auvoClient.getAuvoEntity("questionnaires", standardQuestionnaireId);
      if (response && response.result) await auvoQuestionnaireRepository.upsertQuestionnaires([response.result]);
    }
  }

  async validateAndInsertMissingEntities(task) {
    const { idUserFrom, idUserTo, customerId, taskType } = task;
    if (idUserFrom && !(await auvoUserRepository.exists(idUserFrom))) {
      const response = await auvoClient.getAuvoEntity("users", idUserFrom);
      if (response && response.result) await auvoUserRepository.upsertUsers([response.result], true);
    }
    if (idUserTo && !(await auvoUserRepository.exists(idUserTo))) {
      const response = await auvoClient.getAuvoEntity("users", idUserTo);
      if (response && response.result) await auvoUserRepository.upsertUsers([response.result], true);
    }
    if (customerId && !(await auvoCustomerRepository.exists(customerId))) {
      const response = await auvoClient.getAuvoEntity("customers", customerId);
      if (response && response.result) await auvoCustomerRepository.upsertCustomers([response.result]);
    }
    if (taskType && taskType.id && !(await auvoTaskTypeRepository.exists(taskType.id))) {
      const response = await auvoClient.getAuvoEntity("taskTypes", taskType.id);
      if (response && response.result) {
         await this.validateTaskTypeMissingEntities(response.result); 
         await auvoTaskTypeRepository.upsertTaskTypes([response.result]);
      }
    }
  }

  async rawPaginatedLoop(entityId, endpointOrFetcher, repoUpsertFn, preUpsertHook = null) {
      const syncStartTime = new Date();
      let page = 1;
      let hasNextPage = true;
      let totalCount = 0;
      let targetCount = 0;
      let targetPages = 0;
      
      this._setEntityState(entityId, { status: 'SYNCING', page, totalPages: 0, count: 0, targetCount: 0 });

      while (hasNextPage) {
          await this._checkPause();
          if (this.syncState.status === 'CANCELED') throw new Error("Ação Abortada");
          
          this._setEntityState(entityId, { status: 'SYNCING', page, totalPages: targetPages, count: totalCount, targetCount });
          
          const res = typeof endpointOrFetcher === 'function' 
              ? await endpointOrFetcher(page) 
              : await auvoClient.getApiList(endpointOrFetcher, { page });
              
          if (page === 1 && res?.result) {
              targetCount = res.result.totalItems || res.result.totalElements || res.result.pagedSearchReturnData?.totalItems || 0;
              if (entityId === 'taskTypes') targetCount = 0; // BYPASS OBRIGATORIO PRO BUG DO AUVO
              targetPages = res.result.totalPages || (targetCount > 0 ? Math.ceil(targetCount / 100) : 0);
          }

          const items = Array.isArray(res?.result) ? res.result : (res?.result?.entityList || []);

          if (items.length > 0) {
              if (preUpsertHook) await preUpsertHook(items);
              const batchMetrics = await repoUpsertFn(items) || { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
              
              if (batchMetrics.errorLogs && batchMetrics.errorLogs.length > 0 && this.syncState.historyId) {
                  await syncLogRepository.insertLogs(this.syncState.historyId, batchMetrics.errorLogs);
              }
              
              const currentEntity = this.syncState.entities.find(e => e.id === entityId);
              const newDeltas = { ...currentEntity.deltas };
              newDeltas.inserts += batchMetrics.inserts || 0;
              newDeltas.updates += batchMetrics.updates || 0;
              newDeltas.skips += batchMetrics.skips || 0;
              newDeltas.errors += batchMetrics.errors || 0;

              totalCount += items.length;
              this._setEntityState(entityId, { count: totalCount, targetCount, page, totalPages: targetPages, deltas: newDeltas });
          }
          
          if (entityId === "taskTypes") {
             hasNextPage = items.length === 100;
          } else {
             const links = res?.result?.links || [];
             hasNextPage = items.length > 0 && links.some(e => e.rel === "nextPage");
          }
          
          if (hasNextPage) page++;
      }
      this._setEntityState(entityId, { status: 'DONE', count: totalCount, page, targetCount, totalPages: targetPages });
      await auvoTaskRepository.updateLastSyncDate(entityId);
      
      const map = { 'users': 'users_auvo', 'segments': 'segments_auvo', 'groups': 'groups_auvo', 'customers': 'customers_auvo', 'questionnaires': 'questionnaires_auvo', 'taskTypes': 'tasks_types_auvo' };
      if (map[entityId]) {
          const deletedCount = await auvoTaskRepository.markAsDeletedPhase(map[entityId], syncStartTime);
          const currentEntity = this.syncState.entities.find(e => e.id === entityId);
          if (currentEntity && currentEntity.deltas) {
              const newDeltas = { ...currentEntity.deltas, deletes: deletedCount || 0 };
              this._setEntityState(entityId, { deltas: newDeltas });
          }
      }
  }

  // ==== Rotinas Indivíduos ====

  async syncUsers() { await this.rawPaginatedLoop('users', 'users', items => auvoUserRepository.upsertUsers(items)); }
  async syncSegments() { await this.rawPaginatedLoop('segments', 'segments', items => auvoSegmentRepository.upsertSegments(items)); }
  async syncGroups() { await this.rawPaginatedLoop('groups', 'customerGroups', items => auvoGroupRepository.upsertGroups(items)); }
  async syncQuestionnaires() { await this.rawPaginatedLoop('questionnaires', 'questionnaires', items => auvoQuestionnaireRepository.upsertQuestionnaires(items)); }
  
  async syncTaskTypes() {
      await this.rawPaginatedLoop('taskTypes', 'taskTypes', items => auvoTaskTypeRepository.upsertTaskTypes(items), async (items) => {
          for (const t of items) await this.validateTaskTypeMissingEntities(t);
      });
  }
  
  async syncCustomers() {
      await this.rawPaginatedLoop('customers', async (page) => {
          return await auvoClient.getCustomers({ page });
      }, async items => {
          await auvoTaskRepository.saveRawData("raw_auvo_customers", items);
          return await auvoCustomerRepository.upsertCustomers(items);
      });
  }

  async syncTasks(startDate, endDate) {
      const syncStartTime = new Date();
      let page = 1;
      let hasNextPage = true;
      let totalCount = 0;
      let targetCount = 0;
      let targetPages = 0;
      
      const params = {
          startDate: startDate || "2000-01-01",
          endDate: endDate || new Date().toISOString().split('T')[0]
      };

      this._setEntityState('tasks', { status: 'SYNCING', page, totalPages: 0, count: 0, targetCount: 0 });

      while (hasNextPage) {
          await this._checkPause();
          if (this.syncState.status === 'CANCELED') throw new Error("Ação Abortada");
          
          this._setEntityState('tasks', { status: 'SYNCING', page, totalPages: targetPages, count: totalCount, targetCount });
          
          const res = await auvoClient.getTasks({ ...params, page });
          
          if (page === 1 && res?.result) {
              targetCount = res.result.totalItems || res.result.totalElements || res.result.pagedSearchReturnData?.totalItems || 0;
              targetPages = res.result.totalPages || (targetCount > 0 ? Math.ceil(targetCount / 100) : 0);
          }

          const items = res?.result?.entityList || [];

          if (items.length > 0) {
              await auvoTaskRepository.saveRawData("raw_auvo_tasks", items);
              for (const t of items) await this.validateAndInsertMissingEntities(t);
              const batchMetrics = await auvoTaskRepository.upsertTasks(items) || { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
              
              if (batchMetrics.errorLogs && batchMetrics.errorLogs.length > 0 && this.syncState.historyId) {
                  await syncLogRepository.insertLogs(this.syncState.historyId, batchMetrics.errorLogs);
              }
              
              const currentEntity = this.syncState.entities.find(e => e.id === 'tasks');
              const newDeltas = { ...currentEntity.deltas };
              newDeltas.inserts += batchMetrics.inserts || 0;
              newDeltas.updates += batchMetrics.updates || 0;
              newDeltas.skips += batchMetrics.skips || 0;
              newDeltas.errors += batchMetrics.errors || 0;
              
              totalCount += items.length;
              this._setEntityState('tasks', { count: totalCount, targetCount, page, totalPages: targetPages, deltas: newDeltas });
          }

          const links = res?.result?.links || [];
          hasNextPage = items.length > 0 && links.some(e => e.rel === "nextPage");
          if (hasNextPage) page++;
      }
      this._setEntityState('tasks', { status: 'DONE', count: totalCount, page, targetCount, totalPages: targetPages });
      await auvoTaskRepository.updateLastSyncDate('tasks');
      const deletedCount = await auvoTaskRepository.markAsDeletedPhase('tasks_auvo', syncStartTime, params.startDate, params.endDate);
      const currentEntity = this.syncState.entities.find(e => e.id === 'tasks');
      if (currentEntity && currentEntity.deltas) {
          const newDeltas = { ...currentEntity.deltas, deletes: deletedCount || 0 };
          this._setEntityState('tasks', { deltas: newDeltas });
      }
  }

  async runQueue(entitiesToSync, startDate, endDate) {
      if (this.syncState.status === 'RUNNING' || this.syncState.status === 'PAUSED') {
          throw new Error("Uma fila já está em andamento ou pausada.");
      }

      this.syncState.status = 'RUNNING';
      this.syncState.message = "Verificando fila de entidades...";
      
      const allEntities = [
         { id: 'users', label: 'Usuários' },
         { id: 'segments', label: 'Segmentos' },
         { id: 'groups', label: 'Grupos' },
         { id: 'customers', label: 'Clientes' },
         { id: 'questionnaires', label: 'Questionários' },
         { id: 'taskTypes', label: 'Tipos de Tarefa' },
         { id: 'tasks', label: 'Tarefas' },
      ];

      // Filtra e prepara
      const toProcess = entitiesToSync && entitiesToSync.length > 0 
          ? allEntities.filter(e => entitiesToSync.includes(e.id))
          : allEntities;

      this.syncState.historyId = await syncLogRepository.createHistory('AUVO');

      this.syncState.entities = toProcess.map(e => ({
          ...e,
          status: 'PENDING',
          page: 0,
          count: 0,
          deltas: { inserts: 0, updates: 0, skips: 0, errors: 0, deletes: 0 }
      }));

      await auvoTaskRepository.disableForeignKeyChecks();

      try {
          for (const ent of toProcess) {
              await this._checkPause();
              if (this.syncState.status === 'CANCELED') break;
              
              this.syncState.message = `Sincronizando ${ent.label}...`;
              
              if (ent.id === 'users') await this.syncUsers();
              if (ent.id === 'segments') await this.syncSegments();
              if (ent.id === 'groups') await this.syncGroups();
              if (ent.id === 'customers') await this.syncCustomers();
              if (ent.id === 'questionnaires') await this.syncQuestionnaires();
              if (ent.id === 'taskTypes') await this.syncTaskTypes();
              if (ent.id === 'tasks') await this.syncTasks(startDate, endDate);
          }
      } catch (e) {
         if (this.syncState.status !== 'CANCELED') {
             this.syncState.status = 'ERROR';
             this.syncState.message = `Falha Crítica: ${e.message}`;
         }
      } finally {
          await auvoTaskRepository.enableForeignKeyChecks();
          
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
}

export default new AuvoSyncService();
