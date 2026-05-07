export default {
  code: 'GLPI_SLA_WARNING',
  name: 'SLA em Atenção',
  severity: 2, // atencao
  description: 'O chamado consumiu mais de 50% do tempo de SLA',
  source: 'GLPI',

  evaluate: (context) => {
    const { ticket } = context;
    if (!ticket) return false;

    const status = String(ticket.status || '').toLowerCase();
    const isTicketActive = status !== 'solucionado' && status !== 'fechado' && status !== 'aguardando aprovação';

    return (
      isTicketActive && 
      ticket.statusSla === "Atenção"
    );
  }
};
