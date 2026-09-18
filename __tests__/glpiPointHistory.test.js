import { jest } from '@jest/globals';
import { GlpiPointHistoryService } from '../src/services/glpiPointHistoryService.js';
import { canReadPrivateGlpiInteractions } from '../src/config/glpiHistory.js';

const result = (data, range = null) => ({ data, headers: { get: () => range } });
const state = () => ({ lastSyncedAt: null, lastAttemptAt: null, lastError: null });
let repo, client, service;
beforeEach(() => {
  repo = {
    scope: jest.fn().mockResolvedValue({ enabled: true, isPilot: true }),
    syncState: jest.fn().mockResolvedValue(state()),
    recordAttempt: jest.fn(), recordFailure: jest.fn(), replaceSnapshot: jest.fn(),
    detail: jest.fn(), list: jest.fn(),
  };
  client = { glpiRequestData: jest.fn() };
  service = new GlpiPointHistoryService({ repo, client });
});

test('coleta chamados fechados, todos os dispositivos e interacoes ordenadas, preservando privacidade', async () => {
  const payloads = {
    'Peripheral/4412/Item_Ticket': [{ id: 1, tickets_id: 50, itemtype: 'Peripheral', items_id: 4412 }],
    'Ticket/50': { id: 50, name: 'Chamado compartilhado', status: 6, content: '&lt;p&gt;Descricao&lt;/p&gt;', date_mod: '2026-09-18 10:00:00', itilcategories_id: 7 },
    'Ticket/50/Item_Ticket': [{ id: 1, tickets_id: 50, itemtype: 'Peripheral', items_id: 4412 }, { id: 2, tickets_id: 50, itemtype: 'Peripheral', items_id: 99 }],
    'Peripheral/4412': { name: '06-014' }, 'Peripheral/99': { name: 'Outro ponto' },
    'ITILCategory/7': { completename: 'Manutencao > Camera' }, 'User/2': { firstname: 'Ana', realname: 'Silva' },
    'Ticket/50/ITILFollowup': [{ id: 5, itemtype: 'Ticket', items_id: 50, users_id: 2, content: 'Interno', is_private: 1, date_creation: '2026-09-17 10:00:00' }],
    'Ticket/50/TicketTask': [{ id: 6, tickets_id: 50, users_id: 2, content: 'Tarefa', state: 2, actiontime: 600, date_creation: '2026-09-16 10:00:00' }],
    'Ticket/50/ITILSolution': [{ id: 7, itemtype: 'Ticket', items_id: 50, users_id: 2, content: 'Resolvido', solutiontype_name: 'Troca', status: 2, date_creation: '2026-09-18 10:00:00' }],
    'Ticket/50/Log': [{ id: 8, itemtype: 'Ticket', items_id: 50, linked_action: 0, id_search_option: 12, old_value: '5', new_value: '6', user_name: 'Silva Ana (2)', date_mod: '2026-09-18 11:00:00' }],
  };
  client.glpiRequestData.mockImplementation(async path => result(payloads[path.split('?')[0]]));
  const tickets = await service.collect();
  expect(tickets).toHaveLength(1);
  expect(tickets[0]).toMatchObject({ id: 50, status: 'fechado', description: 'Descricao', category: 'Manutencao > Camera' });
  expect(tickets[0].items.map(item => item.itemId)).toEqual([4412, 99]);
  expect(tickets[0].interactions.map(item => item.kind)).toEqual(['task', 'response', 'solution', 'closure']);
  expect(tickets[0].interactions[3]).toMatchObject({ author: 'Ana Silva', date: '2026-09-18 11:00:00', sourceLogId: 8 });
  expect(tickets[0].interactions[2].status).toBe(2);
  expect(tickets[0].interactions[1]).toMatchObject({ isPrivate: true, author: 'Ana Silva' });
  expect(client.glpiRequestData.mock.calls.filter(([path]) => path === 'User/2')).toHaveLength(1);
});

test('paginacao obedece Content-Range mesmo quando o servidor reduz o tamanho da pagina', async () => {
  client.glpiRequestData.mockResolvedValueOnce(result([{ id: 1 }, { id: 2 }], '0-1/3'))
    .mockResolvedValueOnce(result([{ id: 3 }], '2-2/3'));
  expect(await service.listAll('Ticket/50/TicketTask')).toHaveLength(3);
  expect(client.glpiRequestData.mock.calls[1][0]).toContain('range=2-101');
});

test('pagina repetida e erro remoto nunca viram historico vazio bem sucedido', async () => {
  client.glpiRequestData.mockResolvedValueOnce(result([{ id: 1 }], '0-0/2'))
    .mockResolvedValueOnce(result([{ id: 1 }], '1-1/2'));
  await expect(service.listAll('Ticket/50/TicketTask')).rejects.toThrow('repetidos');
  client.glpiRequestData.mockResolvedValueOnce(null);
  await expect(service.listAll('Ticket/50/TicketTask')).rejects.toThrow('indisponivel');
});

