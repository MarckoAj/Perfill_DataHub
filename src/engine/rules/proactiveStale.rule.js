function toMilliseconds({ minutes = 0, hours = 0, days = 0 }) {
  return (minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60) * 1000;
}

export default {
  code: 'GLPI_PROACTIVE_STALE',
  name: 'Ticket Proativo Sem Interação e Tarefa',
  severity: 2, // atencao
  description: 'Ticket PROATIVO sem interação há mais de 48h e sem tarefas Auvo',
  source: 'GLPI/AUVO',

  evaluate: (context) => {
    const { ticket, timestamps, tasksAuvo } = context;
    if (!ticket) return false;

    const status = String(ticket.status || '').toLowerCase();
    const isTicketActive = status !== 'solucionado' && status !== 'fechado' && status !== 'aguardando aprovação';
    
    const tempoSla = String(ticket.tempoSla || '');
    const thresholdMs = toMilliseconds({ hours: 48 });

    return (
      isTicketActive &&
      tempoSla === 'Proativo' &&
      timestamps.elapsed !== null &&
      timestamps.elapsed > thresholdMs &&
      (!tasksAuvo || tasksAuvo.length === 0)
    );
  }
};
