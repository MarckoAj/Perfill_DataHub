import ruleEngine from "../src/engine/RuleEngine.js";

describe("Motor de Alertas", () => {
  beforeAll(async () => {
    await ruleEngine.loadRules();
  });

  function evaluateTicket(ticket, now = new Date("2026-03-15T12:00:00.000Z")) {
    const reference = ticket.dataAtualizacao || ticket.dataCriacao;
    const parsedReference = reference ? new Date(reference) : null;
    const elapsed = parsedReference && !Number.isNaN(parsedReference.getTime())
      ? Math.max(0, now.getTime() - parsedReference.getTime())
      : null;

    return ruleEngine.evaluateAll({
      ticket,
      tasksAuvo: ticket.tasksAuvo || [],
      timestamps: { elapsed }
    });
  }

  function findRule(results, ruleId) {
    return results.find(rule => rule.ruleId === ruleId);
  }

  it("deve sinalizar GLPI_NEW_UNHANDLED para tickets novos parados", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 6 * 60 * 1000).toISOString();

    const result = evaluateTicket({
      ticketId: 1001,
      status: "novo",
      dataAtualizacao: staleDate,
    }, now);

    expect(findRule(result, "GLPI_NEW_UNHANDLED")).toMatchObject({
      ruleId: "GLPI_NEW_UNHANDLED",
      condition: true
    });
  });

  it("deve sinalizar GLPI_PAUSED_STALE para tickets pendentes sem atualizacao", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const staleDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

    const result = evaluateTicket({
      ticketId: 2002,
      status: "pendente",
      dataAtualizacao: staleDate,
    }, now);

    expect(findRule(result, "GLPI_PAUSED_STALE")).toMatchObject({
      ruleId: "GLPI_PAUSED_STALE",
      condition: true
    });
  });

  it("deve sinalizar GLPI_SLA_BREACHED quando o ticket estiver com SLA vencido sem tarefa", () => {
    const result = evaluateTicket({
      ticketId: 3003,
      status: "atribuido",
      statusSla: "Vencido",
      ultimaTarefa: "Sem tarefas",
    });

    expect(findRule(result, "GLPI_SLA_BREACHED")).toMatchObject({
      ruleId: "GLPI_SLA_BREACHED",
      condition: true
    });
  });

  it("nao deve sinalizar regras de ticket parado quando a condicao nao for verdadeira", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");

    const result = evaluateTicket({
      ticketId: 5005,
      status: "atribuido",
      dataAtualizacao: now.toISOString(),
    }, now);

    expect(findRule(result, "GLPI_NEW_UNHANDLED")?.condition).toBe(false);
    expect(findRule(result, "GLPI_PAUSED_STALE")?.condition).toBe(false);
  });
});
