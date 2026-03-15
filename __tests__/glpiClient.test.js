import { jest } from "@jest/globals";

// Mock do builder de URL
jest.unstable_mockModule("../src/utils/glpiUrlBuilder.js", () => ({
    default: {
        glpiBaseUrl: jest.fn(() => "http://mocked-glpi.com/apirest.php"),
        requestGlpiEndpointByStatus: jest.fn(() => "search/Ticket?mocked_status=1")
    }
}));

// Mock do método fetch nativo do NodeJS ANTES do import
global.fetch = jest.fn();

describe("GLPI Client and Service Integration", () => {
    let glpi_client;
    let glpi_service;

    beforeAll(async () => {
        // We must provide a default mock for the constructor's initial fetch to initSession
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ session_token: "mocked_session_token_123" }),
            headers: { get: () => 'application/json' }
        });

        // Precisamos importar dinamicamente após os mocks
        glpi_client = (await import("../src/clients/glpi_client.js")).default;
        glpi_service = (await import("../src/service/glpi_service.js")).default;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should successfully init session and fetch a ticket", async () => {
        // Mock initSession response
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ session_token: "mocked_session_token_123" }),
            headers: { get: () => 'application/json' }
        });

        // Mock Search Ticket response
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ([
                { "2": 999, "82": "Chamado Mockado", "12": 1 } // Using GLPI format
            ]),
            headers: { get: () => '0-0/1' }
        });

        // Chamada real para o client mockado
        const header = await glpi_client.getGlpiHeader();
        expect(header).toHaveProperty("Session-Token", "mocked_session_token_123");

        // We fetch the basic request, no mapping from glpiClient:
        const ticketsResponse = await glpi_client.glpiRequestData("search/Ticket", "GET");
        expect(Array.isArray(ticketsResponse)).toBeTruthy();
        expect(ticketsResponse[0]["2"]).toBe(999);
    });

    it("should process and map tickets properly in glpiService", async () => {
        // Mockando diretamente a reposta do glpiRequestData para focar apenas no Service -> Mapper
        jest.spyOn(glpi_client, "glpiRequestData").mockResolvedValueOnce([
            {
                "2": 50,              // ticketId
                "1": "Erro no SAP",   // titulo
                "21": "Não abre",     // descricao
                "15": "2026-03-01",   // dataCriacao
                "16": "2026-03-02",   // dataFechamento
                "19": "2026-03-01",   // dataAtualizacao
                "12": 5               // status (5 = solucionado)
            }
        ]);

        const tickets = await glpi_service.getTicketsByStatus("solucionado");
        
        expect(tickets.length).toBe(1);
        expect(tickets[0].ticketId).toBe(50);
        expect(tickets[0].titulo).toBe("Erro no SAP");
        expect(tickets[0].status).toBe("solucionado");
        expect(tickets[0].nomeTecnico).toBe("Não Atribuido");
    });
});
