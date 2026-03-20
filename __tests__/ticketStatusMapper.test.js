import ticketStatusMapper from "../src/core/tickets/ticketStatusMapper.js";

describe("Mapeador de Status de Ticket", () => {
  it("deve mapear nomes de status conhecidos para ids do GLPI", () => {
    expect(ticketStatusMapper.toGlpiStatusId("novo")).toBe(1);
    expect(ticketStatusMapper.toGlpiStatusId("solucionado")).toBe(5);
    expect(ticketStatusMapper.toGlpiStatusId("fechado")).toBe(6);
    expect(ticketStatusMapper.toGlpiStatusId("atrasado")).toBe(7);
  });

  it("deve mapear ids do GLPI para nomes de status do Data Hub", () => {
    expect(ticketStatusMapper.toDataHubStatus(1)).toBe("novo");
    expect(ticketStatusMapper.toDataHubStatus(4)).toBe("pendente");
    expect(ticketStatusMapper.toDataHubStatus(6)).toBe("fechado");
  });

  it("deve identificar status atrasado", () => {
    expect(ticketStatusMapper.isOverdue("atrasado")).toBe(true);
    expect(ticketStatusMapper.isOverdue(7)).toBe(true);
    expect(ticketStatusMapper.isOverdue("novo")).toBe(false);
  });
});
