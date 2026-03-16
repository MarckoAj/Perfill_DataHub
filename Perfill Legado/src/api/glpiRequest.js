import fetch from "node-fetch";
import urls from "../repositorios/urlsRep.js";
import dotenv from "dotenv";



dotenv.config();

class GlpiRequest {
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
        return response.status !== 200 ? response : response.json()
    }

    async getGlpiHeader() {
        const baseHeader = { 'Content-Type': 'application/json', "Authorization": `user_token ${this.USER_TOKEN}` }
        const initSessionUrl = `${urls.glpiBaseUrl()}/initSession`
        try {
            const data = await this.request(initSessionUrl, "GET", baseHeader)
            const glpiHeader = { 'Content-Type': baseHeader['Content-Type'], 'Session-Token': data['session_token'] }
            return glpiHeader
        } catch (error) {
            console.log(error)
        }
    }

    async glpiRequestData(endPoint, method, body, ID = null) {
        const baseUrl = `${urls.glpiBaseUrl()}/${endPoint}`;
        const url = ID === null ? baseUrl : `${baseUrl}/${ID}`;
        const data = await this.request(url, method, await this.glpiHeader, body);
        return data;
    }

}

// const teste = new GlpiRequest()
// const result = await teste.glpiRequestData(`search/Ticket?criteria[0][field]=2&criteria[0][searchtype]=equals&criteria[0][value]=13707 &range=0-1000`)
// console.log(result)



export default new GlpiRequest();
