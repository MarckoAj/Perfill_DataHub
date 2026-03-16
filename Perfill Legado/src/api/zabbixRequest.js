import fetch from "node-fetch";
import urls from "../repositorios/urlsRep.js";
import dotenv from "dotenv";

dotenv.config();

class Zabbix {
    constructor() {
        this.ZABBIX_AUTHTOKEN = process.env.ZABBIX_AUTHTOKEN;
    }

    async request(url, method, headers, body) {
        const options = { method, headers };
        if ((method !== "GET") && (method !== "DELETE")) {
            options.body = JSON.stringify(body);
        }
        console.log(options.body);
        const response = await fetch(url, options);
        if (response.status !== 200) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
    }

    async fetchZabbixEntity(endPoint, method, ID, body) {
        const baseUrl = endPoint ? `${urls.zabbixBaseUrl()}/${endPoint}` : urls.zabbixBaseUrl();
        const url = ID === null ? baseUrl : `${baseUrl}/${ID}`;
        const headers = await this.auvoHeaderAuthorization();
        const data = await this.request(url, method, headers, body);
        return data;
    }

    async auvoHeaderAuthorization() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.ZABBIX_AUTHTOKEN}`
        };
    }
}

const body = {
    jsonrpc: '2.0',
    method: "host.get",
    params: {
        output: 'extend',
        filter: {
            status: 0,
        },
        id: 1
    }
};

const teste = new Zabbix();
try {
    const result = await fetch(urls.zabbixBaseUrl(), {
       "method":"POST",
        "header": {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.ZABBIX_AUTHTOKEN}`
        }, "body":JSON.stringify({
            jsonrpc: '2.0',
            "params":{},
            method: "host.get",
            "id":1
        }) 
    })
    console.log( await result.json());
} catch (error) {
    console.error('Error fetching Zabbix entity:', error);
}

export default new Zabbix();
