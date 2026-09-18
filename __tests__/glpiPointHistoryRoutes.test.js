import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const service = { list: jest.fn(), detail: jest.fn(), syncForEntity: jest.fn() };
jest.unstable_mockModule('../src/services/glpiPointHistoryService.js', () => ({ default: service }));
const { default: routes } = await import('../src/routes/hubRoutes.js');
const app = express();
app.use(express.json());
app.use('/api/hub', routes);
const authBefore = process.env.API_AUTH_TOKEN;
beforeEach(() => { process.env.API_AUTH_TOKEN = 'history-test'; Object.values(service).forEach(fn => fn.mockReset()); });
afterAll(() => { if (authBefore === undefined) delete process.env.API_AUTH_TOKEN; else process.env.API_AUTH_TOKEN = authBefore; });
const auth = req => req.set('Authorization', 'Bearer history-test');

test('rotas de lista, detalhes e sincronizacao exigem autenticacao', async () => {
  for (const suffix of ['', '/40111']) expect((await request(app).get(`/api/hub/entities/12130/glpi-history${suffix}`)).status).toBe(401);
  expect((await request(app).post('/api/hub/entities/12130/glpi-history/sync')).status).toBe(401);
  expect(service.list).not.toHaveBeenCalled();
  expect(service.detail).not.toHaveBeenCalled();
  expect(service.syncForEntity).not.toHaveBeenCalled();
});

test('lista paginada consulta o ponto solicitado', async () => {
  service.list.mockResolvedValue({ enabled: true, items: [] });
  expect((await auth(request(app).get('/api/hub/entities/12130/glpi-history?limit=20&offset=20'))).status).toBe(200);
  expect(service.list).toHaveBeenCalledWith(12130, 20, 20);
});

test.each(['12130x/glpi-history', '12130/glpi-history?limit=101', '12130/glpi-history?offset=-1', '12130/glpi-history/1x'])(
  'rejeita parametros invalidos: %s', async path => {
    expect((await auth(request(app).get(`/api/hub/entities/${path}`))).status).toBe(400);
    expect(service.list).not.toHaveBeenCalled();
    expect(service.detail).not.toHaveBeenCalled();
  });

test('chamado sem vinculo retorna 404 e parametros nao concedem acesso privado', async () => {
  service.detail.mockResolvedValue(null);
  expect((await auth(request(app).get('/api/hub/entities/999/glpi-history/40111?includePrivate=true&role=admin'))).status).toBe(404);
  expect(service.detail).toHaveBeenCalledWith(999, 40111);
});

test('sincronizacao fora do piloto e falha remota retornam erros claros', async () => {
  service.syncForEntity.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('upstream secret'));
  expect((await auth(request(app).post('/api/hub/entities/999/glpi-history/sync').send({}))).status).toBe(404);
  const failed = await auth(request(app).post('/api/hub/entities/12130/glpi-history/sync').send({ force: true }));
  expect(failed.status).toBe(502);
  expect(failed.body.message).toContain('preservados');
  expect(JSON.stringify(failed.body)).not.toContain('secret');
});
