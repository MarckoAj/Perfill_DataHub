import ticketMapper from "../src/mappers/ticketMapper.js";

describe("TicketMapper", () => {
  it("deve mapear o ID da localização do GLPI quando vier em locations_id", () => {
    const [ticket] = ticketMapper.processTickets([
      {
        "2": 123,
        "1": "Chamado teste",
        "12": 1,
        "15": "2026-08-07 10:00:00",
        "83": "CLIENTE > PONTO A",
        locations_id: 456
      }
    ]);

    expect(ticket.idLocalizacaoPonto).toBe(456);
    expect(ticket.nomeCliente).toBe("PONTO A");
  });

  it("deve mapear o ID da localização do GLPI quando vier nos links", () => {
    expect(ticketMapper.extractLocationId({
      links: [
        { rel: "Entity", href: "https://glpi.local/apirest.php/Entity/1" },
        { rel: "Location", href: "https://glpi.local/apirest.php/Location/789" }
      ]
    })).toBe(789);
  });
});
