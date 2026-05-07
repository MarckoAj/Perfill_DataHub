/**
 * AlertEngine — Avaliador de Regras Stateless
 *
 * Responsabilidade ÚNICA: receber um ticket e retornar quais
 * condições de alerta estão ativas naquele momento.
 *
 * NÃO controla estado. NÃO persiste dados. NÃO usa memória entre ciclos.
 * O controle de estado (abrir/fechar alertas) é feito exclusivamente
 * pelo TicketAlertService via banco de dados.
 */

const ALERT_TYPES = Object.freeze({
  NEW_UNHANDLED: "new_unhandled",
  PAUSED_STALE: "paused_stale",
  SLA_OVERDUE: "sla_overdue",
});

const ALERT_SEVERITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

class AlertEngine {
  constructor() {
    this.thresholds = {
      newUnHandledMinutes: 5,
      proactiveStaleHours: 48,
      pausedStaleDays: 7,
    };
  }

  toMilliseconds({ minutes = 0, hours = 0, days = 0 }) {
    return (minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60) * 1000;
  }

  parseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  elapsedTimeFromLastUpdate(ticket, now = new Date()) {
    const reference =
      this.parseDate(ticket.dataAtualizacao) ||
      this.parseDate(ticket.dataCriacao);

    if (!reference) return null;

    return Math.max(0, now.getTime() - reference.getTime());
  }

  /**
   * Avalia um ticket e retorna a lista de alertas cujas condições
   * estão ativas no momento da chamada.
   *
   * @param {object} ticket - Objeto normalizado do ticket
   * @param {Date}   now    - Referência de tempo (injetável para testes)
   * @returns {Array<{type, severity, message}>}
   */
  evaluateTicket(ticket, now = new Date()) {
    const alerts = [];

    if (!ticket || !ticket.ticketId) {
      return alerts;
    }

    const elapsed = this.elapsedTimeFromLastUpdate(ticket, now);
    const status = String(ticket.status || "").toLowerCase();
    const statusSla = String(ticket.statusSla || "").toLowerCase();

    if (
      elapsed !== null &&
      status === "novo" &&
      elapsed > this.toMilliseconds({ minutes: this.thresholds.newUnHandledMinutes })
    ) {
      alerts.push({
        type: ALERT_TYPES.NEW_UNHANDLED,
        severity: ALERT_SEVERITY.HIGH,
        message: "Ticket novo sem tratativa acima de 5 minutos",
      });
    }

    if (
      elapsed !== null &&
      status === "pendente" &&
      elapsed > this.toMilliseconds({ days: this.thresholds.pausedStaleDays })
    ) {
      alerts.push({
        type: ALERT_TYPES.PAUSED_STALE,
        severity: ALERT_SEVERITY.MEDIUM,
        message: "Ticket pendente sem atualização acima de 7 dias",
      });
    }

    if (ticket.isAtrasado || statusSla.includes("vencido")) {
      alerts.push({
        type: ALERT_TYPES.SLA_OVERDUE,
        severity: ALERT_SEVERITY.HIGH,
        message: "Ticket com SLA vencido",
      });
    }

    return alerts;
  }

  /**
   * Retorna as regras de alerta avaliadas para um ticket.
   * Formato compatível com TicketAlertService.checkAlert().
   *
   * @param {object} ticket - Objeto normalizado do ticket
   * @returns {Array<{ruleId, condition, severity, description, source}>}
   */
  evaluateTicketRules(ticket) {
    if (!ticket || !ticket.ticketId) return [];

    const elapsed = this.elapsedTimeFromLastUpdate(ticket);
    const status = String(ticket.status || "").toLowerCase();

    // Ticket é considerado ativo se não estiver em estado terminal
    const isTicketActive =
      status !== "solucionado" &&
      status !== "fechado" &&
      status !== "aguardando aprovação";

    const tempoSla = String(ticket.tempoSla || "");
    const tasksAuvo = ticket.tasksAuvo || [];

    return [
      /* R1 — Ticket NOVO sem interação > 5 min */
      {
        ruleId: "GLPI_NEW_UNHANDLED",
        severity: 3,
        condition: isTicketActive &&
          status === "novo" &&
          elapsed !== null &&
          elapsed > this.toMilliseconds({ minutes: this.thresholds.newUnHandledMinutes }),
        description: "Ticket NOVO sem interação há mais de 5 minutos",
        source: "GLPI",
      },

      /* R2 — Ticket PROATIVO sem interação > 48h e sem tarefas AUVO */
      {
        ruleId: "GLPI_PROACTIVE_STALE",
        severity: 2,
        condition: isTicketActive &&
          tempoSla === "Proativo" &&
          elapsed !== null &&
          elapsed > this.toMilliseconds({ hours: this.thresholds.proactiveStaleHours }) &&
          tasksAuvo.length === 0,
        description: "Ticket PROATIVO sem interação há mais de 48h e sem tarefas Auvo",
        source: "GLPI/AUVO",
      },

      /* R3 — Ticket PENDENTE sem atualização > 7 dias */
      {
        ruleId: "GLPI_PAUSED_STALE",
        severity: 2,
        condition: isTicketActive &&
          status === "pendente" &&
          elapsed !== null &&
          elapsed > this.toMilliseconds({ days: this.thresholds.pausedStaleDays }),
        description: "Ticket PENDENTE (Pausado) sem atualização há mais de 7 dias",
        source: "GLPI",
      },

      /* R4 — SLA Violado */
      {
        ruleId: "GLPI_SLA_BREACHED",
        severity: 3,
        condition: isTicketActive && 
                   ticket.statusSla === "Vencido" && 
                   (!ticket.ultimaTarefa || ticket.ultimaTarefa === 'Sem tarefas'),
        description: "Chamado com SLA Vencido sem justificativa",
        source: "GLPI",
      },

      /* R5 — SLA em Atenção (> 50% consumido) */
      {
        ruleId: "GLPI_SLA_WARNING",
        severity: 2,
        condition: isTicketActive && ticket.statusSla === "Atenção",
        description: "O chamado consumiu mais de 50% do tempo de SLA",
        source: "GLPI",
      },
    ];
  }
}

export { ALERT_TYPES, ALERT_SEVERITY };
export default new AlertEngine();

