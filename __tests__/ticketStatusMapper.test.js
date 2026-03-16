import ticketStatusMapper from "../src/core/tickets/ticketStatusMapper.js";

describe("ticketStatusMapper", () => {
  it("should map known status names to GLPI ids", () => {
    expect(ticketStatusMapper.toGlpiStatusId("novo")).toBe(1);
    expect(ticketStatusMapper.toGlpiStatusId("solucionado")).toBe(5);
    expect(ticketStatusMapper.toGlpiStatusId("fechado")).toBe(6);
    expect(ticketStatusMapper.toGlpiStatusId("atrasado")).toBe(7);
  });

  it("should map GLPI ids to data hub status names", () => {
    expect(ticketStatusMapper.toDataHubStatus(1)).toBe("novo");
    expect(ticketStatusMapper.toDataHubStatus(4)).toBe("pendente");
    expect(ticketStatusMapper.toDataHubStatus(6)).toBe("fechado");
  });

  it("should identify overdue status", () => {
    expect(ticketStatusMapper.isOverdue("atrasado")).toBe(true);
    expect(ticketStatusMapper.isOverdue(7)).toBe(true);
    expect(ticketStatusMapper.isOverdue("novo")).toBe(false);
  });
});
