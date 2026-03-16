import executeQuery from "../queries.js";


class GlpiTickets {

  async createAllTables() {
    try {

      await this.createTableGlpiTickets()
      await this.createTableGlpiTicketsUpdates()

    } catch (error) {
      throw error
    }

  }

  async createTableGlpiTickets() {
    const sql = `
          CREATE TABLE IF NOT EXISTS \`auvodb\`.\`glpi_tickets\` (
            \`ticketId\` INT PRIMARY KEY,
            \`customerName\` VARCHAR(100),
            \`ticketTitle\` VARCHAR(100),
            \`ticketDescription\` TEXT,
            \`ticketOpenDate\` DATETIME,
            \`ticketStatus\` INT,
            \`lastTicketUpdate\` DATETIME,
            \`slaCategory\` VARCHAR(100),
            \`slaTime\` VARCHAR(50),
            \`slaStatus\` INT,
            \`reasonForPause\` TEXT,
            \`userAtibuiedId\` INT
          )
          ENGINE = InnoDB
        `;
    return executeQuery(sql);
  }

  async createTableGlpiTicketsUpdates() {
    const sql = `
          CREATE TABLE IF NOT EXISTS \`auvodb\`.\`glpi_tickets_updates\` (
            \`ticketUpdateId\` INT PRIMARY KEY AUTO_INCREMENT,
            \`ticketId\` INT NOT NULL,
            \`previousTicketStatus\` INT,
            \`ticketStatus\` INT,
            \`previousSlaStatus\` INT,
            \`slaStatus\` INT,
            \`lastTicketUpdate\` DATETIME,
           CONSTRAINT \`fk_ticket_id\`
              FOREIGN KEY (\`ticketId\`)
              REFERENCES \`auvodb\`.\`glpi_tickets\` (\`ticketId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION
          )
          ENGINE = InnoDB;
        `;
    return executeQuery(sql);
  }



}
export default new GlpiTickets()