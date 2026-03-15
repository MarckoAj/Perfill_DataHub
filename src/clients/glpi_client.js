import glpiUrlBuilder from "../utils/glpiUrlBuilder.js";
import dotenv from "dotenv";



dotenv.config();

class GlpiService {
    constructor() {
        this.USER_TOKEN = process.env.GLPI_APIKEY,
            this.glpiHeader = this.getGlpiHeader()
    };


    async request(url, method, header, body) {
        const options = { method, headers: header };
        if ((method !== "GET") && (method !== "DELETE")) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);

        if (response.status !== 200 && response.status !== 206) return response;

        const data = await response.json();

        // Extrair total do header Content-Range: 0-99/1450
        const contentRange = response.headers.get('content-range');
        let totalCount = Array.isArray(data) ? data.length : 0;

        if (contentRange) {
            const total = contentRange.split('/')[1];
            if (total) totalCount = parseInt(total, 10);
        }

        return { data, totalCount };
    }

    async getGlpiHeader() {
        const baseHeader = { 'Content-Type': 'application/json', "Authorization": `user_token ${this.USER_TOKEN}` }
        const initSessionUrl = `${glpiUrlBuilder.glpiBaseUrl()}/initSession`
        try {
            const response = await this.request(initSessionUrl, "GET", baseHeader)

            // Verifica se a resposta foi bem-sucedida antes de acessar .data
            if (!response || !response.data || !response.data.session_token) {
                console.error("Falha ao obter session_token. Resposta:", response);
                return null;
            }

            const data = response.data;
            const glpiHeader = { 'Content-Type': baseHeader['Content-Type'], 'Session-Token': data['session_token'] }
            return glpiHeader
        } catch (error) {
            console.error("Erro ao inicializar sessão GLPI:", error);
            return null;
        }
    }

    async glpiRequestData(endPoint, method, body, ID = null) {
        const baseUrl = `${glpiUrlBuilder.glpiBaseUrl()}/${endPoint}`;
        const url = ID === null ? baseUrl : `${baseUrl}/${ID}`;

        const header = await this.glpiHeader;
        if (!header) {
            console.error("Tentativa de requisição sem header de autenticação válido.");
            return null;
        }

        const response = await this.request(url, method, header, body);

        // Se a requisição não foi bem-sucedida, loga o erro e retorna null
        if (!response || response.data === undefined) {
            console.error(`Erro na requisição GLPI: ${endPoint}`);
            return null;
        }

        return response.data
    }

}




export default new GlpiService();
