import request from "supertest";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/repositories/alertRepository.js", () => ({
  default: {
    getSummary: jest.fn().mockResolvedValue({
      open_alerts: 2,
      closed_alerts: 5,
      total_alerts: 7,
    }),
  },
}));

describe("Rotas da API de Saúde (Health)", () => {
  let app;

  beforeAll(async () => {
    const customExpress = (await import("../src/config/customExpress.js")).default;
    app = customExpress();
  });

  it("deve retornar status de saúde em /api/health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("service", "perfill-data-hub");
  });

  it("deve retornar o resumo de alertas em /api/health/alerts", async () => {
    const response = await request(app).get("/api/health/alerts");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("alerts");
    expect(response.body.alerts).toMatchObject({
      open_alerts: 2,
      closed_alerts: 5,
      total_alerts: 7,
    });
  });
});
