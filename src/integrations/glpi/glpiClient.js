import dotenv from "dotenv";
import glpiUrlBuilder from "../../utils/glpiUrlBuilder.js";

dotenv.config();

class GlpiClient {
  constructor() {
    this.userToken = process.env.GLPI_APIKEY;
    this.sessionHeaderPromise = this.getGlpiHeader();
  }

  async request(url, method, header, body) {
    const options = { method, headers: header };

    if (method !== "GET" && method !== "DELETE") {
      options.body = JSON.stringify(body || {});
    }

    const response = await fetch(url, options);

    if (response.status !== 200 && response.status !== 206) {
      return response;
    }

    const data = await response.json();
    return { data };
  }

  async getGlpiHeader() {
    const baseHeader = {
      "Content-Type": "application/json",
      Authorization: `user_token ${this.userToken}`,
    };

    const initSessionUrl = `${glpiUrlBuilder.glpiBaseUrl()}/initSession`;

    try {
      const response = await this.request(initSessionUrl, "GET", baseHeader);

      if (!response?.data?.session_token) {
        console.error("Falha ao obter session_token. Resposta:", response);
        return null;
      }

      return {
        "Content-Type": "application/json",
        "Session-Token": response.data.session_token,
      };
    } catch (error) {
      console.error("Erro ao inicializar sessão GLPI:", error);
      return null;
    }
  }

  async glpiRequestData(endPoint, method = "GET", body, id = null) {
    const baseUrl = `${glpiUrlBuilder.glpiBaseUrl()}/${endPoint}`;
    const url = id === null ? baseUrl : `${baseUrl}/${id}`;

    const header = await this.sessionHeaderPromise;

    if (!header) {
      console.error("Tentativa de requisição sem header de autenticação válido.");
      return null;
    }

    const response = await this.request(url, method, header, body);

    if (!response || response.data === undefined) {
      console.error(`Erro na requisição GLPI: ${endPoint}`);
      return null;
    }

    return response.data;
  }
}

export default new GlpiClient();
