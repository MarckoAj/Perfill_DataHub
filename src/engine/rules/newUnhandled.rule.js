function toMilliseconds({ minutes = 0, hours = 0, days = 0 }) {
  return (minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60) * 1000;
}

export default {
  code: 'GLPI_NEW_UNHANDLED',
  name: 'Ticket Novo Sem Interação',
  severity: 1, //informativo
  description: 'Ticket NOVO sem interação há mais de 5 minutos',
  source: 'GLPI',

  evaluate: (context) => {
    const { ticket, timestamps } = context;
    if (!ticket) return false;

    const status = String(ticket.status || '').toLowerCase();
    const isTicketActive = status !== 'solucionado' && status !== 'fechado' && status !== 'aguardando aprovação';

    // Config do limiar: 5 minutos
    const thresholdMs = toMilliseconds({ minutes: 5 });

    return (
      isTicketActive &&
      status === 'novo' &&
      timestamps.elapsed !== null &&
      timestamps.elapsed > thresholdMs
    );
  }
};
