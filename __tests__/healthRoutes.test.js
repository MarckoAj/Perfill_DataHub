import request from "supertest";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/core/alerts/alertRepository.js", () => ({
  default: {
    getSummary: jest.fn().mockResolvedValue({
      open_alerts: 2,
      closed_alerts: 5,
      total_alerts: 7,
    }),
  },
}));

describe("Health API Routes", () => {
  let app;

  beforeAll(async () => {
    const customExpress = (await import("../src/config/customExpress.js")).default;
    app = customExpress();
  });

  it("should return health status at /api/health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("service", "perfill-data-hub");
  });

  it("should return alerts summary at /api/health/alerts", async () => {
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
