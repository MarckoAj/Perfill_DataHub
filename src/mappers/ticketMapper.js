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

  checkSLAStatus(handlingTime, openDate) {
    const totalSla = customDate.calculateTimeDif(handlingTime, openDate);
    const executionTime = customDate.calculateTimeDif(handlingTime);

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

  handlingTimeSlaText(handlingTimeSla, ticketStaus) {
    let text;
    if (handlingTimeSla === null) {
      text = "Proativo";
    } else if (ticketStaus === 4) {
      text = "SLA Pausado";
    } else {
      text = customDate.calculateTimeInterval(handlingTimeSla);
    }
    return text;
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
      
      const statusSla = this.checkSLAStatus(ticket["151"], ticket["15"]);
      const tempoSla = this.handlingTimeSlaText(ticket["151"], ticket["12"]);

      return {
        ticketId: ticket["2"],
        nomeCliente: nomeCliente ? nomeCliente.trim() : "Não informado",
        titulo,
        descricao,
        dataCriacao: ticket["15"],
        status: this.glpiTicketStatus[ticket["12"]] || "Indefinido",
        dataFechamento: null,
        dataAtualizacao: ticket["19"],
        categoriaSla,
        tempoSla,
        statusSla,
        motivoPausa: ticket["400"] || null,
        idTecnicoAtribuido: ticket["5"] || null,
      };
    });
  }
}

export default new TicketMapper();

