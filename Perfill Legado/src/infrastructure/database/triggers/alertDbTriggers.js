import executeQuery from "../queries.js";

class AlertsTriggers {
    async createAllTriggers() {
        await this.createTriggerTicketAlertAutomaticUpdate();
    }

    async deleteAllTriggers() {
        await this.deleteTriggerTicketAlertAutomaticUpdate();
    }

    async createTriggerTicketAlertAutomaticUpdate() {
        const sql = `
        CREATE TRIGGER tickets_alert_automatic_update
        AFTER UPDATE ON glpi_tickets
        FOR EACH ROW
        BEGIN
            IF NEW.ticketStatus = 6 THEN
                UPDATE tickets_alerts
                SET checked = 1,
                    justified = "justificado pelo sistema, chamado finalizado"
                WHERE ticketId = NEW.ticketId;
            END IF;
        END;
        `;
        return executeQuery(sql);
    }

    async deleteTriggerTicketAlertAutomaticUpdate() {
        const sql = `DROP TRIGGER IF EXISTS tickets_alert_automatic_update;`;
        return executeQuery(sql);
    }
}

export default new AlertsTriggers();

