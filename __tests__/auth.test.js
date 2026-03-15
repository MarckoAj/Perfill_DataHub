import { jest } from "@jest/globals";
import bcryptjs from "bcryptjs";

// Mock do userRepository
jest.unstable_mockModule("../src/repositories/userRepository.js", () => ({
    default: {
        findUserByUsername: jest.fn(),
        createUser: jest.fn()
    }
}));

describe("Auth Routes", () => {
    let app;
    let userRepository;

    beforeAll(async () => {
        // Importações dinâmicas após os mocks
        const customExpress = (await import("../src/config/customExpress.js")).default;
        userRepository = (await import("../src/repositories/userRepository.js")).default;

        app = customExpress();
        process.env.API_AUTH_TOKEN = "secret_test_token";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return a token for valid credentials", async () => {
        const request = (await import("supertest")).default;
        
        const hashedPassword = await bcryptjs.hash("testpass", 10);

        userRepository.findUserByUsername.mockResolvedValueOnce({
            id: 1,
            username: "testadmin",
            password_hash: hashedPassword
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "testadmin", password: "testpass" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token", "secret_test_token");
    });

    it("should return 401 for invalid credentials", async () => {
        const request = (await import("supertest")).default;

        // Usuário não existe
        userRepository.findUserByUsername.mockResolvedValueOnce(null);

        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "wrong", password: "wrong" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Credenciais inválidas");
    });

    it("should return 401 if missing credentials", async () => {
        const request = (await import("supertest")).default;

        const response = await request(app)
            .post("/api/auth/login")
            .send({});

        // Vai falhar a validação (usuário nulo ou senha incorreta)
        expect(response.status).toBe(401);
    });
});
