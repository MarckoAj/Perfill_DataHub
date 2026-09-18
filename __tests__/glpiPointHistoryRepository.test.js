import { jest } from '@jest/globals';
const query = jest.fn();
const connection = { query: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
jest.unstable_mockModule('../src/database/connection.js', () => ({ default: { query, getConnection: async () => connection } }));
const { default: repo } = await import('../src/repositories/glpi/glpiPointHistoryRepository.js');
beforeEach(() => { query.mockReset(); for (const fn of Object.values(connection)) fn.mockReset(); });

test('chamado compartilhado aparece pelo dispositivo de qualquer HUB associado', async () => {
  query.mockResolvedValueOnce([[{ total: 1 }]])
    .mockResolvedValueOnce([[{ id: 50, title: 'Compartilhado' }]])
    .mockResolvedValueOnce([[{ ticketId: 50, itemId: 4412, hubId: 12130 }, { ticketId: 50, itemId: 99, hubId: 999 }]]);
  const page = await repo.list(999, 4412, 20, 0);
  expect(page.items[0].devices.map(item => item.hubId)).toEqual([12130, 999]);
  expect(query.mock.calls[1][1]).toEqual([4412, 999, 20, 0]);
  expect(query.mock.calls[1][0]).toContain('EXISTS');
  expect(query.mock.calls[1][0]).toContain('l.isActive = 1');
  expect(query.mock.calls[1][0]).not.toMatch(/location|LIKE/i);
});

test('detalhe exige vinculo exato entre o chamado e o ponto solicitado', async () => {
  query.mockResolvedValueOnce([[]]);
  expect(await repo.detail(999, 50, 4412)).toBeNull();
  expect(query.mock.calls[0][1]).toEqual([50, 4412, 999]);
  expect(query.mock.calls[0][0]).toContain('EXISTS');
});

test('snapshot e remocao de vinculos obsoletos sao atomicos e restritos ao piloto', async () => {
  await repo.replaceSnapshot(4412, [{ id: 50, title: 'Titulo', description: '', status: 'fechado', category: '', dateUpdated: null, interactions: [], items: [{ itemType: 'Peripheral', itemId: 4412, name: 'Ponto' }] }]);
  expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
  expect(connection.commit).toHaveBeenCalledTimes(1);
  expect(connection.rollback).not.toHaveBeenCalled();
  expect(connection.query.mock.calls[0][1]).toEqual([4412]);
  expect(connection.query.mock.calls[0][0]).toContain('t.ownerDeviceId = ?');
  expect(connection.release).toHaveBeenCalledTimes(1);
});

test('rollback restaura cache quando a gravacao falha', async () => {
  connection.query.mockRejectedValueOnce(new Error('DB failure'));
  await expect(repo.replaceSnapshot(4412, [])).rejects.toThrow('DB failure');
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});
