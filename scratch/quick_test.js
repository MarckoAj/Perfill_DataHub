// scratch/quick_test.js - Teste rápido de tempo de resposta da query de chamados

import pool from "../src/database/connection.js";
import { performance } from "perf_hooks";

async function run() {
  try {
    console.log('Rodando query otimizada com indexação ativa...');
    const start = performance.now();
    const query = `
      SELECT  
        DATE_ADD(t.dataCriacao, INTERVAL -3 HOUR) AS "Data de Criação",
        TRIM(CAST(t.ticketId AS CHAR)) AS "Ticket",
        t.titulo AS "Chamado",
        ta.taskUrl AS "Link Auvo"
      FROM tickets t
      LEFT JOIN tasks_auvo ta ON ta.taskId = (
          SELECT ta2.taskId
          FROM tasks_auvo ta2
          WHERE ta2.externalId = CAST(t.ticketId AS CHAR) COLLATE utf8mb4_0900_ai_ci
            AND ta2.tasksTypesId NOT IN (144733, 210031, 210030)
          ORDER BY ta2.taskDate DESC
          LIMIT 1
      )
      ORDER BY t.dataCriacao DESC
      LIMIT 10;
    `;
    const [rows] = await pool.query(query);
    const duration = performance.now() - start;
    console.log(`✅ Concluído em ${duration.toFixed(2)} ms! Retornou ${rows.length} registros.`);
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

run();
