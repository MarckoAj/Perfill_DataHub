class Urls {

  auvoBaseUrl() {
    return `https://api.auvo.com.br/v2`
  }

  glpiBaseUrl() {
    return `http://10.10.10.203/apirest.php`
  }

  zabbixBaseUrl() {
    return `http://10.10.10.214/zabbix/api_jsonrpc.php`
  }

  loginAuvoURL(tokens) {
    return `${this.auvoBaseUrl()}/login/?apiKey=${tokens.apiKey}&apiToken=${tokens.apiToken}`;
  }


  requestListAuvoURL(endPoint, paramFilter, page = 1, selectfields) {
    return `${this.auvoBaseUrl()}/${endPoint}/?paramFilter=${paramFilter}&page=${page}&pageSize=100&order=0&selectfields=${selectfields}`;
  }

  requestGlpiEndpointByStatus(status) {
    const searchEndpoint = `search/Ticket?criteria[0][field]=12&criteria[0][searchtype]=equals&criteria[0][value] = ${status}&range=0-1000`
    const lateEndpoint = "search/Ticket?criteria[0][field]=12&criteria[0][searchtype]=equals&criteria[0][value]=notold&criteria[1][link]=AND&criteria[1][criteria][0][field]=82&criteria[1][criteria][0][searchtype]=equals&criteria[1][criteria][0][value]=1&criteria[1][criteria][1][link]=OR&criteria[1][criteria][1][field]=182&criteria[1][criteria][1][searchtype]=equals&criteria[1][criteria][1][value]=1&criteria[1][criteria][2][link]=OR&criteria[1][criteria][2][field]=159&criteria[1][criteria][2][searchtype]=equals&criteria[1][criteria][2][value]=1&criteria[1][criteria][3][link]=OR&criteria[1][criteria][3][field]=187&criteria[1][criteria][3][searchtype]=equals&criteria[1][criteria][3][value]=1&reset=reset"

    return status === 7 ? lateEndpoint : searchEndpoint

  }

  requestGlpiEndpointByTicketId(ticketId) {
    return `search/Ticket?criteria[0][field]=2&criteria[0][searchtype]=equals&criteria[0][value] = ${ticketId}&range=0-1000`
  }




}
export default new Urls();
