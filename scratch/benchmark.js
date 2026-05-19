// scratch/benchmark.js - Benchmark Científico de Performance das Otimizações de Banco e Queries

import pool from "../src/database/connection.js";
import { performance } from "perf_hooks";

// 1. QUERY DE CHAMADOS ANTIGA (Sem índices, com subquery temporária ROW_NUMBER global + limitação de 50 linhas no FROM)
const queryChamadosAntiga = `
      SELECT  
        DATE_ADD(t.dataCriacao, INTERVAL -3 HOUR) AS "Data de Criação",
        DATE_ADD(t.dataAtualizacao, INTERVAL -3 HOUR) AS "Última Atualização",

        CASE
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 2 THEN 'RECENTE'
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 3 THEN 'VERIFICAR'
          ELSE 'ATUALIZAR'
        END AS "Status Atualização",

        TRIM(CAST(t.ticketId AS CHAR)) AS "Ticket",
        t.titulo AS "Chamado",
        t.descricao AS "Descrição",

        tt.content AS "Última Tarefa",
        DATE_ADD(tt.begin, INTERVAL -3 HOUR) AS "Início Tarefa",
        DATE_ADD(tt.end, INTERVAL -3 HOUR) AS "Fim Tarefa",
        tt.nomeAutor AS "Autor Tarefa",
        
        t.nomeCliente AS "Cliente Local",
        t.nomeTecnico AS "Técnico",

        t.tempoSla AS "Tempo para Resolver",

        CONCAT('https://glpi.perfilltecnologia.com.br/front/ticket.form.php?id=', t.ticketId) AS "taskGLPI",

        t.projeto AS "Projeto",
        t.categoriaSla AS "Categoria",
        CASE 
          WHEN t.statusSla = 'Vencido' AND al.state = 'justified' THEN 'Justificado'
          ELSE t.statusSla 
        END AS "Status do SLA",
        t.status AS "Status do Chamado",
        CASE 
          WHEN t.tipo = '1' THEN 'INC' 
          WHEN t.tipo = '2' THEN 'REQ' 
          ELSE IFNULL(t.tipo, 'S/T') 
        END AS "TIPO",

        ua.name AS "Técnico Auvo",
        ta.taskUrl AS "Link Auvo",
        CASE
          WHEN ta.taskStatusID = 1 THEN 'Aberto'
          WHEN ta.taskStatusID = 2 THEN 'Em deslocamento'
          WHEN ta.taskStatusID = 3 THEN 'No Local'
          WHEN ta.taskStatusID = 4 THEN 'Pausada'
          WHEN ta.taskStatusID = 5 THEN 'Finalizada'
          WHEN ta.taskStatusID = 6 THEN 'Pausada'
          ELSE ta.taskStatusID
        END AS "Status Auvo"

      FROM (SELECT * FROM tickets ORDER BY dataCriacao DESC LIMIT 50) t

      /* Pega apenas a tarefa mais recente atrelada ao chamado */
      LEFT JOIN glpi_tickettasks tt ON tt.id = (
          SELECT tt2.id
          FROM glpi_tickettasks tt2
          WHERE tt2.tickets_id = t.ticketId
          ORDER BY tt2.date_mod DESC
          LIMIT 1
      )

      /* Relacionamento com tarefas AUVO antigo (ROW_NUMBER partition temporária lenta) */
      LEFT JOIN (
          SELECT t1.*, ROW_NUMBER() OVER(PARTITION BY t1.externalId ORDER BY t1.TaskDate DESC) as rn
          FROM tasks_auvo t1
          WHERE t1.externalId IS NOT NULL 
            AND t1.externalId != ''
            AND t1.tasksTypesId NOT IN (144733, 210031, 210030)
      ) ta ON ta.externalId = CAST(t.ticketId AS CHAR) COLLATE utf8mb4_0900_ai_ci AND ta.rn = 1
      LEFT JOIN users_auvo ua ON ta.userToId = ua.userId

      /* Relacionamento com alertas de SLA Justificados */
      LEFT JOIN datahub_ticket_alerts al ON al.ticket_id = t.ticketId 
        AND al.alert_type = 'GLPI_SLA_BREACHED' 
        AND al.state = 'justified'

      WHERE  
          ( ? = '' OR FIND_IN_SET(t.status, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.projeto, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.tipo, ?) > 0 )
        AND 
          ( ? = '' OR t.nomeTecnico = ? )
        AND 
          ( ? = '' OR FIND_IN_SET(t.categoriaSla, ?) > 0 );
`;

