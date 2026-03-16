import executeQuery from "../queries.js";



class Customers {

  async createAllTables() {
    await this.createTableCustomers()
    await this.createTableCustomer_Groups()
    await this.createTableCustomers_Managers()
    await this.createTableCustomers_Contacts()
    await this.createTableCustomers_UriAttachments()
    await this.createTableCustomers_Emails()
  }

  async createTableCustomers() {

    const sql = `
         CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_auvo\` (
            \`customerId\` INT NOT NULL,
            \`externalId\` VARCHAR(100) NULL,
            \`description\` TEXT NULL,
            \`cpfCnpj\` VARCHAR(50) NULL,
            \`manager\` VARCHAR(100) NULL,
            \`note\` TEXT NULL,
            \`address\` TEXT NULL,
            \`addressComplement\` TEXT NULL,
            \`latitude\` VARCHAR(30) NULL,
            \`longitude\` VARCHAR(30) NULL,
            \`uriAttachments\` TEXT NULL,
            \`active\` TINYINT NULL,
            \`dateLastUpdate\` DATETIME NULL,
            \`creationDate\` DATETIME NULL,
            \`segmentId\` INT NOT NULL,
            PRIMARY KEY (\`customerId\`),
            INDEX \`fk_customers_segments1_idx\` (\`segmentId\` ASC) VISIBLE,
            CONSTRAINT \`fk_customers_segments1\`
              FOREIGN KEY (\`segmentId\`)
              REFERENCES \`auvodb\`.\`segments_auvo\` (\`segmentId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION)
          ENGINE = InnoDB
          PACK_KEYS = DEFAULT
          ROW_FORMAT = DYNAMIC;
          `
    return executeQuery(sql)
  }


  async createTableCustomers_Managers() {

    const sql = `
         CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_managers\` (
            \`userId\` INT NOT NULL,
            \`customerId\` INT NOT NULL,
            INDEX \`fk_users_has_customer_customer1_idx\` (\`customerId\` ASC) VISIBLE,
            INDEX \`fk_users_has_customer_users1_idx\` (\`userId\` ASC) VISIBLE,
            CONSTRAINT \`fk_users_has_customer_users1\`
              FOREIGN KEY (\`userId\`)
              REFERENCES \`auvodb\`.\`users_auvo\` (\`userId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION,
            CONSTRAINT \`fk_users_has_customer_customer1\`
              FOREIGN KEY (\`customerId\`)
              REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION)
          ENGINE = InnoDB
          DEFAULT CHARACTER SET = utf8mb3;`
    return executeQuery(sql)
  }


  async createTableCustomer_Groups() {
    const sql = `
         CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_groups\` (
            \`customerId\` INT NOT NULL,
            \`groupId\` INT NOT NULL,
            PRIMARY KEY (\`customerId\`, \`groupId\`),
            INDEX \`fk_customer_has_groups_groups1_idx\` (\`groupId\` ASC) VISIBLE,
            INDEX \`fk_customer_has_groups_customer1_idx\` (\`customerId\` ASC) VISIBLE,
            CONSTRAINT \`fk_customer_has_groups_customer1\`
              FOREIGN KEY (\`customerId\`)
              REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION,
            CONSTRAINT \`fk_customer_has_groups_groups1\`
              FOREIGN KEY (\`groupId\`)
              REFERENCES \`auvodb\`.\`groups_auvo\` (\`groupId\`))
          ENGINE = InnoDB; `
    return executeQuery(sql)
  }


  async createTableCustomers_Contacts() {
    const sql = `
         CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_contacts\` (
            \`contactId\` INT NOT NULL,
            \`customerId\` INT NOT NULL,
            \`description\` TEXT NULL,
            \`contactJobPosition\` VARCHAR(45) NULL,
            \`contactEmail\` VARCHAR(45) NULL,
            \`contactPhone\` VARCHAR(45) NULL,
            \`contactName\` VARCHAR(45) NULL,
            INDEX \`fk_contacts_customers1_idx\` (\`customerId\` ASC) VISIBLE,
            CONSTRAINT \`fk_contacts_customers1\`
              FOREIGN KEY (\`customerId\`)
              REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION)
          ENGINE = InnoDB; `
    return executeQuery(sql)
  }


  async createTableCustomers_UriAttachments() {
    const sql = `
          CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_uriAttachments\` (
            \`uriAttachmentsId\` INT NOT NULL AUTO_INCREMENT,
            \`urls\` TEXT NULL,
            \`customerId\` INT NOT NULL,
            PRIMARY KEY (\`uriAttachmentsId\`),
            INDEX \`fk_uriAttachments_customers1_idx\` (\`customerId\` ASC) VISIBLE,
            CONSTRAINT \`fk_uriAttachments_customers1\`
              FOREIGN KEY (\`customerId\`)
              REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
              ON DELETE NO ACTION
              ON UPDATE NO ACTION)
          ENGINE = InnoDB; `
    return executeQuery(sql)
  }


  async createTableCustomers_Emails() {
    const sql = `
        CREATE TABLE IF NOT EXISTS \`auvodb\`.\`customers_emails\` (
          \`customerId\` INT NOT NULL,
          \`customer_email\` VARCHAR(45) NULL,
          INDEX \`fk_emails_customers1_idx\` (\`customerId\`),
          CONSTRAINT \`fk_emails_customers1\`
            FOREIGN KEY (\`customerId\`)
            REFERENCES \`auvodb\`.\`customers_auvo\` (\`customerId\`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        ) ENGINE = InnoDB; `
    return executeQuery(sql)
  }

}

export default new Customers()