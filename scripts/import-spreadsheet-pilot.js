import { readPilotWorkbook, importSpreadsheetPilot } from '../src/services/spreadsheetPilotImportService.js';
import pool from '../src/database/connection.js';

const args = process.argv.slice(2);
const argument = name => args[args.indexOf(name) + 1];
try {
  if (!args.includes('--base') || !args.includes('--management')) throw new Error('Uso: node scripts/import-spreadsheet-pilot.js --base arquivo.xlsx --management arquivo.xlsx [--apply]. Sem --apply: somente prévia. Piloto fixo HUB 12130.');
  const snapshots = await Promise.all([readPilotWorkbook(argument('--base'), 'base'), readPilotWorkbook(argument('--management'), 'management')]);
  console.log(JSON.stringify(await importSpreadsheetPilot(snapshots, { apply: args.includes('--apply') }), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await pool.end(); }