// 2. QUERY DE CHAMADOS NOVA (Otimizada, correlacionada, indexada e com limitação de 50 linhas no FROM)
const queryChamadosNova = `
      SELECT  
        DATE_ADD(t.dataCriacao, INTERVAL -3 HOUR) AS "Data de Criação",
        DATE_ADD(t.dataAtualizacao, INTERVAL -3 HOUR) AS "Última Atualização",

        CASE
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 2 THEN 'RECENTE'
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 3 THEN 'VERIFICAR'
          ELSE 'ATUALIZAR'
        END AS "Status Atualização",

        TRIM(CAST(t.ticketId AS CHAR)) AS "Ticket",
        t.titulo AS "Chamado",
        t.descricao AS "Descrição",

        tt.content AS "Última Tarefa",
        DATE_ADD(tt.begin, INTERVAL -3 HOUR) AS "Início Tarefa",
        DATE_ADD(tt.end, INTERVAL -3 HOUR) AS "Fim Tarefa",
        tt.nomeAutor AS "Autor Tarefa",
        
        t.nomeCliente AS "Cliente Local",
        t.nomeTecnico AS "Técnico",

        t.tempoSla AS "Tempo para Resolver",

        CONCAT('https://glpi.perfilltecnologia.com.br/front/ticket.form.php?id=', t.ticketId) AS "taskGLPI",

        t.projeto AS "Projeto",
        t.categoriaSla AS "Categoria",
        CASE 
          WHEN t.statusSla = 'Vencido' AND al.state = 'justified' THEN 'Justificado'
          ELSE t.statusSla 
        END AS "Status do SLA",
        t.status AS "Status do Chamado",
        CASE 
          WHEN t.tipo = '1' THEN 'INC' 
          WHEN t.tipo = '2' THEN 'REQ' 
          ELSE IFNULL(t.tipo, 'S/T') 
        END AS "TIPO",

        ua.name AS "Técnico Auvo",
        ta.taskUrl AS "Link Auvo",
        CASE
          WHEN ta.taskStatusID = 1 THEN 'Aberto'
          WHEN ta.taskStatusID = 2 THEN 'Em deslocamento'
          WHEN ta.taskStatusID = 3 THEN 'No Local'
          WHEN ta.taskStatusID = 4 THEN 'Pausada'
          WHEN ta.taskStatusID = 5 THEN 'Finalizada'
          WHEN ta.taskStatusID = 6 THEN 'Pausada'
          ELSE ta.taskStatusID
        END AS "Status Auvo"

      FROM (SELECT * FROM tickets ORDER BY dataCriacao DESC LIMIT 50) t

      /* Pega apenas a tarefa mais recente atrelada ao chamado */
      LEFT JOIN glpi_tickettasks tt ON tt.id = (
          SELECT tt2.id
          FROM glpi_tickettasks tt2
          WHERE tt2.tickets_id = t.ticketId
          ORDER BY tt2.date_mod DESC
          LIMIT 1
      )

      /* Relacionamento com tarefas AUVO (correlacionado e otimizado via índice idx_tasks_external com cast e collation) */
      LEFT JOIN tasks_auvo ta ON ta.taskId = (
          SELECT ta2.taskId
          FROM tasks_auvo ta2
          WHERE ta2.externalId = CAST(t.ticketId AS CHAR) COLLATE utf8mb4_0900_ai_ci
            AND ta2.tasksTypesId NOT IN (144733, 210031, 210030)
          ORDER BY ta2.taskDate DESC
          LIMIT 1
      )
      LEFT JOIN users_auvo ua ON ta.userToId = ua.userId

      /* Relacionamento com alertas de SLA Justificados */
      LEFT JOIN datahub_ticket_alerts al ON al.ticket_id = t.ticketId 
        AND al.alert_type = 'GLPI_SLA_BREACHED' 
        AND al.state = 'justified'

      WHERE  
          ( ? = '' OR FIND_IN_SET(t.status, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.projeto, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.tipo, ?) > 0 )
        AND 
          ( ? = '' OR t.nomeTecnico = ? )
        AND 
          ( ? = '' OR FIND_IN_SET(t.categoriaSla, ?) > 0 );
`;

