import fetch from "node-fetch";
import urls from "../repositorios/urlsRep.js";
import dotenv from "dotenv";
dotenv.config();

// Configurações da API do Zabbix
const zabbixUrl = urls.zabbixBaseUrl(); // Certifique-se de que esta função retorne a URL correta
const zabbixToken = process.env.ZABBIX_AUTHTOKEN; // Certifique-se de que esta variável de ambiente esteja definida

// Função para fazer a requisição à API do Zabbix
async function getHosts() {
  try {
    const response = await fetch(zabbixUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization':`Bearer e717fa11c4e4566a486b8fabb8e187e171f5ffced851353af37edb92da7ee6a6`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'host.get',
        params: {
          output: 'extend',
          filter: {
            status: 0, // 0 significa ativo
          },
        },
        id: 1, // ID da requisição JSON-RPC
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Hosts:', data);
  } catch (error) {
    console.error('Erro ao obter hosts:', error);
  }
}

console.log(zabbixToken)
// Chama a função para obter hosts
getHosts();
