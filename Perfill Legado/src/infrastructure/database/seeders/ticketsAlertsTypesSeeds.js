import executeQuery from "../queries.js";

class TicketAlertTypesSeeds {

    async addAllseeds() {
        await this.seedDataTicketAlertTypes()
    }

    async seedDataTicketAlertTypes() {


        const sql = `
        INSERT INTO ticket_alert_types (alertTypeId, notificationText, previousNotificationType, actualNotificationType, alertSeverity)
        SELECT alertTypeId, notificationText, previousNotificationType, actualNotificationType, alertSeverity
        FROM (
            SELECT 1 AS alertTypeId, "Ticket NOVO no GLPI sem tratativa por mais de 5 minutos" AS notificationText, "GLPI" AS previousNotificationType, "GLPI" AS actualNotificationType, "Alta" AS alertSeverity
            UNION ALL
            SELECT 2 AS alertTypeId, "Ticket PROATIVO no GLPI sem tarefa no AUVO por mais de 48 horas" AS notificationText, "GLPI" AS previousNotificationType, "AUVO" AS actualNotificationType, "Baixa" AS alertSeverity
            UNION ALL
            SELECT 3 AS alertTypeId, "Ticket PAUSADO no GLPI sem atualizações por mais de 7 dias" AS notificationText, "GLPI" AS previousNotificationType, "GLPI" AS actualNotificationType, "Media" AS alertSeverity
        ) AS temp
        WHERE NOT EXISTS (
            SELECT 1 FROM ticket_alert_types WHERE ticket_alert_types.alertTypeId = temp.alertTypeId
        );
        `;
        return executeQuery(sql);
    }
}

export default new TicketAlertTypesSeeds()