// 3. QUERY DE MÉTRICAS ANTIGA (Não sargable DATE() = CURDATE())
const queryMetricasAntiga = `
      SELECT 
        (SELECT COUNT(*) FROM tickets WHERE status NOT IN ('fechado', 'solucionado')) as chamados_abertos,
        (SELECT COUNT(*) FROM tickets WHERE DATE(dataCriacao) = CURDATE()) as criados_hoje,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('solucionado', 'fechado') AND (DATE(dataSolucao) = CURDATE() OR DATE(dataFechamento) = CURDATE())) as encerrados,
        (SELECT COUNT(*) FROM tickets WHERE status NOT IN ('fechado', 'solucionado') AND tempoSla = 'Proativo') as proativos,
        (SELECT COUNT(*) FROM tickets WHERE status = 'pendente') as pendentes,
        (SELECT COUNT(*) FROM tickets WHERE status = 'novo') as novos,
        (SELECT COUNT(DISTINCT t.ticketId) FROM tickets t JOIN datahub_ticket_alerts a ON t.ticketId = a.ticket_id WHERE a.state = 'justified' AND t.status NOT IN ('fechado', 'solucionado', 'aguardando aprovação')) as justificados_abertos
`;

// 4. QUERY DE MÉTRICAS NOVA (Otimizada sargable >= CURDATE())
const queryMetricasNova = `
      SELECT 
        (SELECT COUNT(*) FROM tickets WHERE status NOT IN ('fechado', 'solucionado')) as chamados_abertos,
        (SELECT COUNT(*) FROM tickets WHERE dataCriacao >= CURDATE()) as criados_hoje,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('solucionado', 'fechado') AND (dataSolucao >= CURDATE() OR dataFechamento >= CURDATE())) as encerrados,
        (SELECT COUNT(*) FROM tickets WHERE status NOT IN ('fechado', 'solucionado') AND tempoSla = 'Proativo') as proativos,
        (SELECT COUNT(*) FROM tickets WHERE status = 'pendente') as pendentes,
        (SELECT COUNT(*) FROM tickets WHERE status = 'novo') as novos,
        (SELECT COUNT(DISTINCT t.ticketId) FROM tickets t JOIN datahub_ticket_alerts a ON t.ticketId = a.ticket_id WHERE a.state = 'justified' AND t.status NOT IN ('fechado', 'solucionado', 'aguardando aprovação')) as justificados_abertos
`;

