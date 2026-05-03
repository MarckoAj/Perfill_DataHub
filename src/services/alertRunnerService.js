/**
 * AlertRunnerService
 *
 * Responsabilidade: executar a avaliação de alertas para TODOS os tickets
 * ativos do banco de dados — independente de qual sync foi executado.
 *
 * Quando usar:
 *   - Ao final de cada ciclo de sync do GLPI (via glpiSyncService.runQueue)
 *   - Garante cobertura completa: tickets que não estavam no batch do sync
 *     atual também terão seus alertas avaliados e atualizados.
 *
 * Fluxo:
 *   glpiSyncService.runQueue() finaliza
 *     → alertRunnerService.runForAllActiveTickets()
 *       → glpiTicketRepository.getActiveTickets()  (busca todos ativos no banco)
 *         → TicketAlertService.processTicketAlerts(ticket)  (por ticket)
 *           → alertEngine.evaluateTicketRules(ticket)  (stateless, avalia condições)
 *             → alertRepository  (persiste estado no banco)
 */

import glpiTicketRepository from "../repositories/glpi/glpiTicketRepository.js";
import TicketAlertService from "./TicketAlertService.js";

class AlertRunnerService {
  /**
   * Avalia alertas para todos os tickets ativos no banco.
   * Erros individuais por ticket são isolados — não interrompem o runner.
   *
   * @returns {{ processed: number, errors: number }}
   */
  async runForAllActiveTickets() {
    const startedAt = Date.now();
    let processed = 0;
    let errors = 0;

    try {
      const tickets = await glpiTicketRepository.getActiveTickets();

      console.log(`[AlertRunner] Iniciando avaliação de ${tickets.length} tickets ativos...`);

      for (const ticket of tickets) {
        try {
          await TicketAlertService.processTicketAlerts(ticket);
          processed++;
        } catch (err) {
          errors++;
          console.error(`[AlertRunner] Erro no ticket ${ticket.ticketId}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`[AlertRunner] Falha ao buscar tickets ativos: ${err.message}`);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[AlertRunner] Concluído em ${elapsed}s — ${processed} processados, ${errors} erros.`);

    return { processed, errors };
  }
}

export default new AlertRunnerService();
