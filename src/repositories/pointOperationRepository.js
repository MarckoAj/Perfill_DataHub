import pool from '../database/connection.js';
const decode=value=>typeof value==='string'?JSON.parse(value):value;
export class PointOperationRepository {
 async withRead(work){const c=await pool.getConnection();try{return await work(c);}finally{c.release();}}
 async withLock(work) {
  const c=await pool.getConnection();let locked=false;
  try {const [[r]]=await c.query("SELECT GET_LOCK('hub-point-12130',5) AS acquired");if(Number(r.acquired)!==1)throw Object.assign(new Error('Outro operador está alterando o piloto. Tente novamente.'),{status:409});locked=true;return await work(c);}
  finally{try{if(locked)await c.query("DO RELEASE_LOCK('hub-point-12130')");}finally{c.release();}}
 }
 async snapshot(c) {
  const [[entity]]=await c.query('SELECT entityId,isActive FROM hub_entities WHERE entityId=12130');
  if(!entity?.isActive)throw Object.assign(new Error('Piloto indisponível.'),{status:404});
  const [fields]=await c.query("SELECT fieldValueId,fieldKey,valueText,valueNumber FROM hub_entity_field_values WHERE entityId=12130 AND sourceSystem='HUB' AND isCanonical=1");
  const [sources]=await c.query("SELECT sourceNativeId FROM hub_entity_sources WHERE entityId=12130 AND sourceSystem='AUVO' AND sourceEntity='customer' AND isActive=1");
  const [links]=await c.query("SELECT sourceNativeId FROM hub_entity_links WHERE entityId=12130 AND sourceSystem='GLPI' AND sourceEntity='device' AND isActive=1");
  if(new Set(fields.map(row=>row.fieldKey)).size!==fields.length)throw Object.assign(new Error('Campos canônicos duplicados: revisão necessária.'),{status:409});
  const hub=Object.fromEntries(fields.map(row=>[row.fieldKey,row.valueNumber??row.valueText]));
  const unique=rows=>rows.length===1?String(rows[0].sourceNativeId):null;
  return {hub,canonicalIds:Object.fromEntries(fields.map(row=>[row.fieldKey,row.fieldValueId])),links:{auvo:unique(sources),glpi:unique(links)}};
 }
 async create(c,operation) {await c.query("INSERT INTO hub_point_operations(operationId,entityId,actorId,actorName,state,plan,expiresAt) VALUES(?,12130,?,?,'PREPARED',?,?)",[operation.id,operation.actor.id,operation.actor.username,JSON.stringify(operation.plan),new Date(operation.expiresAt)]);}
 async get(c,id) {const [[row]]=await c.query('SELECT * FROM hub_point_operations WHERE operationId=? AND entityId=12130',[id]);return row?{...row,plan:decode(row.plan),result:decode(row.result)}:null;}
 async claim(c,id) {const [r]=await c.query("UPDATE hub_point_operations SET state='RUNNING' WHERE operationId=? AND state='PREPARED'",[id]);return r.affectedRows===1;}
 async progress(c,id,state,result) {await c.query('UPDATE hub_point_operations SET state=?,result=? WHERE operationId=?',[state,JSON.stringify(result),id]);}
 async record(c,id,actor,origin,item,status,reason='') {
  await c.query('INSERT INTO hub_entity_history(entityId,fieldKey,action,sourceSystem,targetSystem,oldValue,newValue,message,createdBy) VALUES(12130,?,?,?,?,?,?,?,?)',[item.fieldKey,'point_operation_'+status,origin.toUpperCase(),item.target.toUpperCase(),item.oldValue==null?null:String(item.oldValue),String(item.newValue),'Operação '+id+' · '+status+(reason?' · '+reason:''),actor.username]);
 }
 async applyHub(c,id,actor,origin,items) {
  await c.beginTransaction();
  try {
   // Row locks also protect against other local writers during this atomic target update.
   await c.query('SELECT entityId FROM hub_entities WHERE entityId=12130 FOR UPDATE');
   const current=await this.snapshot(c);
   for(const item of items) {
    if(!same(item.fieldKey,current.hub[item.fieldKey],item.oldValue))throw Object.assign(new Error('HUB alterado após revisão.'),{status:409});
    if(current.canonicalIds[item.fieldKey])await c.query("UPDATE hub_entity_field_values SET valueText=?,valueNumber=?,normalizedValue=?,lastSeenAt=NOW() WHERE fieldValueId=? AND entityId=12130 AND sourceSystem='HUB' AND isCanonical=1",[String(item.newValue),['latitude','longitude'].includes(item.fieldKey)?Number(item.newValue):null,String(item.newValue),current.canonicalIds[item.fieldKey]]);
    else await c.query("INSERT INTO hub_entity_field_values(entityId,fieldKey,sourceSystem,sourceEntity,sourceRecordId,valueText,valueNumber,normalizedValue,isCanonical,lastSeenAt) VALUES(?,?,'HUB','canonical','12130',?,?,?,1,NOW()) ON DUPLICATE KEY UPDATE valueText=VALUES(valueText),valueNumber=VALUES(valueNumber),normalizedValue=VALUES(normalizedValue),lastSeenAt=NOW()",[12130,item.fieldKey,String(item.newValue),['latitude','longitude'].includes(item.fieldKey)?Number(item.newValue):null,String(item.newValue)]);
    if(item.fieldKey==='name')await c.query('UPDATE hub_entities SET canonicalName=?,displayName=? WHERE entityId=12130',[item.newValue,item.newValue]);
    await this.record(c,id,actor,origin,item,'succeeded');
   }
   await c.commit();
  }catch(error){await c.rollback();throw error;}
 }
 async cache(c,target,values) {
  if(target==='auvo')await c.query('UPDATE customers_auvo SET description=?,latitude=?,longitude=?,address=?,lastSyncAt=NOW() WHERE customerId=8561713',[values.name,values.latitude,values.longitude,values.address]);
  if(target==='glpi'){
   if(Object.hasOwn(values,'address'))await c.query("UPDATE glpi_devices SET rawJson=JSON_SET(COALESCE(rawJson,JSON_OBJECT()),'$.location',JSON_MERGE_PATCH(COALESCE(JSON_EXTRACT(rawJson,'$.location'),JSON_OBJECT()),JSON_OBJECT('address',?))),lastSyncAt=NOW() WHERE deviceId=4412",[values.address]);
   const keys=['name','latitude','longitude','locationId'].filter(key=>Object.hasOwn(values,key));
   await c.query('UPDATE glpi_devices SET '+keys.map(key=>key+'=?').join(',')+',lastSyncAt=NOW() WHERE deviceId=4412',keys.map(key=>values[key]));
  }
 }
}
export function same(key,a,b) {
 if(a==null||a==='')return b==null||b==='';
 if(b==null||b==='')return false;
 if(['latitude','longitude'].includes(key))return Number(a).toFixed(8)===Number(b).toFixed(8);
 return String(a)===String(b);
}
export default new PointOperationRepository();