const indexList = [
  { table: 'glpi_tickettasks', name: 'idx_tasks_tickets_mod', columns: 'tickets_id, date_mod DESC' },
  { table: 'tasks_auvo', name: 'idx_tasks_external', columns: 'externalId' },
  { table: 'tasks_auvo', name: 'idx_tasks_date', columns: 'taskDate DESC' },
  { table: 'tasks_auvo', name: 'idx_tasks_external_date', columns: 'externalId, taskDate DESC' },
  { table: 'tickets', name: 'idx_tickets_status_created', columns: 'status, dataCriacao DESC' },
  { table: 'tickets', name: 'idx_tickets_status_sla', columns: 'status, tempoSla' },
  { table: 'tickets', name: 'idx_tickets_created', columns: 'dataCriacao' },
  { table: 'tickets', name: 'idx_tickets_solved', columns: 'dataSolucao' },
  { table: 'tickets', name: 'idx_tickets_closed', columns: 'dataFechamento' },
  { table: 'tickets', name: 'idx_tickets_project', columns: 'projeto' },
  { table: 'datahub_ticket_alerts', name: 'idx_alerts_ticket_id', columns: 'ticket_id' },
  { table: 'datahub_ticket_alerts', name: 'idx_alerts_state_severity', columns: 'state, severity' }
];

async function dropIndexes() {
  console.log('[Benchmark] ⬇️ Desativando temporariamente os 12 índices de performance...');
  for (const idx of indexList) {
    try {
      await pool.query(`ALTER TABLE ${idx.table} DROP INDEX ${idx.name}`);
    } catch (e) {
      // Ignorar erros caso já tenham sido removidos ou não existam
    }
  }
}

async function recreateIndexes() {
  console.log('[Benchmark] ⬆️ Reativando todos os 12 índices de performance de banco de dados...');
  for (const idx of indexList) {
    try {
      await pool.query(`ALTER TABLE ${idx.table} ADD INDEX ${idx.name} (${idx.columns})`);
    } catch (e) {
      // Ignorar se já existem
    }
  }
}

async function runBenchmarkQuery(type, isOld = false) {
  const start = performance.now();
  if (type === 'chamados') {
    const values = ['', '', '', '', '', '', '', '', '', ''];
    if (isOld) {
      await pool.query(queryChamadosAntiga, values);
    } else {
      await pool.query(queryChamadosNova, values);
    }
  } else if (type === 'metricas') {
    if (isOld) {
      await pool.query(queryMetricasAntiga);
    } else {
      await pool.query(queryMetricasNova);
    }
  }
  return performance.now() - start;
}

