import auvoClient from "../../integrations/auvo/auvoClient.js";
import taskRepository from "./taskRepository.js";

class SyncTasksService {
  constructor() {
    this.batchSize = 1000;
  }

  // ---- Ingestão Failsafe (Validations) de Estruturas Faltantes ----

  async validateAndInsertMissingEntities(task) {
    const { idUserFrom, idUserTo, customerId, taskType } = task;

    // 1. Valida User From (Técnico originador)
    if (idUserFrom && !(await taskRepository.checkEntityExists("users_auvo", "userId", idUserFrom))) {
      const response = await auvoClient.getAuvoEntity("users", idUserFrom);
      if (response && response.result) {
        // Para simplificar, poderíamos ter um userRepositoryAuvo. Para agora, salvamos na tabela se necessário.
        console.log(`[AuvoSync] Usuário originador ${idUserFrom} não encontrado, buscando...`);
      }
    }

    // 2. Valida User To (Técnico atribuído)
    if (idUserTo && !(await taskRepository.checkEntityExists("users_auvo", "userId", idUserTo))) {
      const response = await auvoClient.getAuvoEntity("users", idUserTo);
      if (response && response.result) {
         console.log(`[AuvoSync] Usuário destino ${idUserTo} não encontrado, buscando...`);
      }
    }

    // 3. Valida Cliente
    if (customerId && !(await taskRepository.checkEntityExists("customers_auvo", "customerId", customerId))) {
      const response = await auvoClient.getAuvoEntity("customers", customerId);
      if (response && response.result) {
         console.log(`[AuvoSync] Cliente ${customerId} não encontrado, buscando...`);
         await taskRepository.upsertCustomers([response.result]);
      }
    }
  }

  // ---- Ingestão e Sync de Tarefas ----

  async syncCustomers() {
     console.log("Iniciando sincronização de Clientes AUVO...");
     const response = await auvoClient.getCustomers();
     const customers = response?.result;

     if (customers && customers.length > 0) {
        await taskRepository.upsertCustomers(customers);
        console.log(`Sincronizados ${customers.length} Clientes AUVO.`);
     }
  }

  async syncTasks(startDate, endDate) {
    console.log("Iniciando sincronização de Tarefas AUVO...");
    
    // Sincroniza Clientes primeiro para evitar quebras de Foreign Key
    await this.syncCustomers();

    const params = {};
    if (startDate) params.dateStart = startDate;
    if (endDate) params.dateEnd = endDate;

    const response = await auvoClient.getTasks(params);
    const tasks = response?.result;

    if (!tasks || tasks.length === 0) {
      console.log("Nenhuma tarefa encontrada no período para o AUVO.");
      return;
    }

    console.log(`Buscando integridade para ${tasks.length} tarefas...`);

    for (const t of tasks) {
        await this.validateAndInsertMissingEntities(t);
    }

    await taskRepository.upsertTasks(tasks);
    console.log(`Sincronização de ${tasks.length} Tarefas AUVO concluída.`);
  }
}

export default new SyncTasksService();
