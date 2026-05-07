import pool from '../src/database/connection.js';

async function checkTicket35250() {
  const ticketId = 35250;
  try {
    console.log(`--- DIAGNÓSTICO TICKET ${ticketId} ---`);

    // 1. Ticket no banco
    const [tickets] = await pool.query('SELECT ticketId, titulo, statusSla, status FROM tickets WHERE ticketId = ?', [ticketId]);
    console.log('\n[Tickets Table]:');
    console.table(tickets);

    // 2. Tarefas do GLPI
    const [tasks] = await pool.query('SELECT id, content, date_mod FROM glpi_tickettasks WHERE tickets_id = ? ORDER BY date_mod DESC', [ticketId]);
    console.log('\n[GLPI Tasks Table]:');
    console.table(tasks);

    // 3. Alertas do Ticket
    const [alerts] = await pool.query('SELECT id, alert_type, state, message FROM datahub_ticket_alerts WHERE ticket_id = ?', [ticketId]);
    console.log('\n[Alerts Table]:');
    console.table(alerts);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkTicket35250();
