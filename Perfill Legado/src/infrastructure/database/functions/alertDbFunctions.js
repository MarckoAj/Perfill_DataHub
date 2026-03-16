import executeQuery from "../queries.js";

class AlertDbFunctions {

    async createAllFunctions() {
        await this.createDbFunctionSelectActualStatusByTicketId();
        await this.createDbFunctionSelectPreviousStatusByTicketId();
    }

    async deleteAllFunctions() {
        await this.deleteDbFunctionSelectActualStatusByTicketId();
        await this.deleteDbFunctionSelectPreviousStatusByTicketId();
    }

    async createDbFunctionSelectPreviousStatusByTicketId() {
        const sql = `
        CREATE FUNCTION select_previous_StatusByTicketId(
            ticketId INT, 
            notificationType VARCHAR(50)
        ) RETURNS INT
        READS SQL DATA
        BEGIN
            DECLARE previousStatus INT;

            CASE 
                WHEN notificationType = 'GLPI' THEN 
                    SELECT previousTicketStatus 
                    INTO previousStatus
                    FROM glpi_tickets_updates 
                    WHERE ticketId = ticketId;
                
                WHEN notificationType = 'SLA' THEN 
                    SELECT previousSlaStatus 
                    INTO previousStatus
                    FROM glpi_tickets_updates
                    WHERE ticketId = ticketId;
                
                WHEN notificationType = 'AUVO' THEN 
                    SELECT taskPreviousStatus 
                    INTO previousStatus
                    FROM auvo_tasks_updates
                    WHERE externalId = ticketId;
                
                ELSE 
                    SET previousStatus = NULL;
            END CASE;

            RETURN previousStatus;
        END;
        `;
        return executeQuery(sql);
    }

    async createDbFunctionSelectActualStatusByTicketId() {
        const sql = `
        CREATE FUNCTION select_actual_StatusByTicketId(
            ticketId INT, 
            notificationType VARCHAR(50)
        ) RETURNS INT
        READS SQL DATA
        BEGIN
            DECLARE actualStatus INT;

            CASE 
                WHEN notificationType = 'GLPI' THEN 
                    SELECT ticketStatus 
                    INTO actualStatus
                    FROM glpi_tickets_updates
                    WHERE ticketId = ticketId;
                
                WHEN notificationType = 'SLA' THEN 
                    SELECT slaStatus 
                    INTO actualStatus
                    FROM glpi_tickets_updates
                    WHERE ticketId = ticketId;
                
                WHEN notificationType = 'AUVO' THEN 
                    SELECT taskStatus 
                    INTO actualStatus
                    FROM auvo_tasks_updates
                    WHERE externalId = ticketId;
                
                ELSE 
                    SET actualStatus = NULL;
            END CASE;

            RETURN actualStatus;
        END;
        `;
        return executeQuery(sql);
    }

    async deleteDbFunctionSelectPreviousStatusByTicketId() {
        const sql = `DROP FUNCTION IF EXISTS select_previous_StatusByTicketId;`;
        return executeQuery(sql);
    }

    async deleteDbFunctionSelectActualStatusByTicketId() {
        const sql = `DROP FUNCTION IF EXISTS select_actual_StatusByTicketId;`;
        return executeQuery(sql);
    }
}

export default new AlertDbFunctions();
