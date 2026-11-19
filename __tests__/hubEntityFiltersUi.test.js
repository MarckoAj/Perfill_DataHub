import { jest } from '@jest/globals';
import vm from 'node:vm';
import fs from 'node:fs';

const script = fs.readFileSync(new URL('../public/js/clientes.js', import.meta.url), 'utf8');
let context, nodes;
beforeEach(() => {
  nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', textContent: '', querySelectorAll: () => [], addEventListener: jest.fn() });
    return nodes.get(id);
  };
  context = vm.createContext({ URLSearchParams, console, setTimeout, clearTimeout,
    document: { getElementById: node, querySelectorAll: () => [], addEventListener: jest.fn() },
    window: {}, localStorage: { getItem: () => null }, fetch: jest.fn()
  });
  vm.runInContext(fs.readFileSync(new URL('../public/js/hub-client-modal.js', import.meta.url), 'utf8'), context);
  vm.runInContext(script, context);
  context.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ entityId: 12130, name: '06-014', operationalTags: [] }], meta: { pagination: { total: 201, limit: 100, offset: 100, hasMore: true } } }) });
});

test('paginação mantém tags, sem tags, exclusões, coordenadas e busca na API', async () => {
  await vm.runInContext("hubTagsLoaded = true; hubSelectedTags.add('IMPLANTACAO'); hubExcludedTags.add('DESINSTALADO'); hubIncludeUntagged = true; hubCoordinates = 'complete'; loadHubEntities(2, 'HUB-012130');", context);
  const params = new URLSearchParams(context.fetch.mock.calls[0][0].split('?')[1]);
  expect(Object.fromEntries(params)).toMatchObject({ offset: '100', includeTags: 'IMPLANTACAO', excludeTags: 'DESINSTALADO', includeUntagged: 'true', coordinates: 'complete', search: 'HUB-012130' });
  nodes.get('searchAsset') || vm.runInContext('document.getElementById("searchAsset")', context);
  nodes.get('searchAsset').value = 'HUB-012130';
  vm.runInContext('applyFilters()', context);
  expect(nodes.get('assetsTableBody').innerHTML).toContain('06-014');
});

test('limpar e restaurar padrão preservam busca, reiniciam página e diferem na exclusão', async () => {
  vm.runInContext("hubTagsLoaded = true; hubOperationalTags = [{label:'Desinstalado', normalizedLabel:'DESINSTALADO', hideByDefault:true}]; document.getElementById('searchAsset').value = '06-014'; hubSelectedTags.add('IMPLANTACAO'); hubIncludeUntagged = true; hubCoordinates = 'missing';", context);
  context.event = { target: { closest: () => ({ dataset: { reset: 'clear' } }) } };
  vm.runInContext('handleHubFilterClick(event)', context);
  let params = new URLSearchParams(context.fetch.mock.calls[0][0].split('?')[1]);
  expect(Object.fromEntries(params)).toMatchObject({ offset: '0', search: '06-014', includeTags: '', excludeTags: '', includeUntagged: 'false', coordinates: 'all' });
  context.event = { target: { closest: () => ({ dataset: { reset: 'default' } }) } };
  vm.runInContext('handleHubFilterClick(event)', context);
  params = new URLSearchParams(context.fetch.mock.calls[1][0].split('?')[1]);
  expect(params.get('excludeTags')).toBe('DESINSTALADO');
  expect(params.get('search')).toBe('06-014');
  await Promise.resolve();
});

test('falha ao carregar tags preserva padrão do servidor; falha de dados não exibe mocks', async () => {
  await vm.runInContext('loadHubEntities()', context);
  expect(new URLSearchParams(context.fetch.mock.calls[0][0].split('?')[1]).has('excludeTags')).toBe(false);
  context.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
  await vm.runInContext('loadHubEntities()', context);
  vm.runInContext('applyFilters()', context);
  expect(nodes.get('assetsTableBody').innerHTML).toContain('Não foi possível carregar');
  expect(nodes.get('assetsTableBody').innerHTML).not.toContain('06-014');
});
