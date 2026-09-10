import { jest } from '@jest/globals';

const connection = { query: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
const pool = { getConnection: jest.fn().mockResolvedValue(connection), query: jest.fn() };
jest.unstable_mockModule('../src/database/connection.js', () => ({ default: pool }));
const { default: repository } = await import('../src/repositories/hubMatchingRepository.js');
const input = { entityId: 14901, glpiDevice: { deviceId: '10681', name: '11-176 RUA A' }, score: 100, matchStrategy: 'name', confirmedBy: 'test' };

beforeEach(() => {
  jest.clearAllMocks();
  connection.query.mockReset();
  connection.query.mockResolvedValueOnce([[{ entityId: 14901 }]])
    .mockResolvedValueOnce([[{ deviceId: 10681 }]]);
});

test('confirma vínculo e histórico na mesma transação com locks', async () => {
  connection.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 1 }]);
  expect(await repository.upsertGlpiLink(input)).toMatchObject({ success: true, status: 'confirmed' });
  expect(connection.query.mock.calls[0][0]).toContain('FOR UPDATE');
  expect(connection.query.mock.calls[1][0]).toContain('FOR UPDATE');
  expect(connection.query.mock.calls[2][0]).toContain('FOR UPDATE');
  expect(connection.query.mock.calls[3][0]).not.toContain('entityId = VALUES(entityId)');
  expect(connection.query.mock.calls[4][0]).toContain('INSERT INTO hub_entity_history');
  expect(connection.commit).toHaveBeenCalledTimes(1);
  expect(connection.rollback).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});

test('não transfere dispositivo pertencente a outro HUB, mesmo após prévia antiga', async () => {
  connection.query.mockResolvedValueOnce([[{ entityId: 15660, sourceNativeId: '10681', isActive: 1 }]]);
  expect(await repository.upsertGlpiLink(input)).toMatchObject({ success: false, status: 'device_already_linked', linkedHubEntityId: 15660 });
  expect(connection.query).toHaveBeenCalledTimes(3);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
});

test('não adiciona segundo dispositivo ao mesmo HUB', async () => {
  connection.query.mockResolvedValueOnce([[{ entityId: 14901, sourceNativeId: '11139', isActive: 1 }]]);
  expect(await repository.upsertGlpiLink(input)).toMatchObject({ success: false, status: 'hub_already_linked' });
  expect(connection.query).toHaveBeenCalledTimes(3);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
});

test('confirmação repetida do mesmo vínculo não duplica histórico', async () => {
  connection.query.mockResolvedValueOnce([[{ entityId: 14901, sourceNativeId: '10681', isActive: 1 }]]);
  expect(await repository.upsertGlpiLink(input)).toMatchObject({ success: true, status: 'already_linked' });
  expect(connection.query).toHaveBeenCalledTimes(3);
});

test('falha no histórico desfaz também a gravação do vínculo', async () => {
  connection.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ affectedRows: 1 }]).mockRejectedValueOnce(new Error('history failed'));
  await expect(repository.upsertGlpiLink(input)).rejects.toThrow('history failed');
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});
