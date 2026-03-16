import alertEngine, { ALERT_TYPES } from "../src/core/alerts/alertEngine.js";

describe("alertEngine", () => {
  beforeEach(() => {
    alertEngine.resetState();
  });

  it("should open new_unhandled alert for new stale tickets", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 6 * 60 * 1000).toISOString();

    const result = alertEngine.processTickets([
      {
        ticketId: 1001,
        status: "novo",
        dataAtualizacao: staleDate,
      },
    ], now);

    expect(result.counters.opened).toBe(1);
    expect(result.active[0].type).toBe(ALERT_TYPES.NEW_UNHANDLED);
  });

  it("should open paused_stale alert for pending tickets without updates", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

    const result = alertEngine.processTickets([
      {
        ticketId: 2002,
        status: "pendente",
        dataAtualizacao: staleDate,
      },
    ], now);

    expect(result.counters.opened).toBe(1);
    expect(result.active[0].type).toBe(ALERT_TYPES.PAUSED_STALE);
  });

  it("should open sla_overdue alert when ticket is overdue", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");

    const result = alertEngine.processTickets([
      {
        ticketId: 3003,
        status: "atribuido",
        statusSla: "Vencido",
      },
    ], now);

    expect(result.counters.opened).toBe(1);
    expect(result.active[0].type).toBe(ALERT_TYPES.SLA_OVERDUE);
  });

  it("should not duplicate open alerts between runs", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 6 * 60 * 1000).toISOString();

    const first = alertEngine.processTickets([
      { ticketId: 4004, status: "novo", dataAtualizacao: staleDate },
    ], now);

    const second = alertEngine.processTickets([
      { ticketId: 4004, status: "novo", dataAtualizacao: staleDate },
    ], new Date(now.getTime() + 60 * 1000));

    expect(first.counters.opened).toBe(1);
    expect(second.counters.opened).toBe(0);
    expect(second.counters.active).toBe(1);
  });

  it("should close previously open alert when condition is no longer true", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 6 * 60 * 1000).toISOString();

    alertEngine.processTickets([
      { ticketId: 5005, status: "novo", dataAtualizacao: staleDate },
    ], now);

    const next = alertEngine.processTickets([
      { ticketId: 5005, status: "atribuido", dataAtualizacao: now.toISOString() },
    ], new Date(now.getTime() + 60 * 1000));

    expect(next.counters.closed).toBe(1);
    expect(next.closed[0].ticketId).toBe(5005);
    expect(next.closed[0].state).toBe("closed");
  });
});
