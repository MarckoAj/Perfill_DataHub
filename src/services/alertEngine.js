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
}

export { ALERT_TYPES, ALERT_SEVERITY };
export default new AlertEngine();

