import { readSheet } from 'read-excel-file/node';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import pool from '../database/connection.js';
import { isIP } from 'node:net';
import { spreadsheetBaseFields } from '../config/spreadsheetBaseFields.js';

const pilot = { entityId: 12130, auvoId: '8561713', glpiId: '4412' };
const configurations = {
  base: { sheet: 'BASE_PERFILL_INST', name: 'ID/ENDEREÇO', fields: Object.fromEntries(spreadsheetBaseFields.map(([header,key])=>[key,header])) },
  management: { sheet: 'EQUIPES POR REGIÃO', name: 'ued', fields: { city: 'CIDADE', cicom: 'CICOM', unit: 'UNIDADE', fieldTechnician: 'TEC.RESPONSAVEL', nocTechnician: 'RESP.NOC' } }
};
const text = value => value == null ? '' : String(value).trim();
const normalized = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
export function usableValue(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0,10);
  const result = text(value);
  return ['', 'N/A', 'NA', 'NAO SE APLICA', '-', '—', '#N/A', '#REF!', '#VALUE!'].includes(normalized(result)) ? null : result;
}

export function validSubnet(value) {
  if (isIP(value) !== 4) return false;
  const bits = value.split('.').map(part => Number(part).toString(2).padStart(8,'0')).join('');
  return /^1*0*$/.test(bits);
}

export function extractPilotRows(rows, kind) {
  const config = configurations[kind];
  const headers = rows[0]?.map(normalized) || [];
  const column = label => {
    const indexes = headers.flatMap((header, index) => header === normalized(label) ? [index] : []);
    if (indexes.length !== 1) throw new Error(`Cabeçalho ausente ou duplicado: ${label}`);
    return indexes[0];
  };
  const auvo = column('ID AUVO');
  const glpi = kind === 'base' ? column('IDDOGLPI') : null;
  const name = column(config.name);
  const columns = Object.entries(config.fields).map(([field, label]) => [field, column(label)]);
  const matches = rows.slice(1).flatMap((row, index) => text(row[auvo]) === pilot.auvoId || (glpi !== null && text(row[glpi]) === pilot.glpiId) ? [{ row, rowNumber: index + 2 }] : []);
  if (matches.length !== 1) throw new Error(`${kind}: esperado um registro do piloto; encontrados ${matches.length}. Revisão necessária.`);
  const { row, rowNumber } = matches[0];
  if (text(row[auvo]) !== pilot.auvoId || (glpi !== null && text(row[glpi]) !== pilot.glpiId)) throw new Error(`${kind}: IDs AUVO/GLPI conflitantes.`);
  if (!/(?:^|[^0-9])06-014(?=[^0-9]|$)/.test(text(row[name]))) throw new Error(`${kind}: nome não corresponde ao piloto 06-014.`);
  const rawFields = Object.fromEntries(columns.map(([field,index]) => [field, row[index] instanceof Date ? row[index].toISOString().slice(0,10) : row[index] ?? null]));
  const fields = Object.fromEntries(columns.map(([field, index]) => [field,
    kind === 'base' && spreadsheetBaseFields.some(([,key,section]) => key === field && section === 'status') && normalized(row[index]) === 'NAO SE APLICA'
      ? text(row[index]) : usableValue(row[index])]));
  return { kind, sheet: config.sheet, rowNumber, recordId: `${kind}:auvo:${pilot.auvoId}`, fields, rawFields };
}

export async function readPilotWorkbook(path, kind) {
  // Ler o mesmo snapshot para calcular hash e interpretar, mesmo se a cópia mudar no disco.
  const buffer = await readFile(path);
  const rows = await readSheet(buffer, configurations[kind].sheet);
  return { ...extractPilotRows(rows, kind), file: basename(path), sha256: createHash('sha256').update(buffer).digest('hex') };
}

export function buildPilotPlan(snapshots, currentFields) {
  const management = snapshots.find(source => source.kind === 'management');
  const base = snapshots.find(source => source.kind === 'base');
  if (!management || !base) throw new Error('As duas planilhas são obrigatórias.');
  return [...new Set([...Object.keys(base.fields), ...Object.keys(management.fields)])].map(fieldKey => {
    const chosen = management.fields[fieldKey] ? management : base;
    const value = chosen.fields[fieldKey] || null;
    const existing = currentFields.filter(row => row.fieldKey === fieldKey && row.sourceSystem === 'HUB' && row.isCanonical);
    const statusField = spreadsheetBaseFields.some(([,key,section]) => key === fieldKey && section === 'status');
    const filled = existing.find(row => usableValue(row.valueText) !== null || row.valueNumber != null || (statusField && normalized(row.valueText) === 'NAO SE APLICA'));
    const invalidNetwork = value && ['ip','gateway','linkEquipmentIp'].includes(fieldKey) && !isIP(value);
    const invalidMask = value && fieldKey === 'subnet' && !validSubnet(value);
    const invalidCoordinate = value && ['latitude','longitude'].includes(fieldKey) && (!Number.isFinite(Number(value)) || Math.abs(Number(value)) > (fieldKey === 'latitude' ? 90 : 180));
    return { fieldKey, value, source: chosen.kind, status: filled ? 'preserved' : !value ? 'unavailable' : invalidNetwork || invalidMask || invalidCoordinate ? 'review' : 'fill', previousValue: filled?.valueText ?? null,
      sourceConflict: !!(management.fields[fieldKey] && base.fields[fieldKey] && normalized(management.fields[fieldKey]) !== normalized(base.fields[fieldKey])) };
  });
}

