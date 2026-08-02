import pool from "../connection.js";

export async function createGlpiSolutionsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS glpi_itilsolutions (
      id BIGINT PRIMARY KEY,
      tickets_id BIGINT NOT NULL,
      solutiontypes_id VARCHAR(255) NULL,
      solutiontype_name VARCHAR(255) NULL,
      content LONGTEXT NULL,
      date_creation DATETIME NULL,
      date_mod DATETIME NULL,
      date_approval DATETIME NULL,
      users_id VARCHAR(255) NULL,
      user_name VARCHAR(255) NULL,
      status INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_glpi_solutions_ticket_mod (tickets_id, date_mod, id),
      KEY idx_glpi_solutions_type (solutiontypes_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(query);
  console.log("Migration GLPI: Tabela 'glpi_itilsolutions' garantida com sucesso.");
}
