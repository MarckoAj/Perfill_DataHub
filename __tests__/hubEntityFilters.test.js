import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../src/database/connection.js', () => ({ default: { query: jest.fn() } }));
const { default: repository } = await import('../src/repositories/hubEntityRepository.js');
const { default: service } = await import('../src/services/hubEntityService.js');
const { default: tagsService } = await import('../src/services/hubOperationalTagService.js');
const { default: tagsRepository } = await import('../src/repositories/hubOperationalTagRepository.js');
const { listHubEntities } = await import('../src/controllers/hubEntityController.js');
const app = express();
app.get('/entities', listHubEntities);
afterEach(() => jest.restoreAllMocks());
const tags = (...values) => values.map(normalizedLabel => ({ normalizedLabel }));

test('seleção combina tags por OU, permite sem tags e exclusão prevalece', () => {
  const pass = (values, options) => repository.passesOperationalTagFilters(tags(...values), options);
  expect(pass([], {})).toBe(true);
  expect(pass(['IMPLANTACAO'], {})).toBe(true);
  expect(pass(['IMPLANTACAO'], { includeTags: ['Implantação', 'Vandalizado'] })).toBe(true);
  expect(pass([], { includeTags: ['Implantação'] })).toBe(false);
  expect(pass([], { includeTags: ['Implantação'], includeUntagged: true })).toBe(true);
  expect(pass(['IMPLANTACAO'], { includeUntagged: true })).toBe(false);
  expect(pass(['IMPLANTACAO', 'DESINSTALADO'], { includeTags: ['Implantação'], excludeTags: ['Desinstalado'] })).toBe(false);
});

test.each([
  [0, 0, 'complete'], [-12, -38, 'complete'], [null, 0, 'incomplete'],
  [0, null, 'incomplete'], [null, null, 'missing'], [undefined, NaN, 'missing']
])('coordenadas %s/%s pertencem somente a %s, incluindo zero válido', (latitude, longitude, expected) => {
  for (const mode of ['complete', 'incomplete', 'missing']) {
    expect(repository.passesCoordinateFilter({ latitude, longitude }, mode)).toBe(mode === expected);
  }
  expect(repository.passesCoordinateFilter({ latitude, longitude }, 'all')).toBe(true);
});

test('filtra antes de paginar e usa os mesmos critérios no total', async () => {
  jest.spyOn(repository, 'listEntityRows').mockResolvedValue([
    { entityId: 1, name: 'Um', latitude: null, longitude: null },
    { entityId: 2, name: 'Dois', latitude: 0, longitude: 0 },
    { entityId: 3, name: 'Três', latitude: 1, longitude: 2 },
    { entityId: 4, name: 'Quatro', latitude: 3, longitude: 4 }
  ]);
  jest.spyOn(tagsService, 'listTags').mockResolvedValue([]);
  jest.spyOn(tagsRepository, 'listEntityTagsMap').mockResolvedValue(new Map());
  const result = await service.listEntities({ refresh: false, coordinates: 'complete', includeUntagged: true, excludeTags: '', limit: 1, offset: 1 });
  expect(result.entities.map(entity => entity.entityId)).toEqual([3]);
  expect(result.pagination).toEqual({ limit: 1, offset: 1, total: 3, hasMore: true });
});

test('padrão usa configuração das tags; exclusão vazia remove padrão explicitamente', async () => {
  const list = jest.spyOn(repository, 'listEntities').mockResolvedValue([]);
  jest.spyOn(repository, 'countEntities').mockResolvedValue(0);
  jest.spyOn(tagsService, 'listTags').mockResolvedValue([{ normalizedLabel: 'DESINSTALADO', hideByDefault: true }]);
  await service.listEntities({ refresh: false });
  expect(list.mock.calls[0][0].excludeTags).toEqual(['DESINSTALADO']);
  await service.listEntities({ refresh: false, excludeTags: '' });
  expect(list.mock.calls[1][0].excludeTags).toEqual([]);
});

test('API repassa filtros e recusa coordenadas desconhecidas', async () => {
  const list = jest.spyOn(service, 'listEntities').mockResolvedValue({ entities: [], pagination: { total: 0 } });
  await request(app).get('/entities?coordinates=missing&includeUntagged=true&includeTags=Implantacao&excludeTags=&offset=100').expect(200);
  expect(list).toHaveBeenCalledWith(expect.objectContaining({ coordinates: 'missing', includeUntagged: true, includeTags: 'Implantacao', excludeTags: '', offset: 100 }));
  await request(app).get('/entities?coordinates=invalid').expect(400);
  expect(list).toHaveBeenCalledTimes(1);
});

test('busca aceita ID HUB formatado e usa parâmetros SQL', () => {
  const params = [];
  const clause = repository.buildEntitySearchClause('HUB-012130', params);
  expect(clause).toContain("CONCAT('HUB-', LPAD(e.entityId, 6, '0')) LIKE ?");
  expect(params).toHaveLength((clause.match(/\?/g) || []).length);
  expect(params.every(value => value === '%HUB-012130%')).toBe(true);
});