export async function importSpreadsheetPilot(snapshots, { apply = false } = {}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[entity]] = await connection.query('SELECT entityId FROM hub_entities WHERE entityId = ? AND isActive = 1 FOR UPDATE', [pilot.entityId]);
    if (!entity) throw new Error('Piloto HUB não encontrado.');
    const [sources] = await connection.query("SELECT sourceNativeId FROM hub_entity_sources WHERE entityId = ? AND sourceSystem = 'AUVO' AND sourceEntity = 'customer' AND isActive = 1", [pilot.entityId]);
    const [links] = await connection.query("SELECT sourceNativeId FROM hub_entity_links WHERE entityId = ? AND sourceSystem = 'GLPI' AND sourceEntity = 'device' AND isActive = 1", [pilot.entityId]);
    if (!sources.some(row => String(row.sourceNativeId) === pilot.auvoId) || !links.some(row => String(row.sourceNativeId) === pilot.glpiId)) throw new Error('Vínculos do piloto não conferem com as planilhas.');
    const [current] = await connection.query('SELECT fieldKey,sourceSystem,valueText,valueNumber,isCanonical FROM hub_entity_field_values WHERE entityId = ? FOR UPDATE', [pilot.entityId]);
    const plan = buildPilotPlan(snapshots, current);
    if (apply) {
      for (const snapshot of snapshots) {
        const [owners] = await connection.query("SELECT entityId FROM hub_entity_links WHERE sourceSystem = 'SPREADSHEET' AND sourceEntity = ? AND sourceNativeId = ? FOR UPDATE", [snapshot.kind, snapshot.recordId]);
        if (owners.some(row => Number(row.entityId) !== pilot.entityId)) throw new Error('Registro da planilha já vinculado a outro HUB.');
        const metadata = JSON.stringify({ file: snapshot.file, sheet: snapshot.sheet, rowNumber: snapshot.rowNumber, sha256: snapshot.sha256, rawFields: snapshot.rawFields, readAt: new Date().toISOString() });
        await connection.query(`INSERT INTO hub_entity_links (entityId,sourceSystem,sourceEntity,sourceNativeId,relationRole,matchStrategy,isPrimary,isActive,metadata,lastSeenAt)
          VALUES (?,'SPREADSHEET',?,?,'supplementary','verified_pilot_ids',0,1,?,NOW())
          ON DUPLICATE KEY UPDATE metadata=VALUES(metadata), isActive=1,lastSeenAt=NOW()`, [pilot.entityId, snapshot.kind, snapshot.recordId, metadata]);
        for (const [fieldKey, value] of Object.entries(snapshot.fields)) {
          const [old] = await connection.query("SELECT valueText FROM hub_entity_field_values WHERE entityId=? AND fieldKey=? AND sourceSystem='SPREADSHEET' AND sourceRecordId=?", [pilot.entityId, fieldKey, snapshot.recordId]);
          await connection.query(`INSERT INTO hub_entity_field_values (entityId,fieldKey,sourceSystem,sourceEntity,sourceRecordId,valueText,normalizedValue,isCanonical,lastSeenAt)
            VALUES (?,?,'SPREADSHEET',?,?,?,?,0,NOW()) ON DUPLICATE KEY UPDATE valueText=VALUES(valueText),normalizedValue=VALUES(normalizedValue),lastSeenAt=NOW()`, [pilot.entityId, fieldKey, snapshot.kind, snapshot.recordId, value, value]);
          if ((old[0]?.valueText ?? null) !== value) await connection.query(`INSERT INTO hub_entity_history (entityId,fieldKey,action,sourceSystem,targetSystem,oldValue,newValue,message,createdBy)
            VALUES (?,?,'spreadsheet_source_import','SPREADSHEET','SPREADSHEET',?,?,?,'local_pilot_import')`, [pilot.entityId, fieldKey, old[0]?.valueText ?? null, value, metadata]);
        }
      }
      for (const field of plan.filter(item => item.status === 'fill')) {
        // Preservar qualquer campo HUB preenchido. Substituir apenas representações vazias.
        await connection.query("DELETE FROM hub_entity_field_values WHERE entityId=? AND fieldKey=? AND sourceSystem='HUB' AND isCanonical=1", [pilot.entityId, field.fieldKey]);
        await connection.query(`INSERT INTO hub_entity_field_values (entityId,fieldKey,sourceSystem,sourceEntity,sourceRecordId,valueText,normalizedValue,isCanonical,lastSeenAt)
          VALUES (?,?,'HUB','canonical',?,?,?,1,NOW())`, [pilot.entityId, field.fieldKey, String(pilot.entityId), field.value, field.value]);
        const origin = snapshots.find(snapshot => snapshot.kind === field.source);
        await connection.query(`INSERT INTO hub_entity_history (entityId,fieldKey,action,sourceSystem,targetSystem,newValue,message,createdBy)
          VALUES (?,?,'spreadsheet_fill_missing_hub','SPREADSHEET','HUB',?,?,'local_pilot_import')`, [pilot.entityId, field.fieldKey, field.value, JSON.stringify({ file: origin.file, sheet: origin.sheet, rowNumber: origin.rowNumber, sha256: origin.sha256, priority: 'management' })]);
      }
      await connection.commit();
    } else await connection.rollback();
    return { applied: apply, entityId: pilot.entityId, plan, sources: snapshots.map(({ fields, rawFields, ...source }) => source) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
