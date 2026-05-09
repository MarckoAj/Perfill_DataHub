function toMilliseconds({ minutes = 0, hours = 0, days = 0 }) {
  return (minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60) * 1000;
}

export default {
  code: 'GLPI_PAUSED_STALE',
  name: 'Ticket Pausado Stale',
  severity: 1, //informativo
  description: 'Ticket PENDENTE (Pausado) sem atualização há mais de 7 dias',
  source: 'GLPI',

  evaluate: (context) => {
    const { ticket, timestamps } = context;
    if (!ticket) return false;

    const status = String(ticket.status || '').toLowerCase();
    const isTicketActive = status !== 'solucionado' && status !== 'fechado' && status !== 'aguardando aprovação';

    const thresholdMs = toMilliseconds({ days: 7 });

    return (
      isTicketActive &&
      status === 'pendente' &&
      timestamps.elapsed !== null &&
      timestamps.elapsed > thresholdMs
    );
  }
};
