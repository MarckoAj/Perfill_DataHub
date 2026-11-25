import {randomUUID} from 'node:crypto';
import {same} from '../repositories/pointOperationRepository.js';
const fields=new Set(['address','name','latitude','longitude','city','cicom','unit','fieldTechnician','nocTechnician','deviceType','locationName','project']);
const allowed={hub:fields,auvo:new Set(['name','latitude','longitude','address']),glpi:new Set(['name','address'])};
const error=(status,message)=>Object.assign(new Error(message),{status});
const native={auvo:'8561713',glpi:'4412'};
function requireActor(actor){if(!Number.isSafeInteger(actor?.id)||actor.id<=0||typeof actor.username!=='string'||!actor.username)throw error(401,'Operador não identificado.');}
export function validateValue(key,value) {
 if(!fields.has(key)||value==null||!['string','number'].includes(typeof value))throw error(400,'Campo ou valor inválido.');
 const text=String(value).trim();if(!text||text.length>255||['N/A','NA','NÃO INFORMADO','NAO INFORMADO'].includes(text.toUpperCase()))throw error(400,'Valor ausente ou inválido.');
 if(['latitude','longitude'].includes(key)){const number=Number(text.replace(',','.'));if(!Number.isFinite(number)||Math.abs(number)>(key==='latitude'?90:180))throw error(400,'Coordenada inválida.');return Number(number.toFixed(8));}
 return text;
}
export class PointOperationService {
 constructor(repository,adapter,{externalWritesEnabled=()=>process.env.HUB_POINT_EXTERNAL_WRITES==='true'}={}){this.repository=repository;this.adapter=adapter;this.externalWritesEnabled=externalWritesEnabled;}
 validate(entityId,input) {
  if(String(entityId)!=='12130')throw error(403,'Operação disponível somente no piloto 06-014.');
  if(!['edit','sync'].includes(input?.mode)||!['hub','auvo','glpi'].includes(input.origin)||!Array.isArray(input.items)||input.items.length<1||input.items.length>33)throw error(400,'Operação inválida.');
  if(input.mode==='edit'&&input.origin!=='hub')throw error(400,'Edição manual exclusiva do HUB.');
  const seen=new Set();const items=input.items.map(item=>{
   if(!item||!allowed[item.target]?.has(item.fieldKey)||!Object.hasOwn(item,'oldValue'))throw error(400,'Campo sem mapeamento compatível no destino.');
   const key=item.target+':'+item.fieldKey;if(seen.has(key))throw error(400,'Campo repetido.');seen.add(key);
   if(item.oldValue!==null&&!['string','number'].includes(typeof item.oldValue))throw error(400,'Valor anterior inválido.');
   const newValue=validateValue(item.fieldKey,item.newValue);if(same(item.fieldKey,item.oldValue,newValue))throw error(400,'Campo sem alteração efetiva.');
   return {target:item.target,fieldKey:item.fieldKey,oldValue:item.oldValue,newValue};
  });
  if(input.mode==='edit')for(const item of items.filter(item=>item.target!=='hub')){
   const local=items.find(row=>row.target==='hub'&&row.fieldKey===item.fieldKey);
   if(!local||!same(item.fieldKey,local.newValue,item.newValue))throw error(400,'Propagação deve corresponder à edição do HUB.');
  }
  if(input.mode==='sync') {
   const targets=new Set(items.map(item=>item.target));
   if(targets.size!==1||targets.has(input.origin)||(input.origin!=='hub'&&!targets.has('hub')))throw error(400,'Direção de sincronização inválida.');
   const incoming=input.origin==='auvo'?new Set(['name','latitude','longitude','address']):new Set(['name','latitude','longitude','address']);
   if(input.origin!=='hub'&&items.some(item=>!incoming.has(item.fieldKey)))throw error(400,'Campo sem leitura compatível na origem.');
  }
  return {mode:input.mode,origin:input.origin,items};
 }
 async fresh(c,plan) {
  const snapshot=await this.repository.snapshot(c),external={};
  const platforms=new Set(plan.items.map(item=>item.target).filter(target=>target!=='hub'));
  if(plan.mode==='sync'&&plan.origin!=='hub')platforms.add(plan.origin);
  for(const platform of platforms) {
   if(snapshot.links[platform]!==native[platform])throw error(409,'Correlação do piloto mudou ou está indisponível.');
   external[platform]=await this.adapter.read(platform,native[platform],plan.items.map(item=>item.fieldKey));
  }
  for(const [target,record] of Object.entries(external))await this.repository.cache(c,target,record.values);
  return {snapshot,external};
 }
 assertCurrent(plan,fresh) {
  if(plan.links&&JSON.stringify(plan.links)!==JSON.stringify(fresh.snapshot.links))throw error(409,'Vínculos alterados após revisão.');
  if(plan.locations)for(const [target,location] of Object.entries(plan.locations))if((fresh.external[target]?.locationId??null)!==location)throw error(409,'Localização da origem alterada após revisão.');
  for(const item of plan.items) {
   const current=item.target==='hub'?fresh.snapshot.hub[item.fieldKey]:fresh.external[item.target]?.values[item.fieldKey];
   if(!same(item.fieldKey,current,item.oldValue))throw error(409,'Valor do destino mudou. Atualize a ficha e revise novamente.');
   if(plan.mode==='sync'){
    const source=plan.origin==='hub'?fresh.snapshot.hub[item.fieldKey]:fresh.external[plan.origin]?.values[item.fieldKey];
    if(!same(item.fieldKey,source,item.newValue))throw error(409,'Valor da origem mudou. Atualize a ficha e revise novamente.');
   }
  }
 }
 async prepare(entityId,input,actor) {
  requireActor(actor);
  const plan=this.validate(entityId,input);
  if(plan.items.some(item=>item.target!=='hub')&&!this.externalWritesEnabled())throw error(503,'Envio ao AUVO/GLPI desabilitado durante a homologação. Selecione somente o HUB ou utilize um ambiente de testes.');
  return this.repository.withLock(async c=>{
   const fresh=await this.fresh(c,plan);this.assertCurrent(plan,fresh);
   const prepared={...plan,links:fresh.snapshot.links,locations:Object.fromEntries(Object.entries(fresh.external).map(([target,record])=>[target,record.locationId??null]))};
   const operation={id:randomUUID(),actor,plan:prepared,expiresAt:Date.now()+10*60*1000};
   await this.repository.create(c,operation);
   return {operationId:operation.id,expiresAt:operation.expiresAt,plan:prepared};
  });
 }
 async confirm(entityId,id,actor) {
  requireActor(actor);
  if(String(entityId)!=='12130'||typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw error(400,'Operação inválida.');
  return this.repository.withLock(async c=>{
   const operation=await this.repository.get(c,id);
   if(!operation||Number(operation.actorId)!==Number(actor.id))throw error(404,'Operação não encontrada.');
   if(operation.state!=='PREPARED')return {operationId:id,state:operation.state,results:operation.result||[],replayed:true};
   if(new Date(operation.expiresAt).getTime()<Date.now())throw error(410,'Revisão expirada. Revise novamente.');
   const plan=operation.plan;
   if(plan.items.some(item=>item.target!=='hub')&&!this.externalWritesEnabled())throw error(503,'Envio externo desabilitado durante a homologação.');
   const fresh=await this.fresh(c,plan);this.assertCurrent(plan,fresh);
   if(!await this.repository.claim(c,id))throw error(409,'Operação já iniciada.');
   const results=[];
   for(const target of ['hub','auvo','glpi']) {
    const items=plan.items.filter(item=>item.target===target);if(!items.length)continue;
    let attempted=false;
    try {
     if(target==='hub')await this.repository.applyHub(c,id,actor,plan.origin,items);
     else {
      const latest=await this.repository.snapshot(c);if(latest.links[target]!==plan.links[target])throw error(409,'Correlação mudou durante execução.');
      const before=await this.adapter.read(target,native[target],items.map(item=>item.fieldKey));
      if(items.some(item=>!same(item.fieldKey,before.values[item.fieldKey],item.oldValue)))throw error(409,'Destino alterado durante execução.');
      for(const item of items)await this.repository.record(c,id,actor,plan.origin,item,'started');
      if(plan.locations && (before.locationId??null)!==(plan.locations[target]??null))throw error(409,'Localização mudou durante execução.');
      attempted=true;await this.adapter.write(target,native[target],items);
      const after=await this.adapter.read(target,native[target],items.map(item=>item.fieldKey));
      if(items.some(item=>!same(item.fieldKey,after.values[item.fieldKey],item.newValue)))throw error(502,'Leitura de confirmação não corresponde ao valor enviado.');
      await this.repository.cache(c,target,after.values);
      for(const item of items)await this.repository.record(c,id,actor,plan.origin,item,'succeeded');
     }
     results.push({target,status:'succeeded',fields:items.map(item=>item.fieldKey)});
    }catch(failure){
     const status=attempted?'uncertain':failure.status===409?'conflict':'failed';
     for(const item of items)await this.repository.record(c,id,actor,plan.origin,item,status,'Verifique o destino antes de qualquer nova tentativa.');
     results.push({target,status,fields:items.map(item=>item.fieldKey),message:status==='conflict'?'Valor ou vínculo alterado.':status==='uncertain'?'Resultado externo não confirmado. Consulte a plataforma antes de tentar novamente.':'Não foi possível aplicar este destino.'});
    }
    await this.repository.progress(c,id,'RUNNING',results);
   }
   const succeeded=results.filter(result=>result.status==='succeeded').length;
   const state=succeeded===results.length?'COMPLETED':succeeded?'PARTIAL':'FAILED';
   await this.repository.progress(c,id,state,results);
   return {operationId:id,state,results};
  });
 }
 async status(entityId,id,actor) {
  requireActor(actor);
  if(String(entityId)!=='12130')throw error(403,'Fora do piloto.');
  return this.repository.withRead(async c=>{const operation=await this.repository.get(c,id);if(!operation||Number(operation.actorId)!==Number(actor.id))throw error(404,'Operação não encontrada.');return {operationId:id,state:operation.state,results:operation.result||[],...(operation.state==='PREPARED'?{plan:operation.plan,expiresAt:operation.expiresAt}:{})};});
 }
}
