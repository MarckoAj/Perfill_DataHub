import { spreadsheetBaseFields } from '../src/config/spreadsheetBaseFields.js';
import { jest } from '@jest/globals';
const connection = { beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn(), query: jest.fn() };
jest.unstable_mockModule('../src/database/connection.js', () => ({ default: { getConnection: async () => connection } }));
const { extractPilotRows, buildPilotPlan, usableValue, validSubnet, importSpreadsheetPilot } = await import('../src/services/spreadsheetPilotImportService.js');
const source = kind => ({ kind, recordId: `${kind}:auvo:8561713`, fields: { city: kind === 'management' ? 'OLINDINA' : 'Olindina', cicom: 'CICOM', unit: kind === 'management' ? 'Unidade gestão' : 'Unidade base', ...(kind === 'management' ? { fieldTechnician: 'Técnico', nocTechnician: 'NOC' } : {}) } });
beforeEach(() => {
  jest.clearAllMocks();
  connection.query.mockImplementation(async sql => {
    if (sql.startsWith('SELECT entityId FROM hub_entities')) return [[{ entityId: 12130 }]];
    if (sql.includes('FROM hub_entity_sources')) return [[{ sourceNativeId: '8561713' }]];
    if (sql.includes("sourceSystem = 'GLPI'")) return [[{ sourceNativeId: '4412' }]];
    return [[]];
  });
});
test('rejeita duplicidade, IDs cruzados e cabeçalhos ausentes', () => {
  const header = ['ID AUVO','IDDOGLPI','ID/ENDEREÇO','MUNICIPIO','CICOM','UNIDADE',...spreadsheetBaseFields.map(([h])=>h).filter(h=>!['ID AUVO','IDDOGLPI','ID/ENDEREÇO','MUNICIPIO','CICOM','UNIDADE'].includes(h))];
  const row = ['8561713','4412','06-014 ponto','Olindina','CICOM','Unidade'];
  expect(extractPilotRows([header,row],'base').rowNumber).toBe(2);
  expect(() => extractPilotRows([header,row,row],'base')).toThrow('encontrados 2');
  expect(() => extractPilotRows([header,['999','4412',...row.slice(2)]],'base')).toThrow('conflitantes');
  expect(() => extractPilotRows([['ID AUVO'],row],'base')).toThrow('Cabeçalho');
});
test('prioriza gerenciamento, preserva canônicos preenchidos e separa conflitos', () => {
  const plan = buildPilotPlan([source('base'),source('management')], [{fieldKey:'city',sourceSystem:'HUB',isCanonical:1,valueText:'Cidade definida'}]);
  expect(plan.find(x=>x.fieldKey==='city').status).toBe('preserved');
  expect(plan.find(x=>x.fieldKey==='unit')).toMatchObject({value:'Unidade gestão',sourceConflict:true,status:'fill'});
  expect(plan.find(x=>x.fieldKey==='fieldTechnician').value).toBe('Técnico');
  expect(usableValue('N/A')).toBeNull();
});
test('prévia não grava e faz rollback', async () => {
  const result=await importSpreadsheetPilot([source('base'),source('management')]);
  expect(result.applied).toBe(false);
  expect(connection.query.mock.calls.some(([sql])=>/INSERT|DELETE|UPDATE/.test(sql.replace('FOR UPDATE','')))).toBe(false);
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.commit).not.toHaveBeenCalled();
});
test('aplicação grava fontes e histórico na transação e não altera outros pontos', async () => {
  await importSpreadsheetPilot([source('base'),source('management')],{apply:true});
  const writes=connection.query.mock.calls.filter(([sql])=>sql.startsWith('INSERT')||sql.startsWith('DELETE'));
  expect(writes.length).toBeGreaterThan(10);
  expect(writes.every(([,params])=>params[0]===12130)).toBe(true);
  expect(connection.commit).toHaveBeenCalledTimes(1);
});
test('erro de vínculo provoca rollback e nenhuma escrita', async () => {
  connection.query.mockResolvedValue([[]]);
  await expect(importSpreadsheetPilot([source('base'),source('management')],{apply:true})).rejects.toThrow('não encontrado');
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.commit).not.toHaveBeenCalled();
});


test('rede inválida exige revisão e datas mantêm calendário da planilha', () => {
 const base=source('base'), management=source('management');
 Object.assign(base.fields,{ip:'10.98.95.186',subnet:'255255255248',gateway:'999.1.2.3',linkEquipmentIp:'10.98.156.186'});
 const plan=buildPilotPlan([base,management],[]);
 expect(plan.find(x=>x.fieldKey==='ip').status).toBe('fill');
 expect(plan.find(x=>x.fieldKey==='subnet').status).toBe('review');
 expect(plan.find(x=>x.fieldKey==='gateway').status).toBe('review');
 expect(validSubnet('255.255.255.248')).toBe(true);
 expect(validSubnet('255.0.255.0')).toBe(false);
 expect(usableValue(new Date('2022-08-26T00:00:00Z'))).toBe('2022-08-26');
});
