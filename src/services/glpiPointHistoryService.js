import glpiClient from '../integrations/glpi/glpiClient.js';
import repository from '../repositories/glpi/glpiPointHistoryRepository.js';
import solutionService from './glpiSolutionService.js';
import ticketStatusMapper from '../mappers/ticketStatusMapper.js';
import { GLPI_HISTORY_PILOT, GLPI_HISTORY_TTL_MS, GLPI_HISTORY_RETRY_MS, canReadPrivateGlpiInteractions } from '../config/glpiHistory.js';

const idOf = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const age = value => value ? Date.now() - new Date(value).getTime() : Infinity;
// GLPI CommonITILValidation states (not Ticket status codes).
const solutionStates = { 1: 'Sem aprovação', 2: 'Aguardando aprovação', 3: 'Aprovada', 4: 'Recusada' };

export class GlpiPointHistoryService {
  constructor({ repo = repository, client = glpiClient } = {}) {
    this.repo = repo;
    this.client = client;
    this.pending = null;
  }

  async list(entityId, limit, offset) {
    const scope = await this.repo.scope(entityId, GLPI_HISTORY_PILOT);
    if (!scope || !scope.enabled) return scope;
    const [page, state] = await Promise.all([
      this.repo.list(entityId, GLPI_HISTORY_PILOT.deviceId, limit, offset),
      this.repo.syncState(GLPI_HISTORY_PILOT.deviceId),
    ]);
    return { ...scope, ...page, ...state, relation: 'device',
      refreshNeeded: age(state.lastSyncedAt) >= GLPI_HISTORY_TTL_MS && age(state.lastAttemptAt) >= GLPI_HISTORY_RETRY_MS,
      syncing: Boolean(this.pending) };
  }

  async detail(entityId, ticketId) {
    const ticket = await this.repo.detail(entityId, ticketId, GLPI_HISTORY_PILOT.deviceId);
    if (!ticket) return null;
    const visible = (ticket.interactions || [])
      .filter(item => !item.isPrivate || canReadPrivateGlpiInteractions())
      .map(item => item.kind === 'solution' ? { ...item,
        solutionStatusLabel: solutionStates[Number(item.status)] || 'Não informada',
        rejection: this.rejectionDetails(item, ticket.interactions || []) } : item);
    return { ...ticket, interactions: visible,
      privateInteractionsHidden: visible.length !== (ticket.interactions || []).length,
      url: `${String(process.env.GLPI_BASE_URL || '').replace(/\/$/, '')}/front/ticket.form.php?id=${ticketId}` };
  }

  rejectionDetails(solution, interactions) {
    if (Number(solution.status) !== 4) return null;
    const responses = interactions.filter(item => item.kind === 'response');
    let source = null;
    let response = null;
    if (idOf(solution.decisionFollowupId)) {
      response = responses.find(item => Number(item.id) === Number(solution.decisionFollowupId));
      if (response) source = 'explicit';
    } else if (solution.decisionDate && idOf(solution.decisionUserId)) {
      // Older GLPI records may lack itilfollowups_id. Never silently assert a link.
      const candidates = responses.filter(item => Number(item.authorId) === Number(solution.decisionUserId)
        && Math.abs(new Date(item.date).getTime() - new Date(solution.decisionDate).getTime()) <= 2000);
      if (candidates.length === 1) { response = candidates[0]; source = 'time_author'; }
    }
    const restricted = Boolean(response?.isPrivate && !canReadPrivateGlpiInteractions());
    return { date: solution.decisionDate || null, author: solution.decisionAuthor || null,
      reason: restricted ? null : response?.content || null,
      source, restricted, followupId: restricted ? null : response?.id || null };
  }

  async syncForEntity(entityId, force = false) {
    const scope = await this.repo.scope(entityId, GLPI_HISTORY_PILOT);
    if (!scope?.enabled) return null;
    return this.sync(force);
  }

