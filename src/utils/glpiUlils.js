import he from "he"
import customDate from "./customDate.js";



class GlpiUltils {

  decodeHtmlEntities(str) {
    return he.decode(str);
  }

  removeHtmlTags(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  removePTags(str) {
    return str.replace(/(^<\/?p>|<\/?p>$)/g, '').trim();
  }



  removeLineBreaksAndAttachments(str) {
    return str.replace(/\n/g, '').replace(/<a[^>]*>.*?<\/a>/g, '').trim();
  }

  checkSLAStatus(handlingTime, openDate, statusId, solutionDate) {
    const isFinished = statusId === 5 || statusId === 6;
    const referenceDate = (isFinished && solutionDate) ? solutionDate : undefined;

    const totalSla = customDate.calculateTimeDif(handlingTime, openDate)
    const executionTime = customDate.calculateTimeDif(handlingTime, referenceDate)

    let slaStatus

    if (executionTime < 0) {
      slaStatus = 3

    } else if (executionTime < totalSla / 2) {
      slaStatus = 2
    }
    else {
      slaStatus = 1
    }

    return slaStatus
  }

  handlingTimeSlaText(handlingTimeSla, ticketStatus, solutionDate) {
    let text
    if (handlingTimeSla === null) {
      text = "Proativo"
    } else if (ticketStatus === 4) {
      text = "SLA Pausado"
    } else {
      const isFinished = ticketStatus === 5 || ticketStatus === 6;
      const referenceDate = (isFinished && solutionDate) ? solutionDate : undefined;
      text = customDate.calculateTimeInterval(handlingTimeSla, referenceDate)
    }
    return text
  }


  processTickets(tickets) {
    return tickets.map(ticket => {
      const title = ticket[1].replace(/-/g, ' ')
      const slaField = ticket['7'].split('>').pop().trim();
      const cleanDescription = this.decodeHtmlEntities(ticket['21'] || '');
      const withoutHtmlTags = this.removeHtmlTags(cleanDescription);
      const descriptionField = this.removePTags(this.removeLineBreaksAndAttachments(withoutHtmlTags));
      const filterCustomer = ticket['83'].split('>');
      const customerNameField = filterCustomer.slice(-1);
      const statusId = parseInt(ticket['12'], 10);
      const solutionDate = ticket['17'] || null;
      const status = this.checkSLAStatus(ticket['151'], ticket['15'], statusId, solutionDate)
      const handlingTimeSla = this.handlingTimeSlaText(ticket['151'], statusId, solutionDate)

      return {
        ticketId: ticket['2'],
        customerName: customerNameField[0],
        ticketTitle: title,
        description: descriptionField,
        openDate: ticket['15'],
        ticketStatus: ticket['12'],
        lastAtualization: ticket['19'],
        categorySla: slaField,
        slaTime: handlingTimeSla,
        slaStatus: status,
        reasonForPause: ticket['400'],
        atribuiedUserId: ticket['5']
      };
    });
  }

}



export default new GlpiUltils()