test('falha na carga preserva snapshot anterior e permite nova tentativa', async () => {
  service.collect = jest.fn().mockRejectedValueOnce(new Error('GLPI offline')).mockResolvedValueOnce([]);
  await expect(service.sync()).rejects.toThrow('preservados');
  expect(repo.replaceSnapshot).not.toHaveBeenCalled();
  expect(repo.recordFailure).toHaveBeenCalledWith(4412);
  await service.sync();
  expect(repo.replaceSnapshot).toHaveBeenCalledWith(4412, []);
});

test('aberturas simultaneas compartilham uma carga e respeitam TTL/cooldown', async () => {
  service.collect = jest.fn().mockResolvedValue([]);
  await Promise.all([service.sync(), service.sync(), service.sync()]);
  expect(service.collect).toHaveBeenCalledTimes(1);
  repo.syncState.mockResolvedValue({ lastSyncedAt: new Date(), lastAttemptAt: new Date() });
  await service.sync(true);
  expect(service.collect).toHaveBeenCalledTimes(1);
  repo.syncState.mockResolvedValue({ lastSyncedAt: new Date(), lastAttemptAt: null });
  await service.sync();
  expect(service.collect).toHaveBeenCalledTimes(1);
});

test('ponto fora do piloto e de seus vinculos nao pode iniciar carga', async () => {
  repo.scope.mockResolvedValue({ enabled: false, isPilot: false });
  expect(await service.syncForEntity(999)).toBeNull();
  expect(repo.recordAttempt).not.toHaveBeenCalled();
  await expect(service.sync()).rejects.toThrow('Vinculo');
});

test('API remove conteudo privado com politica central fechada ate RBAC', async () => {
  repo.detail.mockResolvedValue({ id: 50, interactions: [{ id: 1, isPrivate: true, content: 'SEGREDO' }, { id: 2, isPrivate: false, content: 'Publico' }] });
  expect(canReadPrivateGlpiInteractions({ role: 'admin' })).toBe(false);
  const ticket = await service.detail(12130, 50);
  expect(ticket.privateInteractionsHidden).toBe(true);
  expect(JSON.stringify(ticket)).not.toContain('SEGREDO');
  expect(ticket.interactions).toHaveLength(1);
});

test('recusa usa acompanhamento explicitamente vinculado sem confundir estados GLPI', async () => {
  repo.detail.mockResolvedValue({ id: 2237, interactions: [
    { id: 1422, kind: 'solution', status: 4, decisionFollowupId: 505, decisionDate: '2023-08-25 12:39:14' },
    { id: 505, kind: 'response', content: 'Necessario novo atendimento', isPrivate: false },
    { id: 1790, kind: 'solution', status: 2 }, { id: 1791, kind: 'solution', status: 3 }
  ] });
  const ticket = await service.detail(12130, 2237);
  expect(ticket.interactions[0]).toMatchObject({ solutionStatusLabel: 'Recusada', rejection: { source: 'explicit', reason: 'Necessario novo atendimento' } });
  expect(ticket.interactions[2]).toMatchObject({ solutionStatusLabel: 'Aguardando aprovação', rejection: null });
  expect(ticket.interactions[3]).toMatchObject({ solutionStatusLabel: 'Aprovada', rejection: null });
});

test('registros antigos usam autor e horario unicos com origem inferida explicita', () => {
  const solution = { status: 4, decisionUserId: 10, decisionDate: '2023-08-25 12:39:14' };
  const response = { id: 505, kind: 'response', authorId: 10, date: '2023-08-25 12:39:13', content: 'Dados coletados' };
  expect(service.rejectionDetails(solution, [response])).toMatchObject({ reason: 'Dados coletados', source: 'time_author' });
  expect(service.rejectionDetails(solution, [response, { ...response, id: 506 }]).reason).toBeNull();
  expect(service.rejectionDetails(solution, [{ ...response, authorId: 11 }]).reason).toBeNull();
  expect(service.rejectionDetails({ ...solution, decisionFollowupId: 999 }, [response]).reason).toBeNull();
});

test('motivo privado nao vaza por dentro de uma solucao publica', async () => {
  repo.detail.mockResolvedValue({ id: 2237, interactions: [
    { id: 1422, kind: 'solution', status: 4, decisionFollowupId: 505 },
    { id: 505, kind: 'response', content: 'MOTIVO SECRETO', isPrivate: true }
  ] });
  const ticket = await service.detail(12130, 2237);
  expect(ticket.interactions).toHaveLength(1);
  expect(ticket.interactions[0].rejection).toMatchObject({ reason: null, restricted: true });
  expect(JSON.stringify(ticket)).not.toContain('MOTIVO SECRETO');
});
