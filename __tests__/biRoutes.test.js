import request from "supertest";
import { jest } from "@jest/globals";

// Mock the ticketRepository before importing customExpress to ensure the mock is used
jest.unstable_mockModule("../src/repositories/ticketRepository.js", () => ({
    default: {
        getAllTickets: jest.fn().mockResolvedValue([
            { 
                ticketId: 101, 
                titulo: "Teste Mock", 
                isAtrasado: 0, 
                dataCriacao: "2026-03-01T10:00:00.000Z" 
            }
        ])
    }
}));

describe("BI Routes", () => {
    let app;

    beforeAll(async () => {
        // Inicializa depois dos mocks
        const customExpress = (await import("../src/config/customExpress.js")).default;
        app = customExpress();
        process.env.API_AUTH_TOKEN = "secret_test_token";
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it("should reject access without auth token", async () => {
        const response = await request(app).get("/api/bi/tickets");
        expect(response.status).toBe(401);
    });

    it("should reject access with invalid token", async () => {
        const response = await request(app)
            .get("/api/bi/tickets")
            .set("Authorization", "Bearer invalid_token");

        expect(response.status).toBe(401);
    });

    it("should return dashboard tickets correctly with valid token", async () => {
        const response = await request(app)
            .get("/api/bi/tickets")
            .set("Authorization", "Bearer secret_test_token");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("ticketId", 101);
        }
    });

    // Fechamento forçado caso alguma Promise fique pendente no Express
    afterAll(async () => {
        await new Promise(resolve => setTimeout(() => resolve(), 500)); // allow server to close properly
    });
});
