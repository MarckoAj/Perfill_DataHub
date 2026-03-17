import dotenv from "dotenv";

dotenv.config();

class AuvoClient {
  constructor() {
    this.baseUrl = process.env.AUVO_BASE_URL || "https://api.auvo.com.br/v2";
    this.apiKey = process.env.AUVO_API_KEY;
    this.apiToken = process.env.AUVO_API_TOKEN;
    this.token = null;
    this.tokenExpiry = null;
    this.loginPromise = null;
  }

  async getAuthHeader() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 120000) {
      return { Authorization: `Bearer ${this.token}` };
    }

    // Prevém gatilhos concorrentes disparando múltiplos /login na API
    if (this.loginPromise) {
      console.log("[AuvoClient] Aguardando autenticação já em andamento...");
      await this.loginPromise;
      return { Authorization: `Bearer ${this.token}` };
    }

    this.loginPromise = (async () => {
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
        throw new Error(`Erro ao autenticar no AUVO: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result || !data.result.accessToken) {
        throw new Error("Token não retornado pela API do AUVO.");
      }

      this.token = data.result.accessToken;
      this.tokenExpiry = Date.now() + 1800000;
    })();

    try {
      await this.loginPromise;
    } catch (error) {
      console.error("Erro ao gerar token AUVO:", error.message);
    } finally {
      this.loginPromise = null;
    }

    return { Authorization: `Bearer ${this.token}` };
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
      console.log(`[AuvoClient] Hitting URL: ${url}`);
      const response = await fetch(url, options);
      console.log(`[AuvoClient] Status: ${response.status}`);

      if (response.status === 401) {
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

  async getApiList(endpoint, params = {}) {
    // Força pageSize 100 por padrão nas APIs de listagem
    const p = { pageSize: 100, ...params };
    const queryString = new URLSearchParams(p).toString();
    const url = `/${endpoint.replace(/^\//, "")}${queryString ? `?${queryString}` : ""}`;
    return this.request(url, "GET");
  }

  // Método auxiliar para varrer TODAS as páginas automaticamente em endpoints secundários
  async getApiListComplete(endpoint, params = {}) {
    let page = 1;
    let hasNextPage = true;
    const completeList = [];

    while (hasNextPage) {
      // console.log(`[AuvoClient] Coletando ${endpoint} - Página ${page}...`);
      const response = await this.getApiList(endpoint, { ...params, page });
      const result = response?.result;
      const items = result?.entityList || [];
      
      if (items.length > 0) {
        completeList.push(...items);
      } else if (Array.isArray(result)) { 
        // Alguns endpoints do AUVO podem cuspir Arrays diretos na raiz se não houver paginação
        completeList.push(...result);
        break;
      }

      const links = result?.links || [];
      hasNextPage = links.some(e => e.rel === "nextPage");
      if (hasNextPage) page++;
    }

    return { result: { entityList: completeList } };
  }

  async getTasks(params = {}) {
    const p = { pageSize: 100, ...params };
    const queryString = new URLSearchParams(p).toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ""}`;
    return this.request(endpoint, "GET");
  }

  async getCustomers(params = {}) {
    const p = { pageSize: 100, ...params };
    const queryString = new URLSearchParams(p).toString();
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
