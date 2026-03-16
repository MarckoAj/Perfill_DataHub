import executeQuery from "../queries.js";

class TicketsAlerts {

  async createAllTables() {
    try {
      await this.createTableTicketAlertType()
      await this.createTableTicketAlert()
    } catch (error) {
      throw error
    }

  }

  async createTableTicketAlertType() {
    const sql = `
        CREATE TABLE IF NOT EXISTS \`auvodb\`.\`ticket_alert_types\` (
          \`alertTypeId\` INT PRIMARY KEY AUTO_INCREMENT,
          \`notificationText\` TEXT,
          \`previousNotificationType\` VARCHAR(50),
          \`actualNotificationType\` VARCHAR(50),
          \`alertSeverity\` VARCHAR(50)
        )
        ENGINE = InnoDB;
        `;
    return executeQuery(sql);
  }

  async createTableTicketAlert() {
    const sql = `
    CREATE TABLE IF NOT EXISTS \`auvodb\`.\`tickets_alerts\` (
      \`alertId\` INT PRIMARY KEY AUTO_INCREMENT,
      \`alertTypeId\` INT NOT NULL,
      \`ticketId\` INT NOT NULL,
      \`checked\` TINYINT DEFAULT 0,
      \`justifiedText\` TEXT,
      CONSTRAINT \`fk_ticket_alert_alert_type_id\`
        FOREIGN KEY (\`alertTypeId\`)
        REFERENCES \`auvodb\`.\`ticket_alert_types\` (\`alertTypeId\`),
      CONSTRAINT \`fk_ticket_alert_ticket_id\`
        FOREIGN KEY (\`ticketId\`)
        REFERENCES \`auvodb\`.\`glpi_tickets\` (\`ticketId\`)
    )
    ENGINE = InnoDB;
    `;
    return executeQuery(sql);
  }


}

export default new TicketsAlerts();
