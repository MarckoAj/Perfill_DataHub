import request from "supertest";
import { jest } from "@jest/globals";

const getAlertsMock = jest.fn().mockResolvedValue({
  data: [
    {
      id: 1,
      ticket_id: 123,
      alert_type: "new_unhandled",
      severity: "medium",
      message: "Ticket novo sem tratativa",
      state: "open",
      first_detected_at: "2026-03-15T00:00:00.000Z",
      last_detected_at: "2026-03-15T00:05:00.000Z",
      closed_at: null,
      created_at: "2026-03-15T00:00:00.000Z",
      updated_at: "2026-03-15T00:05:00.000Z",
    },
  ],
  pagination: {
    total: 1,
    limit: 10,
    offset: 0,
    hasMore: false,
  },
});

jest.unstable_mockModule("../src/repositories/alertRepository.js", () => ({
  default: {
    getAlerts: getAlertsMock,
    getSummary: jest.fn().mockResolvedValue({
      open_alerts: 0,
      closed_alerts: 0,
      total_alerts: 0,
    }),
  },
}));

describe("Rotas da API de Alertas", () => {
  let app;

  beforeAll(async () => {
    const customExpress = (await import("../src/config/customExpress.js")).default;
    app = customExpress();
    process.env.API_AUTH_TOKEN = "secret_test_token";
  });

  afterEach(() => {
    getAlertsMock.mockClear();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("deve rejeitar acesso sem token de autenticação", async () => {
    const response = await request(app).get("/api/alerts");
    expect(response.status).toBe(401);
  });

  it("deve retornar alertas paginados com token válido", async () => {
    const response = await request(app)
      .get("/api/alerts?state=open&severity=medium&limit=10&offset=0")
      .set("Authorization", "Bearer secret_test_token");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toMatchObject({
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    });

    expect(getAlertsMock).toHaveBeenCalledWith({
      state: "open",
      type: undefined,
      severity: "medium",
      limit: "10",
      offset: "0",
      sortBy: undefined,
      sortOrder: undefined,
    });
  });
});
