import request from "supertest";

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
});
