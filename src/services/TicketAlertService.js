import alertEngine from "./alertEngine.js";
import alertRepository from "../repositories/alertRepository.js";
import alertBroadcaster from "../websocket/alertBroadcaster.js";
import glpiTicketTaskRepository from "../repositories/glpi/glpiTicketTaskRepository.js";

class TicketAlertService {
  async createNewAlert(ticketId, rule) {
    // Verifica se já existe um alerta aberto para este ticket e regra específica
    const alertList = await alertRepository.selecTicketAlert({
      glpi_ticketId: ticketId,
      ruleId: rule.ruleId,
    });

    const hasActiveAlert = alertList.some((alert) => alert.checked === 0);

    if (!hasActiveAlert) {
      const result = await alertRepository.insertTicketAlert({
        glpi_ticketId: ticketId,
        rule: rule,
      });

      // Notifica via WebSocket
      alertBroadcaster.broadcast('ALERT_OPENED', {
        ticketId,
        ruleId: rule.ruleId,
        severity: rule.severity,
        message: rule.description,
        source: rule.source,
        detectedAt: new Date().toISOString()
      });

      return result;
    }
  }

  async checkAlert(rule, ticket) {
    const ticketId = ticket.ticketId;
    const { ruleId, condition } = rule;
    const alertList = await alertRepository.selecTicketAlert({
      glpi_ticketId: ticketId,
      ruleId: ruleId,
    });

    const activeAlert = alertList.find((alert) => alert.checked === 0);

    if (condition && !activeAlert) {
      // Condição ativa e sem alerta aberto → abre
      await this.createNewAlert(ticketId, rule);
    } else if (!condition && activeAlert) {
      // Condição resolvida e havia alerta aberto → fecha ou justifica
      
      // Lógica de auto-justificativa específica para R4
      if (ruleId === 'GLPI_SLA_BREACHED' && ticket.ultimaTarefa && ticket.ultimaTarefa !== 'Sem tarefas') {
        await alertRepository.justifyAlert({
          alertId: activeAlert.id,
          justifiedBy: 'system',
          justifiedText: "Alerta justificado via GLPI"
        });
      } else {
        await alertRepository.updateTicketAlert({
          checked: true,
          justifiedText: "Status justificado pelo sistema",
          glpi_ticketId: ticketId,
          ruleId: ruleId,
        });
      }

      // Notifica via WebSocket
      alertBroadcaster.broadcast('ALERT_JUSTIFIED', {
        ticketId,
        ruleId,
        author: 'system',
        reason: justifiedText
      });
    }
  }

  /**
   * Processa todos os alertas de um ticket.
   * As regras e condições são avaliadas pelo AlertEngine (stateless).
   * Este service atua como orquestrador: itera as regras e persiste via banco.
   *
   * @param {object} ticket - Objeto normalizado do ticket
   */
  async processTicketAlerts(ticket) {
    if (!ticket || !ticket.ticketId) return;

    const ticketId = ticket.ticketId;

    try {
      // Se não tem ultimaTarefa (vinda do mapper/sync inicial), tenta buscar no banco
      if (!ticket.ultimaTarefa || ticket.ultimaTarefa === 'Sem tarefas') {
        const lastTask = await glpiTicketTaskRepository.getLastTaskContentByTicketId(ticketId);
        if (lastTask) {
          ticket.ultimaTarefa = lastTask;
        }
      }

      const alertRules = alertEngine.evaluateTicketRules(ticket);

      for (const rule of alertRules) {
        await this.checkAlert(rule, ticket);
      }
    } catch (error) {
      console.error(`[TicketAlertService] Erro no ticket ${ticketId}: ${error.message}`);
    }
  }
}

export default new TicketAlertService();

