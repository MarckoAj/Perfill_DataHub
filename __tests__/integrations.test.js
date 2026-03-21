import request from "supertest";
import { jest } from "@jest/globals";

const mockGetSystemHealth = jest.fn();
const mockGetGlpiSyncStatus = jest.fn();

jest.unstable_mockModule("../src/repositories/integrationRepository.js", () => ({
  default: {
    getSystemHealth: mockGetSystemHealth,
    getGlpiSyncStatus: mockGetGlpiSyncStatus,
  },
}));

// Setup default mocks
mockGetSystemHealth.mockResolvedValue({
  status: "healthy",
  integrations: {
    glpi: {
      status: "connected",
      last_sync: "2026-03-15T10:00:00Z",
      metrics: {
        last_sync: "2026-03-15T10:00:00Z",
        total_tickets: 150,
        new_tickets: 5,
        assigned_tickets: 25,
        overdue_tickets: 3,
      },
    },
  },
  alerts: {
    critical_count: 2,
    status: "normal",
  },
  timestamp: "2026-03-15T10:00:00Z",
});

mockGetGlpiSyncStatus.mockResolvedValue({
  last_sync: "2026-03-15T10:00:00Z",
  total_tickets: 150,
  new_tickets: 5,
  assigned_tickets: 25,
  overdue_tickets: 3,
});

describe("API de Integrações", () => {
  let app;

  beforeAll(async () => {
    const customExpress = (await import("../src/config/customExpress.js")).default;
    app = customExpress();
  });

  describe("GET /api/integrations", () => {
    it("deve retornar o status de saúde do sistema", async () => {
      const response = await request(app).get("/api/integrations");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("integrations");
      expect(response.body).toHaveProperty("alerts");
      expect(response.body).toHaveProperty("timestamp");
      
      expect(response.body.integrations.glpi).toMatchObject({
        status: "connected",
        last_sync: "2026-03-15T10:00:00Z",
      });
      
      expect(response.body.integrations.glpi.metrics).toMatchObject({
        total_tickets: 150,
        new_tickets: 5,
        overdue_tickets: 3,
      });
    });

    it("deve retornar 503 quando a saúde do sistema estiver degradada", async () => {
      mockGetSystemHealth.mockResolvedValueOnce({
        status: "error",
        error: "Database connection failed",
        timestamp: "2026-03-15T10:00:00Z",
      });

      const response = await request(app).get("/api/integrations");

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty("status", "error");
    });
  });

  describe("GET /api/integrations/glpi", () => {
    it("deve retornar o status específico do GLPI", async () => {
      const response = await request(app).get("/api/integrations/glpi");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("integration", "glpi");
      expect(response.body).toHaveProperty("status", "connected");
      expect(response.body).toHaveProperty("metrics");
      expect(response.body).toHaveProperty("timestamp");
      
      expect(response.body.metrics).toMatchObject({
        total_tickets: 150,
        new_tickets: 5,
        assigned_tickets: 25,
        overdue_tickets: 3,
      });
    });
  });
});
