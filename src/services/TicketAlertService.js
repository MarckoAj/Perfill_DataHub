import customDate from "../utils/customDate.js";
import alertRepository from "../repositories/alertRepository.js";

class TicketAlertService {
  constructor() {
    this.maxOpenedTime = customDate.minForMilliseconds(5); // 5 min
    this.maxProactiveTime = customDate.daysForMilliseconds(2); // 48h
    this.maxPausedTime = customDate.daysForMilliseconds(7); // 7 dias
    this.maxOpenedTimeTaskStatusFinalized = customDate.minForMilliseconds(5);
  }

  async createNewAlert(ticketId, rule) {
    // Verifica se já existe um alerta aberto para este ticket e regra específica
    const alertList = await alertRepository.selecTicketAlert({
      glpi_ticketId: ticketId,
      ruleId: rule.ruleId,
    });

    const hasActiveAlert = alertList.some((alert) => alert.checked === 0);

    if (!hasActiveAlert) {
      return await alertRepository.insertTicketAlert({
        glpi_ticketId: ticketId,
        rule: rule,
      });
    }
  }

  async checkAlert(rule, ticketId) {
    const { ruleId, condition } = rule;
    const alertList = await alertRepository.selecTicketAlert({
      glpi_ticketId: ticketId,
      ruleId: ruleId,
    });

    const activeAlert = alertList.find((alert) => alert.checked === 0);

    if (condition && !activeAlert) {
      // Se a condição for atendida e não houver alerta ativo, cria um novo
      await this.createNewAlert(ticketId, rule);
    } else if (!condition && activeAlert) {
      // Se a condição não for mais atendida mas houver um alerta ativo, fecha o alerta
      await alertRepository.updateTicketAlert({
        checked: true,
        justifiedText: "Status justificado pelo sistema",
        glpi_ticketId: ticketId,
        ruleId: ruleId,
      });
    }
  }

  async processTicketAlerts(ticket) {
    if (!ticket || !ticket.ticketId) return;

    const status = String(ticket.status || "").toLowerCase();

    // Um chamado é considerado ativo se NÃO estiver solucionado, fechado, ou aguardando aprovação.
    // Usamos isso para garantir que chamados inativos tenham todos os seus alertas fechados/justificados.
    const isTicketActive = status !== "solucionado" && 
                           status !== "fechado" && 
                           status !== "aguardando aprovação";

    // Mapeamento dos campos do objeto ticket (vindo do ticketMapper)
    const lastUpdate = ticket.dataAtualizacao || ticket.dataCriacao;
    const lastUpdateMs = Math.abs(customDate.calculateTimeDif(lastUpdate));

    const ticketId = ticket.ticketId;
    const tempoSla = String(ticket.tempoSla || "");
    const tasksAuvo = ticket.tasksAuvo || [];

    try {
      /* 
       * Severidades (severity): 1 informativos, 2 de atencao, 3 criticos 
       */
      const alertList = [
        /* Alerta 1: Ticket NOVO sem interação há mais de 5 minutos */
        {
          ruleId: "GLPI_NEW_UNHANDLED",
          severity: 3,
          condition: isTicketActive && status === "novo" && lastUpdateMs > this.maxOpenedTime,
          description: "Ticket NOVO sem interação há mais de 5 minutos",
          source: "GLPI"
        },

        /* Alerta 2: Ticket PROATIVO sem interação há mais de 48h e sem tarefas Auvo */
        {
          ruleId: "GLPI_PROACTIVE_STALE",
          severity: 2,
          condition: isTicketActive && 
                     tempoSla === "Proativo" &&
                     lastUpdateMs > this.maxProactiveTime &&
                     tasksAuvo.length === 0,
          description: "Ticket PROATIVO sem interação há mais de 48h e sem tarefas Auvo",
          source: "GLPI/AUVO"
        },

        /* Alerta 3: Ticket PENDENTE (Pausado) sem atualização há mais de 7 dias */
        {
          ruleId: "GLPI_PAUSED_STALE",
          severity: 2,
          condition: isTicketActive && status === "pendente" && lastUpdateMs > this.maxPausedTime,
          description: "Ticket PENDENTE (Pausado) sem atualização há mais de 7 dias",
          source: "GLPI"
        },

        /* Alerta 4: SLA Violado (Atrasado) */
        {
          ruleId: "GLPI_SLA_BREACHED",
          severity: 3,
          condition: isTicketActive && ticket.statusSla === "Vencido",
          description: "O tempo de SLA para este chamado esgotou",
          source: "GLPI"
        },

        /* Alerta 5: SLA em Atenção (Consumiu mais de 50%) */
        {
          ruleId: "GLPI_SLA_WARNING",
          severity: 2,
          condition: isTicketActive && ticket.statusSla === "Atenção",
          description: "O chamado consumiu mais de 50% do tempo de SLA",
          source: "GLPI"
        }

        // Exemplo de alerta futuro AUVO
        // {
        //   ruleId: "AUVO_TECH_DELAY",
        //   severity: 2,
        //   condition: false, // Lógica do AUVO entraria aqui
        //   description: "Tecnico com tarefa sem iniciar deslocamento a mais de 1h",
        //   source: "AUVO"
        // }
      ];

      for (const alert of alertList) {
        await this.checkAlert(alert, ticketId);
      }
    } catch (error) {
      console.error(`[TicketAlertService] Erro no ticket ${ticketId}: ${error.message}`);
    }
  }
}

export default new TicketAlertService();
