import { jest } from '@jest/globals';
import vm from 'node:vm';
import fs from 'node:fs';
const scripts = ['new-point-model.js', 'glpi-point-history.js'].map(name => fs.readFileSync(new URL(`../public/js/${name}`, import.meta.url), 'utf8'));
let context, client;
beforeEach(() => {
  client = { clientId: 12130, hubId: 12130 };
  context = vm.createContext({ URL, URLSearchParams, console, setTimeout, clientsMock: [],
    window: { __currentPointModalClient: client }, localStorage: { getItem: () => 'token' },
    document: { getElementById: () => null, querySelectorAll: () => [] }, fetch: jest.fn() });
  for (const script of scripts) vm.runInContext(script, context);
  context.client = client;
  context.render = jest.fn();
  vm.runInContext("_renderBody = render; currentPointTab = 'attendance'; currentAttendanceSource = 'glpi';", context);
});

test('primeira visao tem cinco campos, elementos associados e links HUB no detalhe', () => {
  context.state = { historyMode: true, isPilot: true, items: [{ id: 50, title: '<script>Titulo</script>', category: 'Camera', devices: [{ name: '06-014', itemId: 4412, hubId: 12130 }, { name: 'Outro', itemId: 99, hubId: 999 }] }], pagination: { total: 1, limit: 20 }, offset: 0 };
  const html = vm.runInContext('renderPointGlpiHistory(client, state)', context);
  for (const label of ['ID', 'Título', 'Última atualização', 'Elementos associados', 'Categoria']) expect(html).toContain(`data-label="${label}"`);
  expect(html).toContain('&lt;script&gt;Titulo&lt;/script&gt;');
  expect(html).not.toContain('<script>');
  expect(html).toContain('AUVO</button>');
  expect(html).toContain('GLPI</button>');
  context.ticket = { title: 'Chamado', devices: context.state.items[0].devices, privateInteractionsHidden: true, interactions: [{ kind: 'solution', content: '<img onerror=alert(1)>', solutionType: 'Troca' }], url: 'javascript:alert(1)' };
  const detail = vm.runInContext('renderPointGlpiTicket(ticket)', context);
  expect(detail).toContain('openGlpiRelatedPoint(999)');
  expect(detail).toContain('acesso restrito');
  expect(detail).toContain('Tipo de solução:');
  expect(detail).not.toContain('<img');
  expect(detail).not.toContain('javascript:');
});

test('piloto carrega historico por dispositivo sem chamar endpoint antigo por localizacao', async () => {
  context.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { enabled: true, items: [], pagination: { total: 0, limit: 20 } } }) });
  await vm.runInContext('loadPointAttendances()', context);
  expect(context.fetch).toHaveBeenCalledTimes(1);
  expect(context.fetch.mock.calls[0][0]).toContain('/12130/glpi-history');
  expect(vm.runInContext("pointAttendancePages['12130:glpi'].historyMode", context)).toBe(true);
});

test('detalhe destaca ID a direita e preserva escape nas interacoes originais', () => {
  context.ticket = { id: 2237, title: 'Chamado', devices: [], interactions: [{ kind: 'solution', status: 4, content: '<img onerror=alert(1)>',
    rejection: { reason: '<img onerror=alert(1)>', source: 'time_author', date: '2023-08-25 12:39:14' } }] };
  const html = vm.runInContext('renderPointGlpiTicket(ticket)', context);
  expect(html).toContain('class="pm-glpi-detail-id" aria-label="Chamado 2237">#2237');
  expect(html).toContain('Recusada');
  expect(html).not.toContain('Comentário registrado no momento da recusa');
  expect(html).not.toContain('não informa vínculo direto');
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
});

test('pontos fora do piloto mantem o fluxo anterior', async () => {
  context.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { enabled: false } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { items: [], pagination: { total: 0 } } }) });
  await vm.runInContext('loadPointAttendances()', context);
  expect(context.fetch.mock.calls[1][0]).toContain('/attendances?source=glpi');
});

test('mantem apenas acompanhamento original, sem sintetizar evento de recusa', () => {
  context.ticket = { id: 2237, title: 'Chamado', devices: [], interactions: [
    { id: 1422, kind: 'solution', status: 4, date: '2023-08-23 09:30:53', content: 'Solucao original',
      rejection: { date: '2023-08-25 12:39:14', author: 'Rafael', reason: 'Comentario unico', followupId: 505, source: 'time_author' } },
    { id: 505, kind: 'response', date: '2023-08-25 12:39:13', content: 'Comentario unico' },
    { id: 506, kind: 'response', date: '2023-08-25 14:28:25', content: 'Outra resposta' }
  ] };
  const timeline = vm.runInContext('pointGlpiTimeline(ticket.interactions)', context);
  expect(Array.from(timeline, item => item.kind)).toEqual(['solution', 'response', 'response']);
  expect(timeline[1].date).toBe('2023-08-25 12:39:13');
  const html = vm.runInContext('renderPointGlpiTicket(ticket)', context);
  expect(html).not.toContain('pm-glpi-rejection');
  expect(html).not.toContain('<div class="pm-glpi-rejection">');
  expect(html.match(/Comentario unico/g)).toHaveLength(1);
  expect(html).not.toContain('Recusa da solução');
  expect(html.indexOf('Solucao original')).toBeLessThan(html.indexOf('Comentario unico'));
  expect(html.indexOf('Comentario unico')).toBeLessThan(html.indexOf('Outra resposta'));
});

