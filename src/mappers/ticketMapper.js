import he from "he";
import customDate from "../utils/customDate.js";
import ticketStatusMapper from "./ticketStatusMapper.js";

class TicketMapper {
  constructor() {
    this.glpiTicketStatus = Object.fromEntries(
      ticketStatusMapper
        .getAllStatusNames()
        .map((statusName) => [String(ticketStatusMapper.toGlpiStatusId(statusName)), statusName])
    );
  }
  decodeHtmlEntities(str) {
    return he.decode(str);
  }

  removeHtmlTags(str) {
    return str.replace(/<[^>]*>/g, "");
  }

  removePTags(str) {
    return str.replace(/(^<\/?p>|<\/?p>$)/g, "").trim();
  }

  removeLineBreaksAndAttachments(str) {
    return str
      .replace(/\n/g, "")
      .replace(/<a[^>]*>.*?<\/a>/g, "")
      .trim();
  }

  checkSLAStatus(handlingTime, openDate, statusId, solutionDate) {
    // Se o chamado está solucionado (5) ou fechado (6), usamos a data de solução como referência
    // Caso contrário (está aberto ou foi reaberto), usamos o horário atual.
    const isFinished = statusId === 5 || statusId === 6;
    const referenceDate = (isFinished && solutionDate) ? solutionDate : undefined;

    const totalSla = customDate.calculateTimeDif(handlingTime, openDate);
    const executionTime = customDate.calculateTimeDif(handlingTime, referenceDate);

    let slaStatus;

    if (executionTime < 0) {
      slaStatus = "Vencido";
    } else if (executionTime < totalSla / 2) {
      slaStatus = "Atenção";
    } else {
      slaStatus = "No prazo";
    }

    return slaStatus;
  }

  handlingTimeSlaText(handlingTimeSla, ticketStatus, solutionDate) {
    let text;
    if (handlingTimeSla === null) {
      text = "Proativo";
    } else if (ticketStatus === 4) {
      text = "SLA Pausado";
    } else {
      // Se resolvido/fechado, congela o texto do intervalo usando a data de solução
      const isFinished = ticketStatus === 5 || ticketStatus === 6;
      const referenceDate = (isFinished && solutionDate) ? solutionDate : undefined;
      text = customDate.calculateTimeInterval(handlingTimeSla, referenceDate);
    }
    return text;
  }

  parsePositiveInteger(value) {
    if (value === null || value === undefined || value === "" || value === "&nbsp;") {
      return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  extractLocationId(ticket) {
    const directLocationId = this.parsePositiveInteger(
      ticket.locations_id ??
      ticket.location_id ??
      ticket.idLocalizacaoPonto ??
      ticket["locations_id"] ??
      ticket["83_id"] ??
      ticket["83.id"]
    );

    if (directLocationId) {
      return directLocationId;
    }

    if (Array.isArray(ticket.links)) {
      const locationLink = ticket.links.find((link) => link?.rel === "Location" && link?.href);
      const match = locationLink?.href?.match(/\/Location\/(\d+)(?:\D*$|$)/);
      return match ? this.parsePositiveInteger(match[1]) : null;
    }

    return null;
  }

  processTickets(tickets) {
    if (!Array.isArray(tickets)) {
      return [];
    }
    return tickets.map((ticket) => {
      const rawTitulo = ticket[1] || "Sem Título";
      const titulo = typeof rawTitulo === 'string' ? rawTitulo.replace(/-/g, " ") : "Sem Título";
      
      const rawCategoriaSla = ticket["7"] || "";
      const categoriaSla = rawCategoriaSla.includes(">") ? rawCategoriaSla.split(">").pop().trim() : (rawCategoriaSla.trim() || "Geral");
      
      const cleanDescription = this.decodeHtmlEntities(ticket["21"] || "");
      const withoutHtmlTags = this.removeHtmlTags(cleanDescription);
      const descricao = this.removePTags(
        this.removeLineBreaksAndAttachments(withoutHtmlTags)
      );

      const rawCustomer = ticket["83"] || "";
      const filterCustomer = rawCustomer.includes(">") ? rawCustomer.split(">") : [rawCustomer];
      const [nomeCliente] = filterCustomer.slice(-1);
      
      const statusId = parseInt(ticket["12"], 10);
      const solutionDate = ticket["17"] || null;

      const statusSla = this.checkSLAStatus(ticket["151"], ticket["15"], statusId, solutionDate);
      const tempoSla = this.handlingTimeSlaText(ticket["151"], statusId, solutionDate);

      let projeto = "Outros";
      if (rawCustomer.includes("> PI-NOVO >") || rawCustomer.includes("> PI NOVO >")) {
          projeto = "PI-NOVO";
      } else if (rawCustomer.includes("> LEGADO >")) {
          projeto = "LEGADO";
      } else if (rawCustomer.includes("> CFTV >")) {
          projeto = "CFTV";
      }

      const rawTipo = ticket["80"] || "";
      const filterTipo = rawTipo.includes(">") ? rawTipo.split(">") : [rawTipo];
      const [tipo] = filterTipo.slice(-1);

      return {
        ticketId: ticket["2"],
        nomeCliente: nomeCliente ? nomeCliente.trim() : "Não informado",
        idLocalizacaoPonto: this.extractLocationId(ticket),
        titulo,
        descricao,
        dataCriacao: ticket["15"],
        status: this.glpiTicketStatus[ticket["12"]] || "Indefinido",
        dataFechamento: ticket["16"] || null,
        dataSolucao: solutionDate,
        dataAtualizacao: ticket["19"],
        categoriaSla,
        tempoSla,
        statusSla,
        motivoPausa: ticket["400"] || null,
        idTecnicoAtribuido: ticket["5"] || null,
        tipo: tipo ? tipo.trim() : "Não informado",
        projeto: projeto
      };
    });
  }
}

export default new TicketMapper();

