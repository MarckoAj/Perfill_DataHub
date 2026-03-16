import executeQuery from "../infrastructure/database/queries.js";

class TicketsGLPI {
    selecTicketAlert(ticket) {
        const sql = 'SELECT * FROM tickets_alerts WHERE  ticketId = ? AND alertTypeId = ?'
        const values = Object.values(ticket)
        return executeQuery(sql, values)
    }

    selecTicketById(ticketId) {
        const sql = 'SELECT * FROM glpi_tickets WHERE ticketId = ?'
        return executeQuery(sql, ticketId)
    }

    selectTicketsOpened() {
        const sql = 'SELECT * FROM glpi_tickets WHERE ticketStatus != 5'
        return executeQuery(sql)
    }

    selectTicketsByStatus(ticketStatus) {
        const sql = 'SELECT * FROM glpi_tickets WHERE ticketStatus  = ?'
        return executeQuery(sql, ticketStatus)
    }

    insertTicketAlert(ticket) {
        const sql = 'INSERT INTO  tickets_alerts  ( ticketId, alertTypeId ) VALUES (?, ?)'
        const values = Object.values(ticket)
        return executeQuery(sql, values)
    }

    insertTicket(ticket) {
        const sql = "INSERT INTO glpi_tickets (ticketId,customerName,ticketTitle,ticketDescription,ticketOpenDate,ticketStatus,lastTicketUpdate ,slaCategory,slaTime,slaStatus,reasonForPause,userAtibuiedId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        const values = Object.values(ticket)
        return executeQuery(sql, values)
    }

    updateTicket(ticket) {
        const sql = "UPDATE glpi_tickets SET customerName = ?, ticketTitle = ?, ticketDescription = ?, ticketOpenDate = ? , ticketStatus = ? ,lastTicketUpdate  = ?, slaCategory = ?, slaTime = ?, slaStatus = ?,reasonForPause = ?, userAtibuiedId = ? WHERE  ticketId = ?"
        const values = Object.values(ticket)
        values.push(values.shift())
        return executeQuery(sql, values)
    }

    updateTicketAlert(ticket) {
        const sql = "UPDATE tickets_alerts SET checked = ?,   justifiedText = ?  WHERE  ticketId = ?  AND alertTypeId = ? "
        const values = Object.values(ticket)
        return executeQuery(sql, values)

    }

}

export default new TicketsGLPI