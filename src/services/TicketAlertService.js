import ruleEngine from "../engine/RuleEngine.js";
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
      let resolutionReason = "Status justificado pelo sistema";
      
      // Lógica de auto-justificativa específica para R4
      if (ruleId === 'GLPI_SLA_BREACHED' && ticket.ultimaTarefa && ticket.ultimaTarefa !== 'Sem tarefas') {
        resolutionReason = "Alerta justificado via GLPI";
        await alertRepository.justifyAlert({
          alertId: activeAlert.id,
          justifiedBy: 'system',
          justifiedText: resolutionReason
        });
      } else {
        await alertRepository.updateTicketAlert({
          checked: true,
          justifiedText: resolutionReason,
          glpi_ticketId: ticketId,
          ruleId: ruleId,
        });
      }

      // Notifica via WebSocket
      alertBroadcaster.broadcast('ALERT_JUSTIFIED', {
        ticketId,
        ruleId,
        author: 'system',
        reason: resolutionReason
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

      // Garante que as regras estão carregadas em memória (Lazy Load Inicial)
      if (ruleEngine.rules.length === 0) {
        await ruleEngine.loadRules();
      }

      // Função auxiliar para calcular tempo
      const parseDate = (val) => {
        if (!val) return null;
        const parsed = new Date(val);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };
      
      const reference = parseDate(ticket.dataAtualizacao) || parseDate(ticket.dataCriacao);
      const elapsed = reference ? Math.max(0, new Date().getTime() - reference.getTime()) : null;

      // Montagem do Contexto Unificado (ETAPA 3 do Plano)
      const context = {
        ticket: ticket,
        tasksAuvo: ticket.tasksAuvo || [],
        timestamps: {
          elapsed: elapsed
        }
      };

      const alertRules = ruleEngine.evaluateAll(context);

      for (const rule of alertRules) {
        await this.checkAlert(rule, ticket);
      }
    } catch (error) {
      console.error(`[TicketAlertService] Erro no ticket ${ticketId}: ${error.message}`);
    }
  }
}

export default new TicketAlertService();
