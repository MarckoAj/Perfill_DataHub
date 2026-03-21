import alertEngine, { ALERT_TYPES } from "../src/services/alertEngine.js";

describe("Motor de Alertas", () => {
  beforeEach(() => {
    alertEngine.resetState();
  });

  it("deve abrir alerta new_unhandled para tickets novos parados", () => {
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

  it("deve abrir alerta paused_stale para tickets pendentes sem atualização", () => {
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

  it("deve abrir alerta sla_overdue quando o ticket estiver atrasado", () => {
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

  it("não deve duplicar alertas abertos entre execuções", () => {
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

  it("deve fechar alerta aberto anteriormente quando a condição não for mais verdadeira", () => {
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