test('falha na atualizacao preserva os chamados na tela', async () => {
  vm.runInContext("pointAttendancePages['12130:glpi'] = { historyMode: true, offset: 0, items: [{id: 50}], pagination: {total: 1} }", context);
  context.fetch.mockRejectedValueOnce(new Error('Offline'));
  await vm.runInContext('refreshPointGlpiHistory(true)', context);
  expect(vm.runInContext("pointAttendancePages['12130:glpi'].items[0].id", context)).toBe(50);
  expect(vm.runInContext("pointAttendancePages['12130:glpi'].refreshError", context)).toBe('Offline');
});

test('navegacao carrega outro HUB e abre diretamente seus atendimentos GLPI', async () => {
  context.fetchHubEntityDetails = jest.fn().mockResolvedValue({ entityId: 999 });
  context.mapHubEntityDetailsToModalClient = details => ({ clientId: details.entityId, hubId: details.entityId });
  context.open = jest.fn(next => { context.window.__currentPointModalClient = next; });
  vm.runInContext('openPointModal = open', context);
  await vm.runInContext('openGlpiRelatedPoint(999)', context);
  expect(context.fetchHubEntityDetails).toHaveBeenCalledWith(999);
  expect(context.open).toHaveBeenCalledWith({ clientId: 999, hubId: 999 });
  expect(vm.runInContext('currentAttendanceSource', context)).toBe('glpi');
  expect(vm.runInContext('currentPointTab', context)).toBe('attendance');
});

test('resposta de navegacao atrasada nao reabre o modal que foi fechado', async () => {
  let resolve;
  context.fetchHubEntityDetails = () => new Promise(done => { resolve = done; });
  context.mapHubEntityDetailsToModalClient = details => details;
  context.open = jest.fn();
  vm.runInContext('openPointModal = open', context);
  const pending = vm.runInContext('openGlpiRelatedPoint(999)', context);
  context.window.__currentPointModalClient = null;
  resolve({ entityId: 999 });
  await pending;
  expect(context.open).not.toHaveBeenCalled();
});


test('planilha base mostra campos originais por seção e não empresta dados da rede HUB', () => {
 context.client={clientId:12130,network:{ip:'IP do HUB'},platformFields:{spreadsheet:{importedSections:{network:[{key:'circuit',label:'CIRCUITO',value:'ONN5011194'},{key:'ip',label:'IP',value:null}],status:[{key:'inspectionDate',label:'DATA DA VISTORIA',value:'2022-05-30'}]}}}};
 const html=vm.runInContext("currentPlatformTab='spreadsheet';currentPointTab='network';_subTabContent(client)",context);
 expect(html).toContain('ONN5011194');
 expect(html).not.toContain('IP do HUB');
 const status=vm.runInContext("currentPointTab='status';_subTabContent(client)",context);
 expect(status).toContain('2022-05-30');
});


test('exclamação aparece somente no campo divergente, com valores escapados',()=>{
 context.client={divergences:{enabled:true,platforms:{auvo:{available:true,count:1,lastSyncAt:'2026-11-25T12:00:00Z',items:[{fieldKey:'name',hubValue:'<HUB>',sourceValue:'<AUVO>',status:'different'}]},glpi:{available:true,count:0,items:[]}}}};
 const html=vm.runInContext("currentPlatformTab='auvo';_field('Nome','Atual',null,null,client,'name')",context);
 expect(html).toContain('pm-field-difference');expect(html).toContain('&lt;HUB&gt;');expect(html).toContain('&lt;AUVO&gt;');
 expect(vm.runInContext("_field('Latitude',0,null,null,client,'latitude')",context)).not.toContain('pm-field-difference');
 expect(vm.runInContext("currentPlatformTab='glpi';_field('Nome','Atual',null,null,client,'name')",context)).not.toContain('pm-field-difference');
 expect(vm.runInContext("currentPlatformTab='auvo';renderPlatformSyncTime(client)",context)).toContain('Última sincronização:');
 expect(vm.runInContext("currentPlatformTab='hub';_field('Nome','Atual',null,null,client,'name')",context)).not.toContain('pm-field-difference');
 expect(vm.runInContext("renderPlatformSyncTime(client)",context)).toBe('');
});
