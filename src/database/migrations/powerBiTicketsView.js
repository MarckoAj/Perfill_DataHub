import pool from "../connection.js";

function assertSafeIdentifier(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Identificador SQL invalido: ${identifier}`);
  }
}

async function addIndexIfMissing(tableName, indexName, columnsSql) {
  assertSafeIdentifier(tableName);
  assertSafeIdentifier(indexName);

  const expectedColumns = columnsSql
    .split(",")
    .map((column) => column.trim().replace(/`/g, ""))
    .filter(Boolean);

  const [existingColumns] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      ORDER BY SEQ_IN_INDEX
    `,
    [tableName, indexName]
  );

  if (existingColumns.length > 0) {
    const currentColumns = existingColumns.map((row) => row.COLUMN_NAME);
    if (currentColumns.join(",") === expectedColumns.join(",")) {
      console.log(`Migration Power BI: Indice '${indexName}' ja existe em '${tableName}'.`);
      return;
    }

    await pool.query(`ALTER TABLE ${tableName} DROP INDEX ${indexName}`);
    console.log(
      `Migration Power BI: Indice '${indexName}' recriado em '${tableName}' (${currentColumns.join(",")} -> ${expectedColumns.join(",")}).`
    );
  }

  await pool.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${columnsSql})`);
  console.log(`Migration Power BI: Indice '${indexName}' criado em '${tableName}'.`);
}

export async function createPowerBiTicketsView() {
  const viewQuery = `
    CREATE OR REPLACE VIEW vw_powerbi_tickets AS
    SELECT
      t.ticketId,
      t.nomeCliente,
      t.idLocalizacaoPonto,
      t.titulo,
      t.descricao,
      t.dataCriacao,
      t.status,
      t.dataFechamento,
      t.dataSolucao,
      t.dataAtualizacao,
      t.categoriaSla,
      t.tempoSla,
      t.statusSla,
      t.motivoPausa,
      t.idTecnicoAtribuido,
      t.nomeTecnico,
      tt.content AS ultimaTarefaConteudo,
      tt.date_creation AS ultimaTarefaCriacao,
      tt.date_mod AS ultimaTarefaAtualizacao,
      COALESCE(tt.nomeAutor, CAST(tt.users_id AS CHAR)) AS ultimaTarefaAutor,
      sol.content AS ultimaSolucaoConteudo,
      sol.date_creation AS ultimaSolucaoCriacao,
      sol.date_mod AS ultimaSolucaoAtualizacao,
      COALESCE(sol.user_name, sol.users_id) AS ultimaSolucaoAutor,
      COALESCE(sol.solutiontype_name, sol.solutiontypes_id) AS tipoSolucao,
      CAST(COALESCE(t.isAtrasado, 0) AS UNSIGNED) AS isAtrasado,
      t.updated_at,
      t.tipo,
      t.projeto
    FROM tickets t
    LEFT JOIN glpi_tickettasks tt ON tt.id = (
      SELECT tt2.id
      FROM glpi_tickettasks tt2
      WHERE tt2.tickets_id = t.ticketId
      ORDER BY tt2.date_mod DESC, tt2.id DESC
      LIMIT 1
    )
    LEFT JOIN glpi_itilsolutions sol ON sol.id = (
      SELECT sol2.id
      FROM glpi_itilsolutions sol2
      WHERE sol2.tickets_id = t.ticketId
      ORDER BY sol2.date_mod DESC, sol2.id DESC
      LIMIT 1
    )
  `;

  await pool.query(viewQuery);
  console.log("Migration Power BI: View 'vw_powerbi_tickets' criada/atualizada com sucesso.");

  await addIndexIfMissing("tickets", "idx_tickets_created", "dataCriacao");
  await addIndexIfMissing("tickets", "idx_tickets_status", "status");
  await addIndexIfMissing("tickets", "idx_tickets_project", "projeto");
  await addIndexIfMissing("tickets", "idx_tickets_tecnico", "idTecnicoAtribuido, nomeTecnico");
  await addIndexIfMissing("tickets", "idx_tickets_status_sla", "statusSla");
  await addIndexIfMissing("tickets", "idx_tickets_status_created", "status, dataCriacao");
  await addIndexIfMissing("tickets", "idx_tickets_project_created", "projeto, dataCriacao");
  await addIndexIfMissing("glpi_tickettasks", "idx_glpi_tickettasks_ticket_mod", "tickets_id, date_mod, id");
}
