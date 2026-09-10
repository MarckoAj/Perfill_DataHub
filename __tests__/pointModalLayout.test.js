import { jest } from '@jest/globals';
import vm from 'node:vm';
import fs from 'node:fs';

const script = fs.readFileSync(new URL('../public/js/new-point-model.js', import.meta.url), 'utf8');
let context;
let client;
let requests;
beforeEach(() => {
  client = { clientId: 11938, entityId: 11938, hubId: 11938,
    platformFields: { hub: { name: 'HUB ponto', latitude: 0, longitude: -38 }, auvo: { id: 8532881, name: 'AUVO ponto' }, glpi: { id: 7560, name: 'GLPI ponto', status: 'INSTALADO' } },
    network: { ip: '10.0.0.1' }, pointStatus: { currentStatus: 'REMANEJADO' }, operationalHistory: [{ title: 'Evento HUB' }] };
  requests = [];
  context = vm.createContext({ URL, URLSearchParams, console, setTimeout, clearTimeout, clientsMock: [],
    window: { __currentPointModalClient: client }, localStorage: { getItem: () => null },
    document: { getElementById: () => null, addEventListener: () => {}, querySelectorAll: () => [] },
    fetch: url => new Promise(resolve => requests.push({ url, resolve })) });
  vm.runInContext(script, context);
  context.client = client;
  context.render = jest.fn();
  vm.runInContext('_renderBody = render;', context);
});

test('geral mostra quatro campos, ID da fonte, coordenada zero e N/A sem herdar do HUB', () => {
  const hub = vm.runInContext('_subTabContent(client)', context);
  expect((hub.match(/class="info-block"/g) || []).length).toBe(4);
  expect(hub).toContain('HUB-011938');
  expect(hub).toContain('>0</span>');
  const auvo = vm.runInContext("currentPlatformTab = 'auvo'; _subTabContent(client)", context);
  expect(auvo).toContain('8532881');
  expect(auvo).not.toContain('-38');
  expect(auvo).toContain('N/A');
  const sheet = vm.runInContext("currentPlatformTab = 'spreadsheet'; _subTabContent(client)", context);
  expect(sheet).not.toContain('HUB ponto');
  expect(sheet).not.toContain('8532881');
});

test('abas indisponíveis ficam bloqueadas também na navegação programática', () => {
  vm.runInContext("currentPointTab = 'status'; changePlatformTab('auvo')", context);
  expect(vm.runInContext('currentPointTab', context)).toBe('general');
  expect(vm.runInContext("_subTab('network', 'Rede')", context)).toContain('disabled');
  vm.runInContext("changePointTab('network')", context);
  expect(vm.runInContext('currentPointTab', context)).toBe('general');
  vm.runInContext("changePlatformTab('zabbix')", context);
  expect(vm.runInContext("_subTab('attendance', 'Atendimentos')", context)).toContain('disabled');
});

test('rede e estado GLPI não exibem dados nem ações manuais do HUB', () => {
  vm.runInContext("currentPlatformTab = 'glpi'; currentPointTab = 'network'", context);
  expect(vm.runInContext('_subTabContent(client)', context)).not.toContain('10.0.0.1');
  vm.runInContext("currentPointTab = 'status'", context);
  const html = vm.runInContext('_subTabContent(client)', context);
  expect(html).toContain('INSTALADO');
  expect(html).not.toContain('REMANEJADO');
  expect(html).not.toContain('Evento HUB');
  expect(html).not.toContain('onclick="addManualPhysicalStatusChange()"');
});

test('atendimentos paginam na mesma fonte e protegem conteúdo e links externos', async () => {
  vm.runInContext("currentPlatformTab = 'hub'; currentPointTab = 'attendance'", context);
  const pending = vm.runInContext('loadPointAttendances(20)', context);
  expect(requests[0].url).toContain('/11938/attendances?source=auvo&limit=20&offset=20');
  requests[0].resolve({ ok: true, json: async () => ({ success: true, data: { sourceId: 8532881,
    items: [{ id: 1, title: '<script>alert(1)</script>', url: 'javascript:alert(1)' }],
    selectedType: 'Vistoria', summary: { total: 21, byType: [{ type: 'Vistoria', total: 15 }, { type: '<Instalação>', total: 6 }] },
    pagination: { total: 21, limit: 20, offset: 20, hasMore: false } } }) });
  await pending;
  const html = vm.runInContext('renderPointAttendances(client)', context);
  expect(html).toContain('21–21 de 21');
  expect(html).toContain('Total de tarefas AUVO');
  expect(html).toContain('<strong>21</strong>');
  expect(html).toContain('<span>Vistoria</span><strong>15</strong>');
  expect(html).toContain('data-attendance-type="Vistoria"');
  expect(html).toContain('pm-attendance-count active');
  expect(html).toContain('Vistoria · 21–21 de 21');
  expect(html).toContain('&lt;Instalação&gt;');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('javascript:');
  expect(html).toContain('AUVO</button>');
  expect(html).toContain('GLPI</button>');
  vm.runInContext("currentPlatformTab = 'glpi'", context);
  expect(vm.runInContext('renderPointAttendances(client)', context)).not.toContain('AUVO</button>');
});

test('clicar em tipo alterna o filtro e recarrega desde a primeira página', () => {
  vm.runInContext("currentPlatformTab = 'hub'; currentPointTab = 'attendance'; pointAttendancePages['11938:auvo'] = {items: []}", context);
  vm.runInContext("filterPointAttendances('Novo tipo dinâmico')", context);
  expect(requests[0].url).toContain('type=Novo+tipo+din%C3%A2mico');
  expect(requests[0].url).toContain('offset=0');
  vm.runInContext("filterPointAttendances('Novo tipo dinâmico')", context);
  expect(requests[1].url).not.toContain('type=');
});

test('resposta atrasada de outro cliente não redesenha o modal atual', async () => {
  vm.runInContext("currentPointTab = 'attendance'", context);
  const pending = vm.runInContext('loadPointAttendances()', context);
  context.window.__currentPointModalClient = { ...client, clientId: 15527, hubId: 15527 };
  context.render.mockClear();
  requests[0].resolve({ ok: true, json: async () => ({ success: true, data: { items: [], pagination: { total: 0 } } }) });
  await pending;
  expect(context.render).not.toHaveBeenCalled();
});
