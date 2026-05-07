import glpi_client from '../src/integrations/glpi/glpiClient.js';
import glpiTicketTaskRepository from '../src/repositories/glpi/glpiTicketTaskRepository.js';
import TicketAlertService from '../src/services/TicketAlertService.js';
import glpiTicketRepository from '../src/repositories/glpi/glpiTicketRepository.js';

async function forceSyncTicketTasks(ticketId) {
  try {
    console.log(`--- FORÇANDO SYNC TAREFAS TICKET ${ticketId} ---`);

    // 1. Busca direto na API do GLPI
    const url = `Ticket/${ticketId}/TicketTask`;
    console.log(`Buscando em: ${url}`);
    const result = await glpi_client.glpiRequestData(url, "GET");

    if (!result?.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.log("Nenhuma tarefa encontrada na API para este ticket.");
        process.exit(0);
    }

    console.log(`Encontradas ${result.data.length} tarefas na API.`);

    const cleanTasks = result.data.map(task => ({
        id: task.id,
        tickets_id: task.tickets_id,
        users_id: task.users_id,
        nomeAutor: 'Sistema (Sync Forçado)',
        date_creation: task.date_creation,
        date_mod: task.date_mod,
        begin: task.begin,
        end: task.end,
        content: (task.content || "").replace(/<[^>]*>/g, "").trim()
    }));

    // 2. Salva no banco
    await glpiTicketTaskRepository.upsertBatch(cleanTasks);
    console.log("Tarefas salvas no banco local.");

    // 3. Processa Alertas novamente para este ticket
    const [ticket] = await glpiTicketRepository.getActiveTickets(); // Pega apenas um para ter a estrutura, mas vamos buscar o correto
    const [realTicket] = await pool.query('SELECT * FROM tickets WHERE ticketId = ?', [ticketId]); // ops, need pool
    
    // Vou simplificar a busca do ticket para o processAlerts
    const ticketObj = { ...realTicket[0], ultimaTarefa: cleanTasks[0].content };
    console.log("Re-processando alertas para o ticket...");
    await TicketAlertService.processTicketAlerts(ticketObj);

    console.log("Concluído.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// Pequeno ajuste para o script funcionar isolado (import pool)
import pool from '../src/database/connection.js';

forceSyncTicketTasks(35250);
