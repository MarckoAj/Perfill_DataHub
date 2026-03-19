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
         console.log(`[AuvoSync] Usuário originador ${idUserFrom} não encontrado na listagem geral. Cadastrando...`);
         await taskRepository.upsertUsers([response.result]);
      }
    }

    // 2. Valida User To (Técnico atribuído)
    if (idUserTo && !(await taskRepository.checkEntityExists("users_auvo", "userId", idUserTo))) {
      const response = await auvoClient.getAuvoEntity("users", idUserTo);
      if (response && response.result) {
         console.log(`[AuvoSync] Usuário destino ${idUserTo} não encontrado na listagem geral. Cadastrando...`);
         await taskRepository.upsertUsers([response.result]);
      }
    }

    // 3. Valida Cliente
    if (customerId && !(await taskRepository.checkEntityExists("customers_auvo", "customerId", customerId))) {
      const response = await auvoClient.getAuvoEntity("customers", customerId);
      if (response && response.result) {
         console.log(`[AuvoSync] Cliente ${customerId} não encontrado. Cadastrando...`);
         await taskRepository.upsertCustomers([response.result]);
      }
    }
  }

  // ---- Ingestão e Sync de Tarefas ----

  async syncUsers() {
    const pool = (await import("../../database/connection.js")).default;
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    try {
      const response = await auvoClient.getApiListComplete("users");
      const users = response?.result?.entityList || response?.result || [];
      if (users.length > 0) {
        await taskRepository.upsertUsers(users);
        console.log(`Sincronizados ${users.length} Usuários AUVO.`);
      }
    } finally {
      await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    }
  }

  async syncSegments() {
    const response = await auvoClient.getApiListComplete("segments");
    const segments = response?.result?.entityList || response?.result || [];
    if (segments.length > 0) {
      await taskRepository.upsertSegments(segments);
      console.log(`Sincronizados ${segments.length} Segmentos AUVO.`);
    }
  }

  async syncGroups() {
    const response = await auvoClient.getApiListComplete("customerGroups");
    const groups = response?.result?.entityList || response?.result || [];
    if (groups.length > 0) {
      await taskRepository.upsertGroups(groups);
      console.log(`Sincronizados ${groups.length} Grupos AUVO.`);
    }
  }

  async syncCustomers() {
     const pool = (await import("../../database/connection.js")).default;
     
     // Desativa FK checks para carga massiva de staging de dados
     await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

     try {
       await this.syncSegments();
       await this.syncGroups();
       
       console.log("Iniciando sincronização de Clientes AUVO...");
     let page = 1;
     let hasNextPage = true;
     let totalCount = 0;

     while (hasNextPage) {
       console.log(`Buscando Clientes AUVO - Página ${page}...`);
       const response = await auvoClient.getCustomers({ page });
       const result = response?.result;
       const customers = result?.entityList || [];

       if (customers.length > 0) {
          await taskRepository.saveRawData("raw_auvo_customers", customers);
          await taskRepository.upsertCustomers(customers);
          totalCount += customers.length;
       }

       const links = result?.links || [];
       hasNextPage = links.some(e => e.rel === "nextPage");
       
       if (hasNextPage) {
         page++;
       }
     }
     console.log(`Sincronização concluída: ${totalCount} Clientes AUVO salvos.`);
    } finally {
      await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    }
  }

  async syncTasks(startDate, endDate) {
    console.log("Iniciando sincronização de Tarefas AUVO...");
    
    // Sincroniza Clientes primeiro para evitar quebras de Foreign Key
    await this.syncCustomers();

    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    let page = 1;
    let hasNextPage = true;
    let totalCount = 0;

    while (hasNextPage) {
      const response = await auvoClient.getTasks({ ...params, page });
      const result = response?.result;
      const tasks = result?.entityList || [];

      if (tasks.length === 0 && page === 1) {
        console.log("Nenhuma tarefa encontrada no período para o AUVO.");
        return;
      }

      if (tasks.length > 0) {
         console.log(`Processando ${tasks.length} tarefas (Página ${page})...`);
         await taskRepository.saveRawData("raw_auvo_tasks", tasks);
         for (const t of tasks) {
             await this.validateAndInsertMissingEntities(t);
         }
         await taskRepository.upsertTasks(tasks);
         totalCount += tasks.length;
      }

      const links = result?.links || [];
      hasNextPage = links.some(e => e.rel === "nextPage");
      if (hasNextPage) {
        page++;
      }
    }

    console.log(`Sincronização de ${totalCount} Tarefas AUVO concluída.`);
  }

  async syncAllAuvo() {
    console.log("=== INICIANDO SINCRONIZAÇÃO GERAL AUVO ===");
    const pool = (await import("../../database/connection.js")).default;
    
    // Desativa FK checks para carga geral massiva
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

    try {
      await this.syncUsers();
      await this.syncCustomers();
      await this.syncTasks();
    } finally {
      await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    }
    
    console.log("=== SINCRONIZAÇÃO GERAL AUVO CONCLUÍDA ===");
  }
}

export default new SyncTasksService();
