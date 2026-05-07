export default {
  code: 'GLPI_SLA_BREACHED',
  name: 'SLA Violado',
  severity: 3, // critico
  description: 'Chamado com SLA Vencido sem justificativa',
  source: 'GLPI',

  evaluate: (context) => {
    const { ticket } = context;
    if (!ticket) return false;

    const status = String(ticket.status || '').toLowerCase();
    const isTicketActive = status !== 'solucionado' && status !== 'fechado' && status !== 'aguardando aprovação';

    return (
      isTicketActive && 
      ticket.statusSla === "Vencido" && 
      (!ticket.ultimaTarefa || ticket.ultimaTarefa === 'Sem tarefas')
    );
  }
};
