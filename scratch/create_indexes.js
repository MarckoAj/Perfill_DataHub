// scratch/create_indexes.js - Criação segura de índices de banco de dados para otimização do DataHub

import pool from "../src/database/connection.js";

async function createIndexSafe(tableName, indexName, columnsSql) {
  try {
    console.log(`[Database] Processando índice '${indexName}' na tabela '${tableName}'...`);
    // Comando para adicionar o índice de forma silenciosa
    await pool.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${columnsSql})`);
    console.log(`[Database] ✅ Índice '${indexName}' criado com sucesso!`);
  } catch (error) {
    // ER_DUP_KEYNAME (1061) no MySQL indica que o índice já existe.
    if (error.errno === 1061 || error.code === 'ER_DUP_KEYNAME') {
      console.log(`[Database] ⚠️ Índice '${indexName}' já existe na tabela '${tableName}'. Ignorado.`);
    } else {
      console.error(`[Database] ❌ Erro ao criar índice '${indexName}':`, error.message);
    }
  }
}

async function run() {
  try {
    console.log('============= INICIANDO CRIAÇÃO DE ÍNDICES DE DESEMPENHO =============\n');

    // 1. Tabela glpi_tickettasks (Tarefas do GLPI)
    // Otimiza o subselect tt2.tickets_id = t.ticketId ORDER BY tt2.date_mod DESC executado para cada linha.
    await createIndexSafe('glpi_tickettasks', 'idx_tasks_tickets_mod', 'tickets_id, date_mod DESC');

    // 2. Tabela tasks_auvo (Tarefas do AUVO)
    // Otimiza a junção ta.externalId = t.ticketId e filtros temporais.
    await createIndexSafe('tasks_auvo', 'idx_tasks_external', 'externalId');
    await createIndexSafe('tasks_auvo', 'idx_tasks_date', 'taskDate DESC');
    await createIndexSafe('tasks_auvo', 'idx_tasks_external_date', 'externalId, taskDate DESC');

    // 3. Tabela tickets (Chamados do GLPI)
    // Otimiza as listagens principais, ordenações, buscas de projetos e as subqueries de métricas.
    await createIndexSafe('tickets', 'idx_tickets_status_created', 'status, dataCriacao DESC');
    await createIndexSafe('tickets', 'idx_tickets_status_sla', 'status, tempoSla');
    await createIndexSafe('tickets', 'idx_tickets_created', 'dataCriacao');
    await createIndexSafe('tickets', 'idx_tickets_solved', 'dataSolucao');
    await createIndexSafe('tickets', 'idx_tickets_closed', 'dataFechamento');
    await createIndexSafe('tickets', 'idx_tickets_project', 'projeto');

    // 4. Tabela datahub_ticket_alerts (Alertas)
    // Otimiza a junção de alertas e o carregamento do painel por estado/severidade.
    await createIndexSafe('datahub_ticket_alerts', 'idx_alerts_ticket_id', 'ticket_id');
    await createIndexSafe('datahub_ticket_alerts', 'idx_alerts_state_severity', 'state, severity');

    console.log('\n================== PROCESSO DE ÍNDICES CONCLUÍDO! ==================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro catastrófico durante o setup de índices:', err);
    process.exit(1);
  }
}

run();
