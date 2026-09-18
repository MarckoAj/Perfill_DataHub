import dotenv from "dotenv";
import { Agent } from "undici";
import glpiUrlBuilder from "../../utils/glpiUrlBuilder.js";

dotenv.config();

export class GlpiClient {
  constructor() {
    this.userToken = process.env.GLPI_APIKEY;
    this.sessionHeaderPromise = null;
    // Temporary exception is scoped to this client, never to the Node process.
    this.dispatcher = new Agent({
      connect: { rejectUnauthorized: process.env.GLPI_TLS_REJECT_UNAUTHORIZED !== "false" },
    });
  }

  async request(url, method, header, body) {
    const options = {
      method, headers: header, dispatcher: this.dispatcher,
      signal: AbortSignal.timeout(30000), redirect: "error",
    };
    if (method !== "GET" && method !== "DELETE") {
      options.body = JSON.stringify(body || {});
    }
    const response = await fetch(url, options);
    if (response.status !== 200 && response.status !== 206) {
      const payload = await response.json().catch(() => null);
      const code = Array.isArray(payload) ? payload[0] : null;
      return {
        status: response.status,
        errorCode: typeof code === "string" && /^ERROR_[A-Z_]+$/.test(code) ? code : null,
      };
    }
    return { data: await response.json(), headers: response.headers };
  }

  getGlpiHeader() {
    if (!this.sessionHeaderPromise) {
      const pending = this.authenticate().catch((error) => {
        if (this.sessionHeaderPromise === pending) this.sessionHeaderPromise = null;
        throw error;
      });
      this.sessionHeaderPromise = pending;
    }
    return this.sessionHeaderPromise;
  }

  async authenticate() {
    if (!this.userToken) throw new Error("GLPI_APIKEY nao configurada.");
    const baseHeader = {
      "Content-Type": "application/json",
      Authorization: `user_token ${this.userToken}`,
    };
    let response;
    try {
      response = await this.request(`${glpiUrlBuilder.glpiBaseUrl()}/initSession`, "GET", baseHeader);
    } catch (error) {
      const code = error.cause?.code || error.code || error.name;
      throw new Error(`Falha de rede/TLS ao autenticar no GLPI (${code}).`);
    }
    if (!response?.data?.session_token) {
      throw new Error(`Falha ao autenticar no GLPI (HTTP ${response?.status ?? "desconhecido"}, ${response?.errorCode || "sessao ausente"}).`);
    }
    return {
      "Content-Type": "application/json",
      "Session-Token": response.data.session_token,
    };
  }

  isInvalidSession(response) {
    return response?.errorCode === "ERROR_SESSION_TOKEN_INVALID";
  }

  async glpiRequestData(endPoint, method = "GET", body, id = null, options = {}) {
    const baseUrl = `${glpiUrlBuilder.glpiBaseUrl()}/${endPoint}`;
    const url = id === null ? baseUrl : `${baseUrl}/${id}`;
    let session = this.getGlpiHeader();
    let response = await this.request(url, method, await session, body);
    if (this.isInvalidSession(response)) {
      // A delayed rejection of an old session must not invalidate a newer one.
      if (this.sessionHeaderPromise === session) this.sessionHeaderPromise = null;
      session = this.getGlpiHeader();
      response = await this.request(url, method, await session, body);
      // Retry only once; the next independent call may authenticate again.
      if (this.isInvalidSession(response) && this.sessionHeaderPromise === session) {
        this.sessionHeaderPromise = null;
      }
    }
    if (!response || response.data === undefined) {
      if (!options.suppressErrorLog) {
        console.error(`Erro na requisicao GLPI (HTTP ${response?.status ?? "desconhecido"}, ${response?.errorCode || "resposta inesperada"}).`);
      }
      return null;
    }
    return response;
  }
}

export default new GlpiClient();