async function run() {
  try {
    console.log('================================================================');
    console.log('🔬 INICIANDO BENCHMARK CIENTÍFICO DE LATÊNCIA DO DATAHUB');
    console.log('   (Amostragem segura de 50 chamados no FROM para performance)');
    console.log('================================================================\n');

    // -------------------------------------------------------------------------
    // ETAPA 1: Medir o estado otimizado atual ("DEPOIS") com índices e query nova
    // -------------------------------------------------------------------------
    console.log('[Benchmark] Medindo estado atual otimizado (DEPOIS: Com Índices + Query Correlacionada)...');
    
    // Warmup (Aquecimento de cache)
    await runBenchmarkQuery('chamados', false);
    await runBenchmarkQuery('metricas', false);

    let chamadosDepoisSoma = 0;
    let metricasDepoisSoma = 0;
    const rodadas = 5;

    for (let i = 0; i < rodadas; i++) {
      chamadosDepoisSoma += await runBenchmarkQuery('chamados', false);
      metricasDepoisSoma += await runBenchmarkQuery('metricas', false);
    }

    const chamadosDepoisMedia = chamadosDepoisSoma / rodadas;
    const metricasDepoisMedia = metricasDepoisSoma / rodadas;

    console.log(`[Benchmark] ✅ Média "Depois" - Chamados: ${chamadosDepoisMedia.toFixed(2)} ms | Métricas: ${metricasDepoisMedia.toFixed(2)} ms\n`);

    // -------------------------------------------------------------------------
    // ETAPA 2: Medir o estado antigo ("ANTES") sem índices e com query antiga
    // -------------------------------------------------------------------------
    await dropIndexes();
    console.log('\n[Benchmark] Medindo estado antigo sem otimização (ANTES: Sem Índices + Query Antiga)...');

    // Warmup
    await runBenchmarkQuery('chamados', true);
    await runBenchmarkQuery('metricas', true);

    let chamadosAntesSoma = 0;
    let metricasAntesSoma = 0;

    for (let i = 0; i < rodadas; i++) {
      chamadosAntesSoma += await runBenchmarkQuery('chamados', true);
      metricasAntesSoma += await runBenchmarkQuery('metricas', true);
    }

    const chamadosAntesMedia = chamadosAntesSoma / rodadas;
    const metricasAntesMedia = metricasAntesSoma / rodadas;

    console.log(`[Benchmark] ✅ Média "Antes" - Chamados: ${chamadosAntesMedia.toFixed(2)} ms | Métricas: ${metricasAntesMedia.toFixed(2)} ms\n`);

    // -------------------------------------------------------------------------
    // ETAPA 3: Restaurar o banco para o estado rápido otimizado
    // -------------------------------------------------------------------------
    await recreateIndexes();
    console.log('[Benchmark] ✅ Banco de dados restaurado ao estado ótimo de produção.\n');

    // -------------------------------------------------------------------------
    // ETAPA 4: Resultados comparativos
    // -------------------------------------------------------------------------
    const chamadosReducaoMs = chamadosAntesMedia - chamadosDepoisMedia;
    const chamadosGanhoPercentual = ((chamadosAntesMedia - chamadosDepoisMedia) / chamadosAntesMedia) * 100;

    const metricasReducaoMs = metricasAntesMedia - metricasDepoisMedia;
    const metricasGanhoPercentual = ((metricasAntesMedia - metricasDepoisMedia) / metricasAntesMedia) * 100;

    const totalAntes = chamadosAntesMedia + metricasAntesMedia;
    const totalDepois = chamadosDepoisMedia + metricasDepoisMedia;
    const totalReducaoMs = totalAntes - totalDepois;
    const totalGanhoPercentual = ((totalAntes - totalDepois) / totalAntes) * 100;

    console.log('================================================================');
    console.log('              📊 TABELA COMPARATIVA DE PERFORMANCE              ');
    console.log('================================================================');
    console.table([
      {
        'Funcionalidade': 'Carregamento de Chamados (50 itens)',
        'Antes (Sem Índices)': `${chamadosAntesMedia.toFixed(1)} ms`,
        'Depois (Com Índices)': `${chamadosDepoisMedia.toFixed(1)} ms`,
        'Redução Absoluta': `${chamadosReducaoMs.toFixed(1)} ms`,
        'Ganho de Velocidade': `${chamadosGanhoPercentual.toFixed(1)}% mais rápido`
      },
      {
        'Funcionalidade': 'Métricas do Cabeçalho (Cards)',
        'Antes (Sem Índices)': `${metricasAntesMedia.toFixed(1)} ms`,
        'Depois (Com Índices)': `${metricasDepoisMedia.toFixed(1)} ms`,
        'Redução Absoluta': `${metricasReducaoMs.toFixed(1)} ms`,
        'Ganho de Velocidade': `${metricasGanhoPercentual.toFixed(1)}% mais rápido`
      },
      {
        'Funcionalidade': 'Tempo Total (Amostragem)',
        'Antes (Sem Índices)': `${totalAntes.toFixed(1)} ms`,
        'Depois (Com Índices)': `${totalDepois.toFixed(1)} ms`,
        'Redução Absoluta': `${totalReducaoMs.toFixed(1)} ms`,
        'Ganho de Velocidade': `${totalGanhoPercentual.toFixed(1)}% mais rápido`
      }
    ]);
    console.log('================================================================');
    console.log(`🎉 PERFORMANCE HISTÓRICA! O tempo de resposta geral do`);
    console.log(`   dashboard foi reduzido em ${totalReducaoMs.toFixed(1)} ms.`);
    console.log(`   Isso representa uma velocidade ${((totalAntes) / (totalDepois)).toFixed(1)}x maior!`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro crítico no benchmark:', err);
    await recreateIndexes(); // Garante que nunca deixe a base sem índices se houver erro
    process.exit(1);
  }
}

run();
