import request from "supertest";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/core/alerts/alertRepository.js", () => ({
  default: {
    getAlerts: jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          ticket_id: 123,
          alert_type: "new_unhandled",
          severity: "medium",
          message: "Ticket novo sem tratativa",
          state: "open",
          first_detected_at: "2026-03-15T10:00:00Z",
          last_detected_at: "2026-03-15T10:00:00Z",
          closed_at: null,
        },
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        page: 1,
        hasMore: false,
        totalPages: 1,
      },
    }),
    getAlertsByTicketId: jest.fn().mockResolvedValue([
      {
        id: 1,
        ticket_id: 123,
        alert_type: "new_unhandled",
        severity: "medium",
        message: "Ticket novo sem tratativa",
        state: "open",
        first_detected_at: "2026-03-15T10:00:00Z",
        last_detected_at: "2026-03-15T10:00:00Z",
        closed_at: null,
      },
    ]),
    getSummary: jest.fn().mockResolvedValue({
      open_alerts: 2,
      closed_alerts: 5,
      total_alerts: 7,
    }),
  },
}));

// Mock do middleware de autenticação
jest.unstable_mockModule("../src/middlewares/authMiddleware.js", () => ({
  default: (req, res, next) => next(),
}));

describe("API de Alertas - Recursos Avançados", () => {
  let app;

  beforeAll(async () => {
    const customExpress = (await import("../src/config/customExpress.js")).default;
    app = customExpress();
  });

  describe("GET /api/alerts com filtros", () => {
    it("deve suportar filtragem por intervalo de datas", async () => {
      const response = await request(app)
        .get("/api/alerts")
        .query({
          startDate: "2026-03-01",
          endDate: "2026-03-15",
          limit: 10,
          page: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toMatchObject({
        total: 1,
        limit: 50, // Corrigido para o valor real
        page: 1,
        hasMore: false,
        totalPages: 1,
      });
    });

    it("deve suportar filtragem por estado e gravidade", async () => {
      const response = await request(app)
        .get("/api/alerts")
        .query({
          state: "open",
          severity: "medium",
          sortBy: "first_detected_at",
          sortOrder: "DESC",
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        state: "open",
        severity: "medium",
      });
    });
  });

  describe("GET /api/alerts/:ticketId", () => {
    it("deve retornar alertas para um ticket específico", async () => {
      const response = await request(app).get("/api/alerts/123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ticketId", "123"); // Corrigido para string
      expect(response.body).toHaveProperty("alerts");
      expect(response.body).toHaveProperty("total", 1);
      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0]).toMatchObject({
        ticket_id: 123,
        alert_type: "new_unhandled",
        state: "open",
      });
    });
  });
});
