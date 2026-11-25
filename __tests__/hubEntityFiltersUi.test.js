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


test('colunas obrigatórias sobrevivem às preferências; fontes e coordenadas não são colunas', () => {
 context.localStorage.getItem=()=>JSON.stringify({order:['tags','city','unknown'],visible:['city','unknown']});
 vm.runInContext('setupHubColumns()',context);
 expect(Array.from(vm.runInContext('visibleHubColumns()',context))).toEqual(['city','id','name']);
 expect(vm.runInContext('hubColumnDefaults.join(",")',context)).toBe('id,name,city,cicom,ip,fieldTechnician,nocTechnician,tags');
});

test('células mantêm ID HUB, comparação por fonte, escape e responsáveis vazios', () => {
 context.asset={clientId:12130,modalIndex:0,point:'<img>',platformIds:{auvo:['99'],glpi:['4412']},city:'Cidade HUB',cityBySource:{glpi:[{sourceRecordId:'4412',value:'<cidade>'}]}};
 expect(vm.runInContext('renderHubCell("id",asset)',context)).toContain('HUB-012130');
 expect(vm.runInContext('renderHubCell("id",asset)',context)).toContain('GLPI: 4412');
 expect(vm.runInContext('renderHubCell("city",asset)',context)).toContain('&lt;cidade&gt;');
 expect(vm.runInContext('renderHubCell("fieldTechnician",asset)',context)).toContain('Não disponível');
 expect(vm.runInContext('renderHubCell("name",asset)',context)).toContain('openAssetModal(0,12130)');
});


test('ocultar, mover e restaurar colunas não dispara consulta nem altera busca', () => {
 context.localStorage.setItem=jest.fn();
 vm.runInContext('setupHubColumns()',context);
 nodes.get('searchAsset').value='06-014';
 const options=nodes.get('hubColumnOptions');
 const change=options.addEventListener.mock.calls.find(call=>call[0]==='change')[1];
 const click=options.addEventListener.mock.calls.find(call=>call[0]==='click')[1];
 change({target:{dataset:{column:'ip'},checked:false}});
 expect(Array.from(vm.runInContext('visibleHubColumns()',context))).not.toContain('ip');
 click({target:{closest:()=>({dataset:{move:'tags',direction:'-1'}})}});
 expect(vm.runInContext('hubColumnOrder[6]',context)).toBe('tags');
 nodes.get('hubResetColumns').addEventListener.mock.calls[0][1]();
 expect(vm.runInContext('visibleHubColumns().length',context)).toBe(8);
 expect(nodes.get('searchAsset').value).toBe('06-014');
 expect(context.fetch).not.toHaveBeenCalled();
 expect(context.localStorage.setItem).toHaveBeenCalledTimes(3);
});


test('Enter executa busca imediatamente, preserva filtros e cancela debounce', async () => {
 vm.runInContext('setupFilters(); hubTagsLoaded=true; hubExcludedTags.add("DESINSTALADO");',context);
 const keydown=nodes.get('searchAsset').addEventListener.mock.calls.find(call=>call[0]==='keydown')[1];
 const preventDefault=jest.fn();
 keydown({key:'Enter',target:{value:'HUB-012130'},preventDefault});
 expect(preventDefault).toHaveBeenCalled();
 const params=new URLSearchParams(context.fetch.mock.calls[0][0].split('?')[1]);
 expect(params.get('search')).toBe('HUB-012130');
 expect(params.get('excludeTags')).toBe('DESINSTALADO');
 expect(params.get('offset')).toBe('0');
 await Promise.resolve();
});
