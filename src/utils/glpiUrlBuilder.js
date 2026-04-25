import dotenv from "dotenv";

dotenv.config();

const GLPI_BASE_URL = process.env.GLPI_BASE_URL;

class GlpiUrlBuilder {
  glpiBaseUrl() {
    return `${GLPI_BASE_URL.replace(/\/$/, "")}/apirest.php`;
  }

  requestGlpiEndpointByStatus(status) {
    // status 7 = chamados em atraso (lateEndpoint)
    if (status === 7) {
      const params = new URLSearchParams();
      params.set("criteria[0][field]", "12");
      params.set("criteria[0][searchtype]", "equals");
      params.set("criteria[0][value]", "notold");

      params.set("criteria[1][link]", "AND");

      params.set("criteria[1][criteria][0][field]", "82");
      params.set("criteria[1][criteria][0][searchtype]", "equals");
      params.set("criteria[1][criteria][0][value]", "1");

      params.set("criteria[1][criteria][1][link]", "OR");
      params.set("criteria[1][criteria][1][field]", "182");
      params.set("criteria[1][criteria][1][searchtype]", "equals");
      params.set("criteria[1][criteria][1][value]", "1");

      params.set("criteria[1][criteria][2][link]", "OR");
      params.set("criteria[1][criteria][2][field]", "159");
      params.set("criteria[1][criteria][2][searchtype]", "equals");
      params.set("criteria[1][criteria][2][value]", "1");

      params.set("criteria[1][criteria][3][link]", "OR");
      params.set("criteria[1][criteria][3][field]", "187");
      params.set("criteria[1][criteria][3][searchtype]", "equals");
      params.set("criteria[1][criteria][3][value]", "1");

      this._appendForceDisplay(params);
      params.set("reset", "reset");

      return `search/Ticket?${params.toString()}`;
    }

    const params = new URLSearchParams({
      "criteria[0][field]": "12",
      "criteria[0][searchtype]": "equals",
      "criteria[0][value]": String(status),
      range: "0-1000",
    });

    this._appendForceDisplay(params);

    return `search/Ticket?${params.toString()}`;
  }

  requestGlpiEndpointIncremental(start, end) {
    const params = new URLSearchParams({
      "criteria[1][link]": "AND",
      "criteria[1][field]": "12", // Status
      "criteria[1][searchtype]": "equals",
      "criteria[1][value]": "all",
      range: `${start}-${end}`,
      sort: "2", // Sort by ID
      order: "ASC"
    });

    this._appendForceDisplay(params);
    return `search/Ticket?${params.toString()}`;
  }

  requestGlpiEndpointModifiedSince(lastSyncDate) {
    const params = new URLSearchParams({
      "criteria[0][field]": "19", // date_mod
      "criteria[0][searchtype]": "morethan",
      "criteria[0][value]": lastSyncDate,
      "criteria[1][link]": "AND",
      "criteria[1][field]": "12",
      "criteria[1][searchtype]": "equals",
      "criteria[1][value]": "all",
      range: "0-100",
      sort: "19", // Sort by date_mod
      order: "ASC"
    });

    this._appendForceDisplay(params);
    return `search/Ticket?${params.toString()}`;
  }

  _appendForceDisplay(params) {
    // Força o GLPI a retornar Entity (80), Location (83) e Assigments além dos defaults, formatados em String.
    const requiredFields = [1, 2, 5, 7, 12, 15, 16, 17, 19, 21, 80, 83, 151, 400];
    requiredFields.forEach((fieldId, index) => {
        params.set(`forcedisplay[${index}]`, String(fieldId));
    });
  }
}

export default new GlpiUrlBuilder();
