import dotenv from "dotenv";

dotenv.config();

class AuvoClient {
  constructor() {
    this.baseUrl = process.env.AUVO_BASE_URL || "https://api.auvo.com.br/v2";
    this.apiKey = process.env.AUVO_API_KEY;
    this.apiToken = process.env.AUVO_API_TOKEN;
    this.token = null;
    this.tokenExpiry = null;
  }

  async getAuthHeader() {
    // Se o token existe e tem mais de 2 minutos de validade restante, reaproveita
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 120000) {
      return { Authorization: `Bearer ${this.token}` };
    }

    try {
      const loginUrl = `${this.baseUrl}/login`;
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: this.apiKey,
          apiToken: this.apiToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao autenticar no AUVO: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.result || !data.result.token) {
        throw new Error("Token não retornado pela API do AUVO.");
      }

      this.token = data.result.token;
      // Define expiração para 30 minutos (1800000 ms) a partir de agora
      this.tokenExpiry = Date.now() + 1800000;

      return { Authorization: `Bearer ${this.token}` };
    } catch (error) {
      console.error("Erro ao gerar token AUVO:", error.message);
      return null;
    }
  }

  async request(endpoint, method = "GET", body = null) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;
    const header = await this.getAuthHeader();

    if (!header) {
      console.error("Requisição abortada: Sem autenticação AUVO válida.");
      return null;
    }

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...header,
      },
    };

    if (method !== "GET" && method !== "DELETE" && body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        // Força renovação do token em caso de Unauthorized inesperado
        this.token = null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erro na requisição AUVO [${method} ${endpoint}]:`, error.message);
      return null;
    }
  }

  // ==== Wrappers de Endpoints da API ====

  async getTasks(params = {}) {
    // Parametros comuns: dateStart, dateEnd, taskStatusID
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ""}`;
    return this.request(endpoint, "GET");
  }

  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ""}`;
    return this.request(endpoint, "GET");
  }

  async getAuvoEntity(entityType, id) {
    // Ex: entityType = "users", "customers", "taskTypes"
    return this.request(`/${entityType}/${id}`, "GET");
  }

  async getQuestionnaires() {
    return this.request("/questionnaires", "GET");
  }
}

export default new AuvoClient();
