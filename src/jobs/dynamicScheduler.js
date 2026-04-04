import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import scheduleRepository from "../repositories/scheduleRepository.js";
import systemStatusService from "../services/systemStatusService.js";
import auvoSyncService from "../services/auvoSyncService.js";
import glpiSyncService from "../services/glpiSyncService.js";
import { setupAuvoRetentionJob } from "./auvoRetentionJob.js";

class DynamicScheduler {
  constructor() {
    this.jobs = {}; // Guarda a referência dos jobs em memória para poder pará-los (stop)
  }

  async reloadSchedules() {
    console.log("🔄 Recarregando configurações de Cron...");
    
    // Parar todos os jobs existentes
    for (const jobId in this.jobs) {
        this.jobs[jobId].stop();
        delete this.jobs[jobId];
    }
    
    try {
        const schedules = await scheduleRepository.getActiveSchedules();
        
        // Mantem os timers preditivos
        let nextAuvo = Infinity;
        let nextGlpi = Infinity;
        let closestGlobal = Infinity;
        let closestDesc = 'Motor Padrão';
        
        for (const rule of schedules) {
            const cronStr = rule.cron_expression;
            
            try {
                const interval = CronExpressionParser.parse(cronStr);
                const predictedTime = interval.next().toDate().getTime();
                
                if (rule.system === 'AUVO' && predictedTime < nextAuvo) nextAuvo = predictedTime;
                if (rule.system === 'GLPI' && predictedTime < nextGlpi) nextGlpi = predictedTime;

                if (predictedTime < closestGlobal) {
                    closestGlobal = predictedTime;
                    closestDesc = rule.description || rule.system;
                }
            } catch (e) {
                console.error(`Erro ao fazer parse da expressao ${cronStr} do ID ${rule.id}`);
            }
            
            const jobTask = cron.schedule(cronStr, async () => {
                console.log(`[CRON ${rule.system} - Regra ID: ${rule.id}] Disparando (Range: ${rule.date_range})...`);
                await this.executeJob(rule);
                this._recalculateNextDatesSilently();
            });
            
            this.jobs[`${rule.system}_${rule.id}`] = jobTask;
        }
        
        if (nextAuvo !== Infinity) systemStatusService.setNextAuvoRun(new Date(nextAuvo).toISOString());
        if (nextGlpi !== Infinity) systemStatusService.setNextGlpiRun(new Date(nextGlpi).toISOString());
        
        systemStatusService.setGlobalNext(closestDesc, schedules.length);
        
        console.log(`✅ Foram agendadas ${schedules.length} tarefas globais dinamicamente do Banco.`);
    } catch (error) {
        console.error("❌ Falha crítica ao inicializar o motor dinâmico de crons:", error);
    }
  }
  
  async _recalculateNextDatesSilently() {
      try {
        const schedules = await scheduleRepository.getActiveSchedules();
        let nextAuvo = Infinity;
        let nextGlpi = Infinity;
        let closestGlobal = Infinity;
        let closestDesc = 'Motor Padrão';
        
        for (const rule of schedules) {
            try {
                const interval = CronExpressionParser.parse(rule.cron_expression);
                const predictedTime = interval.next().toDate().getTime();
                if (rule.system === 'AUVO' && predictedTime < nextAuvo) nextAuvo = predictedTime;
                if (rule.system === 'GLPI' && predictedTime < nextGlpi) nextGlpi = predictedTime;

                if (predictedTime < closestGlobal) {
                    closestGlobal = predictedTime;
                    closestDesc = rule.description || rule.system;
                }
            } catch (e) { }
        }
        
        if (nextAuvo !== Infinity) systemStatusService.setNextAuvoRun(new Date(nextAuvo).toISOString());
        if (nextGlpi !== Infinity) systemStatusService.setNextGlpiRun(new Date(nextGlpi).toISOString());
        
        systemStatusService.setGlobalNext(closestDesc, schedules.length);
      } catch (e) { }
  }

  getDateBoundaries(rangeEnum) {
      if (!rangeEnum || rangeEnum === 'FULL') {
          return { startDate: "2000-01-01", endDate: new Date().toISOString().split('T')[0] };
      }
      
      const hoje = new Date();
      let dStart = new Date();
      
      if (rangeEnum === 'WEEK') {
          dStart.setDate(hoje.getDate() - 7);
      } else if (rangeEnum === 'MONTH') {
          dStart.setDate(hoje.getDate() - 30);
      } else if (rangeEnum === 'YEAR') {
          dStart.setDate(hoje.getDate() - 365);
      }
      
      return {
          startDate: dStart.toISOString().split('T')[0],
          endDate: hoje.toISOString().split('T')[0]
      };
  }

  async executeJob(rule) {
      let filters = null;
      try {
         filters = rule.filters; // O JSON Parse do driver do Mysql as vezes já processa, senao é string
         if (typeof filters === 'string') filters = JSON.parse(filters);
      } catch (e) {}
      
      try {
          if (rule.system === 'AUVO') {
              if (auvoSyncService.syncState.status === 'RUNNING' || auvoSyncService.syncState.status === 'SYNCING') {
                   console.log(`[DynamicJob AUVO] Omitido. Já existe sincronização ativa.`);
                   return;
              }
              systemStatusService.setSyncing(true, 'AUVO', rule.description || rule.system);
              const bounds = this.getDateBoundaries(rule.date_range);
              const entitiesToSync = filters && filters.entities && filters.entities.length > 0 ? filters.entities : null;
              await auvoSyncService.runQueue(entitiesToSync, bounds.startDate, bounds.endDate, `Motor Automático (${rule.description || rule.system})`);
              console.log(`✅ [DynamicJob AUVO] Carga de '${rule.date_range}' com sucesso.`);
              
          } else if (rule.system === 'GLPI') {
              if (glpiSyncService.syncState.status === 'RUNNING' || glpiSyncService.syncState.status === 'SYNCING') {
                   console.log(`[DynamicJob GLPI] Omitido. Já existe fila em processamento.`);
                   return;
              }
              
              systemStatusService.setSyncing(true, 'GLPI', rule.description || rule.system);
              const entitiesToSync = filters && filters.entities && filters.entities.length > 0 ? filters.entities : null;
              await glpiSyncService.runQueue(entitiesToSync, null, `Motor Automático (${rule.description || rule.system})`);
              console.log(`✅ [DynamicJob GLPI] Carga concluída.`);
          }
      } catch (e) {
          console.error(`❌ [DynamicJob ${rule.system}] Erro fatal contido da rotina:`, e.message);
      }
  }

  startManager() {
    this.reloadSchedules();
    setupAuvoRetentionJob(); // Mantem vivo o job antigo de Delete das Tarefas AUVO
  }
}

export default new DynamicScheduler();