  sync(force = false) {
    if (!this.pending) {
      this.pending = this.refresh(force).finally(() => { this.pending = null; });
    }
    return this.pending;
  }

  async refresh(force) {
    const scope = await this.repo.scope(GLPI_HISTORY_PILOT.entityId, GLPI_HISTORY_PILOT);
    if (!scope?.isPilot) throw new Error('Vinculo do ponto piloto GLPI indisponivel.');
    const state = await this.repo.syncState(GLPI_HISTORY_PILOT.deviceId);
    if ((!force && age(state.lastSyncedAt) < GLPI_HISTORY_TTL_MS) || age(state.lastAttemptAt) < GLPI_HISTORY_RETRY_MS) {
      return { updated: false, ...state };
    }
    await this.repo.recordAttempt(GLPI_HISTORY_PILOT.deviceId);
    try {
      const tickets = await this.collect();
      await this.repo.replaceSnapshot(GLPI_HISTORY_PILOT.deviceId, tickets);
      return { updated: true, total: tickets.length, ...await this.repo.syncState(GLPI_HISTORY_PILOT.deviceId) };
    } catch (error) {
      await this.repo.recordFailure(GLPI_HISTORY_PILOT.deviceId);
      throw new Error('Nao foi possivel atualizar o historico GLPI. Os dados anteriores foram preservados.', { cause: error });
    }
  }

  async get(path) {
    const result = await this.client.glpiRequestData(path, 'GET', null, null, { suppressErrorLog: true });
    if (!result || result.data === undefined) throw new Error('Resposta GLPI indisponivel.');
    return result;
  }

  async listAll(path) {
    const items = [];
    const seen = new Set();
    for (let offset = 0; offset < 10000;) {
      const result = await this.get(`${path}?range=${offset}-${offset + 99}&sort=id&order=ASC`);
      const page = result.data;
      if (!Array.isArray(page)) throw new Error('Lista GLPI invalida.');
      const range = result.headers?.get('content-range');
      const match = range?.match(/^(\d+)-(\d+)\/(\d+)$/);
      if (match && Number(match[1]) !== offset) throw new Error('Paginacao GLPI inconsistente.');
      if (!page.length) {
        if (match && Number(match[3]) > offset) throw new Error('Pagina GLPI incompleta.');
        return items;
      }
      for (const item of page) {
        if (!idOf(item.id) || seen.has(Number(item.id))) throw new Error('Itens GLPI invalidos ou repetidos.');
        seen.add(Number(item.id));
        items.push(item);
      }
      offset += page.length;
      if (match ? offset >= Number(match[3]) : page.length < 100) return items;
    }
    throw new Error('Historico excedeu o limite de seguranca da carga piloto.');
  }

