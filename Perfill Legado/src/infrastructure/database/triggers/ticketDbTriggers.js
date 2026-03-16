import executeQuery from "../queries.js";

class TicketDbTriggers {
    async createAllTriggers() {
        await this.createTriggerInsertTicketAtualization();
        await this.createTriggerUpdateTicketAtualization();
    }

    async deleteAllTriggers() {
        await this.deleteTriggerInsertTicketAtualization();
        await this.deleteTriggerUpdateTicketAtualization();
    }

    async createTriggerInsertTicketAtualization() {
        const sql = `
            CREATE TRIGGER insert_ticket_atualization
            AFTER INSERT
            ON glpi_tickets
            FOR EACH ROW
            BEGIN
                INSERT INTO  glpi_tickets_updates (ticketId, ticketStatus, slaStatus, lastTicketUpdate )
                VALUES (NEW.ticketId, NEW.ticketStatus, NEW.slaStatus, NEW.lastTicketUpdate );
            END;
        `;
        return executeQuery(sql);
    }

    async createTriggerUpdateTicketAtualization() {
        const sql = `
            CREATE TRIGGER update_ticket_atualization
            AFTER UPDATE
            ON glpi_tickets
            FOR EACH ROW
            BEGIN
                UPDATE glpi_tickets_updates 
                SET previousTicketStatus = OLD.ticketStatus, 
                    ticketStatus = NEW.ticketStatus, 
                    previousSlaStatus = OLD.slaStatus, 
                    lastTicketUpdate  = NEW.lastTicketUpdate 
                WHERE ticketId = NEW.ticketId;
            END;
        `;
        return executeQuery(sql);
    }

    async deleteTriggerInsertTicketAtualization() {
        const sql = `DROP TRIGGER IF EXISTS insert_ticket_atualization;`
        return executeQuery(sql);
    }

    async deleteTriggerUpdateTicketAtualization() {
        const sql = `DROP TRIGGER IF EXISTS update_ticket_atualization;`
        return executeQuery(sql);
    }
}

export default new TicketDbTriggers();

