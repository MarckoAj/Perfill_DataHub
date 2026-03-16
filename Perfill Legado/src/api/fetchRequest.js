import fetch from "node-fetch";
import urls from "../repositorios/urlsRep.js";
import customDate from "../utils/customDate.js";
import dotenv from "dotenv";

dotenv.config();

class FetchRequest {
  constructor() {
    this.API_KEY = process.env.AUVO_APIKEY;
    this.API_TOKEN = process.env.AUVO_APITOKEN;
  }

  async request(url, method, header, body) {
    const options = { method, headers: header };
    if ((method !== "GET") && (method !== "DELETE")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return response.status !== 200 ? response : response.json()
  }

  async getAuvoAccessToken() {
    const tokensAuvo = {
      apiKey: this.API_KEY,
      apiToken: this.API_TOKEN
    };
    const url = urls.loginAuvoURL(tokensAuvo);
    const data = await this.request(url);
    const accessToken = data.result.accessToken;
    return accessToken;
  }

  async fetchAuvoEntity(endPoint, method, ID, body) {
    const baseUrl = `${urls.auvoBaseUrl()}/${endPoint}`;
    const url = ID === null ? baseUrl : `${baseUrl}/${ID}`;
    const data = await this.request(url, method, await this.auvoHeaderAuthorization(), body);
    console.log(data);
    return data;
  }

  async requestAcessToken() {
    const bodyToken = {
      apiKey: this.API_KEY,
      apiToken: this.API_TOKEN
    };
    const header = {
      "Content-Type": "application/json",
    };
    const url = `${urls.auvoBaseUrl()}/login`
    const data = await this.request(url, "POST", header, bodyToken)
    return data.result.accessToken;
  }

  async auvoHeaderAuthorization() {
    const header = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await this.getAuvoAccessToken()}`
    };
    return header;
  }

  async getAuvoList(endPoint, params = {}, page = 1, selectedFields = "") {
    const param = JSON.stringify(params);
    const url = urls.requestListAuvoURL(endPoint, param, page, selectedFields);
    const data = await this.request(url, "GET", await this.auvoHeaderAuthorization());
    return data;
  }

  hasNextPage(data) {
    const { result } = data;
    const links = result?.links || [];
    return links.some((element) => element.rel === "nextPage");
  }

  async getAuvoListComplete(endPoint, params, selectedFields) {
    const completeList = [];
    let page = 1;
    let hasLinks = false

    do {
      const data = await this.getAuvoList(endPoint, params, page, selectedFields);
      if (data.result) { completeList.push(data.result.entityList || data.result) }
      page++;
      hasLinks = this.hasNextPage(data)
    } while (hasLinks);
    return completeList;
  }

  async requestListTasks(interval, params, selectedFields) {
    const parameters = Object.keys(params).length === 0
      ? { ...customDate.getDate(interval) }
      : { ...customDate.getDate(interval), ...params };
    const data = await this.getAuvoListComplete("tasks", parameters, selectedFields);
    return data;
  }
}


export default new FetchRequest();
