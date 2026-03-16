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
    this.openAlerts = new Map();
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
    const reference = this.parseDate(ticket.dataAtualizacao) || this.parseDate(ticket.dataCriacao);

    if (!reference) return null;

    return Math.max(0, now.getTime() - reference.getTime());
  }

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

  buildAlertKey(ticketId, type) {
    return `${ticketId}:${type}`;
  }

  processTickets(tickets, now = new Date()) {
    const nextOpenKeys = new Set();
    const opened = [];
    const active = [];

    for (const ticket of tickets || []) {
      const ticketAlerts = this.evaluateTicket(ticket, now);

      for (const alert of ticketAlerts) {
        const key = this.buildAlertKey(ticket.ticketId, alert.type);
        nextOpenKeys.add(key);

        const existing = this.openAlerts.get(key);

        if (!existing) {
          const created = {
            ...alert,
            ticketId: ticket.ticketId,
            firstDetectedAt: now.toISOString(),
            lastDetectedAt: now.toISOString(),
            state: "open",
          };

          this.openAlerts.set(key, created);
          opened.push(created);
          active.push(created);
          continue;
        }

        existing.lastDetectedAt = now.toISOString();
        existing.state = "open";
        active.push(existing);
      }
    }

    const closed = [];

    for (const [key, value] of this.openAlerts.entries()) {
      if (!nextOpenKeys.has(key) && value.state === "open") {
        value.state = "closed";
        value.closedAt = now.toISOString();
        closed.push(value);
      }
    }

    return {
      opened,
      closed,
      active,
      counters: {
        opened: opened.length,
        closed: closed.length,
        active: active.length,
      },
    };
  }

  resetState() {
    this.openAlerts.clear();
  }
}

export { ALERT_TYPES, ALERT_SEVERITY };
export default new AlertEngine();
