import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const query = jest.fn();
jest.unstable_mockModule('../src/database/connection.js', () => ({ default: { query } }));
const { default: repository } = await import('../src/repositories/hubEntityRepository.js');
const { listHubEntityAttendances } = await import('../src/controllers/hubEntityController.js');

const app = express();
app.get('/entities/:entityId/attendances', listHubEntityAttendances);

beforeEach(() => query.mockReset());

test('paginação AUVO mantém o cadastro vinculado e inclui tarefas concluídas', async () => {
  query.mockResolvedValueOnce([[{ entityId: 11938 }]])
    .mockResolvedValueOnce([[{ sourceNativeId: '8532881' }]])
    .mockResolvedValueOnce([[{ type: 'Vistoria', total: '15' }, { type: 'Instalação', total: '7' }]])
    .mockResolvedValueOnce([[{ id: 100, title: 'Vistoria', finished: 1, date: null }, { id: 99, title: 'Instalação', finished: 0, date: null }]]);
  const result = await repository.getEntityAttendances({ entityId: 11938, source: 'auvo', limit: 20, offset: 20 });
  expect(result.sourceId).toBe('8532881');
  expect(result.pagination).toEqual({ total: 22, limit: 20, offset: 20, hasMore: false });
  expect(result.items[0].status).toBe('Concluída');
  expect(result.summary).toEqual({ total: 22, byType: [{ type: 'Vistoria', total: 15 }, { type: 'Instalação', total: 7 }] });
  expect(query.mock.calls[2][0]).not.toContain('LIMIT');
  const [sql, params] = query.mock.calls[3];
  expect(params).toEqual(['8532881', 20, 20]);
  expect(sql).toContain('WHERE t.customerId = ?');
  expect(sql).not.toMatch(/WHERE.*finished|LIKE|customerId IN/i);
});

test('filtra dinamicamente pelo tipo AUVO mantendo a contagem geral', async () => {
  query.mockResolvedValueOnce([[{ entityId: 11938 }]])
    .mockResolvedValueOnce([[{ sourceNativeId: '8532881' }]])
    .mockResolvedValueOnce([[{ type: 'Vistoria', total: '15' }, { type: 'Tipo criado depois', total: '2' }]])
    .mockResolvedValueOnce([[{ id: 101, title: 'Tipo criado depois', finished: 0 }]]);
  const result = await repository.getEntityAttendances({ entityId: 11938, source: 'auvo', limit: 20, offset: 0, type: 'Tipo criado depois' });
  expect(result.selectedType).toBe('Tipo criado depois');
  expect(result.summary.total).toBe(17);
  expect(result.pagination.total).toBe(2);
  expect(query.mock.calls[3][1]).toEqual(['8532881', 'Tipo criado depois', 20, 0]);
  expect(query.mock.calls[3][0]).toContain("COALESCE(NULLIF(TRIM(tt.description), ''), 'Não informado') = ?");
});

test('GLPI usa somente localização do vínculo, sem busca ampla pelo código do ponto', async () => {
  query.mockResolvedValueOnce([[{ entityId: 11938 }]])
    .mockResolvedValueOnce([[{ locationId: 900 }]])
    .mockResolvedValueOnce([[{ type: 'Incidente', total: 1 }]])
    .mockResolvedValueOnce([[{ id: 42, title: 'Manutenção', status: 'Fechado' }]]);
  const result = await repository.getEntityAttendances({ entityId: 11938, source: 'glpi', limit: 20, offset: 0 });
  expect(result.sourceId).toBe(900);
  expect(result.items[0].status).toBe('Fechado');
  expect(result.pagination.hasMore).toBe(false);
  expect(result.summary.byType).toEqual([{ type: 'Incidente', total: 1 }]);
  expect(query.mock.calls[3][1]).toEqual([900, 20, 0]);
  expect(query.mock.calls[3][0]).not.toMatch(/LIKE|nomeCliente =/);
});

test('GLPI sem localização vinculada retorna vazio, sem associar chamados por nome', async () => {
  query.mockResolvedValueOnce([[{ entityId: 11938 }]]).mockResolvedValueOnce([[]]);
  const result = await repository.getEntityAttendances({ entityId: 11938, source: 'glpi', limit: 20, offset: 0 });
  expect(result.items).toEqual([]);
  expect(result.sourceId).toBeNull();
  expect(result.summary).toEqual({ total: 0, byType: [] });
  expect(result.unavailableReason).toContain('ID de localização');
  expect(query).toHaveBeenCalledTimes(2);
});

test.each([
  '/entities/1/attendances?source=spreadsheet',
  '/entities/1x/attendances?source=auvo',
  '/entities/1/attendances?source=auvo&offset=-1',
  '/entities/1/attendances?source=auvo&limit=101',
  '/entities/1/attendances?source=auvo&offset=1.5',
  `/entities/1/attendances?source=auvo&type=${'a'.repeat(201)}`
])('rejeita parâmetros inválidos sem consultar o banco: %s', async url => {
  expect((await request(app).get(url)).status).toBe(400);
  expect(query).not.toHaveBeenCalled();
});

test('retorna 404 para entidade inexistente', async () => {
  query.mockResolvedValueOnce([[]]);
  expect((await request(app).get('/entities/123/attendances?source=auvo')).status).toBe(404);
});
