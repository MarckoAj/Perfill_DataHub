import alertEngine from "./alertEngine.js";
import alertRepository from "../repositories/alertRepository.js";
import alertBroadcaster from "../websocket/alertBroadcaster.js";

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

  async checkAlert(rule, ticketId) {
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
      // Condição resolvida e havia alerta aberto → fecha
      await alertRepository.updateTicketAlert({
        checked: true,
        justifiedText: "Status justificado pelo sistema",
        glpi_ticketId: ticketId,
        ruleId: ruleId,
      });

      // Notifica via WebSocket
      alertBroadcaster.broadcast('ALERT_CLOSED', {
        ticketId,
        ruleId,
        closedBy: 'system'
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
      const alertRules = alertEngine.evaluateTicketRules(ticket);

      for (const rule of alertRules) {
        await this.checkAlert(rule, ticketId);
      }
    } catch (error) {
      console.error(`[TicketAlertService] Erro no ticket ${ticketId}: ${error.message}`);
    }
  }
}

export default new TicketAlertService();