  async collect() {
    const links = await this.listAll(`Peripheral/${GLPI_HISTORY_PILOT.deviceId}/Item_Ticket`);
    if (links.some(link => link.itemtype !== 'Peripheral' || Number(link.items_id) !== GLPI_HISTORY_PILOT.deviceId || !idOf(link.tickets_id))) {
      throw new Error('Vinculos GLPI inconsistentes.');
    }
    const names = new Map();
    const nameOf = async (type, id, fallback) => {
      if (!idOf(id)) return fallback;
      const key = `${type}/${id}`;
      if (!names.has(key)) {
        const result = await this.get(key);
        const data = result.data;
        names.set(key, type === 'User'
          ? [data.firstname, data.realname].filter(Boolean).join(' ') || data.name || fallback
          : data.completename || data.name || fallback);
      }
      return names.get(key);
    };
    const tickets = [];
    for (const ticketId of [...new Set(links.map(link => Number(link.tickets_id)))]) {
      const ticket = (await this.get(`Ticket/${ticketId}`)).data;
      if (Number(ticket.id) !== ticketId) throw new Error('Chamado GLPI inconsistente.');
      if (Number(ticket.is_deleted) === 1) continue;
      const associations = await this.listAll(`Ticket/${ticketId}/Item_Ticket`);
      if (!associations.some(item => item.itemtype === 'Peripheral' && Number(item.items_id) === GLPI_HISTORY_PILOT.deviceId)) continue;
      const items = [];
      const itemKeys = new Set();
      for (const item of associations) {
        if (Number(item.tickets_id) !== ticketId || !idOf(item.items_id) || !/^[A-Za-z][A-Za-z0-9_]*$/.test(item.itemtype)) throw new Error('Item vinculado invalido.');
        const key = `${item.itemtype}/${item.items_id}`;
        if (itemKeys.has(key)) continue;
        itemKeys.add(key);
        items.push({ itemType: item.itemtype, itemId: Number(item.items_id),
          name: await nameOf(item.itemtype, item.items_id, `${item.itemtype} ${item.items_id}`) });
      }
      const interactions = [];
      for (const [endpoint, kind] of [['ITILFollowup', 'response'], ['TicketTask', 'task'], ['ITILSolution', 'solution']]) {
        for (const row of await this.listAll(`Ticket/${ticketId}/${endpoint}`)) {
          if (Number(row.tickets_id ?? row.items_id) !== ticketId || (row.itemtype && row.itemtype !== 'Ticket')) throw new Error('Interacao GLPI fora do chamado.');
          interactions.push({ id: Number(row.id), kind, isPrivate: Number(row.is_private) === 1,
            authorId: idOf(row.users_id),
            content: solutionService.cleanContent(row.content),
            date: row.date_creation || row.date || null, dateUpdated: row.date_mod || null,
            author: await nameOf('User', row.users_id, row.user_name || 'Nao informado'),
            solutionType: kind === 'solution' ? row.solutiontype_name || await nameOf('SolutionType', row.solutiontypes_id, null) : null,
            ...(kind === 'solution' ? { decisionDate: row.date_approval || null,
              decisionUserId: idOf(row.users_id_approval), decisionFollowupId: idOf(row.itilfollowups_id),
              decisionAuthor: await nameOf('User', row.users_id_approval, row.user_name_approval || null) } : {}),
            status: kind === 'task' ? row.state ?? null : row.status ?? null,
            durationSeconds: kind === 'task' ? row.actiontime ?? null : null });
        }
      }
      // Closing a ticket does not necessarily update ITILSolution or create a followup.
      const logs = await this.listAll(`Ticket/${ticketId}/Log`);
      const closures = logs.filter(row => row.itemtype === 'Ticket' && Number(row.items_id) === ticketId
        && Number(row.linked_action) === 0 && Number(row.id_search_option) === 12
        && Number(row.new_value) === 6 && Number(row.old_value) !== 6);
      for (const row of closures) {
        const actorId = String(row.user_name || '').match(/\((\d+)\)\s*$/)?.[1];
        interactions.push({ id: `closure-${row.id}`, kind: 'closure', isPrivate: false,
          date: row.date_mod || null, author: await nameOf('User', actorId, row.user_name || 'Não informado'),
          content: 'Chamado encerrado.', source: 'glpi_log', sourceLogId: Number(row.id) });
      }
      // If log retention removed the closing entry, use the ticket's own recorded date.
      if (Number(ticket.status) === 6 && ticket.closedate && !closures.some(row => row.date_mod === ticket.closedate)) {
        interactions.push({ id: `closure-date-${ticketId}`, kind: 'closure', isPrivate: false,
          date: ticket.closedate, author: 'Não informado', content: 'Chamado encerrado.', source: 'ticket_closedate' });
      }
      interactions.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      tickets.push({ id: ticketId, title: ticket.name || `Chamado ${ticketId}`,
        description: solutionService.cleanContent(ticket.content),
        status: ticketStatusMapper.toDataHubStatus(ticket.status) || 'Nao informado',
        category: await nameOf('ITILCategory', ticket.itilcategories_id, 'Nao informado'),
        dateUpdated: ticket.date_mod || ticket.date || null, items, interactions });
    }
    return tickets;
  }
}

export default new GlpiPointHistoryService();
