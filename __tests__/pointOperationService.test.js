import {jest} from '@jest/globals';
import {PointOperationService} from '../src/services/pointOperationService.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const actor={id:7,username:'operador'};
let repository,adapter,service,db,remote,operations;
const edit=()=>({mode:'edit',origin:'hub',items:[{target:'hub',fieldKey:'name',oldValue:'Original',newValue:'Novo'},{target:'auvo',fieldKey:'name',oldValue:'Auvo',newValue:'Novo'},{target:'glpi',fieldKey:'name',oldValue:'GLPI',newValue:'Novo'}]});
beforeEach(()=>{
 db={hub:{name:'Original',latitude:0},links:{auvo:'8561713',glpi:'4412'}};
 remote={auvo:{values:{name:'Auvo',latitude:0,longitude:1}},glpi:{values:{name:'GLPI'}}};operations=new Map();
 repository={withLock:async work=>work({}),snapshot:jest.fn(async()=>clone(db)),cache:jest.fn(async()=>{}),
 create:jest.fn(async(c,operation)=>operations.set(operation.id,{actorId:operation.actor.id,state:'PREPARED',plan:clone(operation.plan),expiresAt:new Date(operation.expiresAt),result:null})),
 get:jest.fn(async(c,id)=>operations.get(id)),claim:jest.fn(async(c,id)=>{const operation=operations.get(id);if(operation.state!=='PREPARED')return false;operation.state='RUNNING';return true;}),
 progress:jest.fn(async(c,id,state,result)=>Object.assign(operations.get(id),{state,result:clone(result)})),record:jest.fn(async()=>{}),
 applyHub:jest.fn(async(c,id,user,origin,items)=>{for(const item of items)db.hub[item.fieldKey]=item.newValue;})};
 adapter={read:jest.fn(async target=>clone(remote[target])),write:jest.fn(async(target,id,items)=>{for(const item of items)remote[target].values[item.fieldKey]=item.newValue;})};
 service=new PointOperationService(repository,adapter,{externalWritesEnabled:()=>true});
});
test('preparar não grava fontes nem HUB; confirmar registra destinos e repetir não reaplica',async()=>{
 const review=await service.prepare(12130,edit(),actor);expect(adapter.write).not.toHaveBeenCalled();expect(repository.applyHub).not.toHaveBeenCalled();
 const result=await service.confirm(12130,review.operationId,actor);expect(result.state).toBe('COMPLETED');expect(db.hub.name).toBe('Novo');expect(adapter.write).toHaveBeenCalledTimes(2);
 expect(repository.record).toHaveBeenCalledWith(expect.anything(),review.operationId,actor,'hub',expect.objectContaining({target:'auvo',oldValue:'Auvo',newValue:'Novo'}),'succeeded');
 const replay=await service.confirm(12130,review.operationId,actor);expect(replay.replayed).toBe(true);expect(adapter.write).toHaveBeenCalledTimes(2);
});
test('mudança entre revisão e confirmação impede todas as gravações',async()=>{
 const review=await service.prepare(12130,edit(),actor);remote.auvo.values.name='Alteração concorrente';
 await expect(service.confirm(12130,review.operationId,actor)).rejects.toMatchObject({status:409});expect(adapter.write).not.toHaveBeenCalled();expect(repository.applyHub).not.toHaveBeenCalled();
});
test('falha externa não informa sucesso integral e não impede outro destino',async()=>{
 adapter.write.mockImplementation(async(target,id,items)=>{if(target==='auvo')throw new Error('timeout');for(const item of items)remote[target].values[item.fieldKey]=item.newValue;});
 const review=await service.prepare(12130,edit(),actor),result=await service.confirm(12130,review.operationId,actor);
 expect(result.state).toBe('PARTIAL');expect(result.results.map(row=>[row.target,row.status])).toEqual([['hub','succeeded'],['auvo','uncertain'],['glpi','succeeded']]);
 expect(repository.record).toHaveBeenCalledWith(expect.anything(),review.operationId,actor,'hub',expect.objectContaining({target:'auvo'}),'uncertain',expect.any(String));
});
test('não aceita piloto diferente, IDs, valores inválidos ou propagação sem edição HUB',async()=>{
 await expect(service.prepare(8438,edit(),actor)).rejects.toMatchObject({status:403});
 for(const item of [{target:'hub',fieldKey:'id',oldValue:12130,newValue:1},{target:'hub',fieldKey:'latitude',oldValue:0,newValue:91},{target:'hub',fieldKey:'name',oldValue:'Original',newValue:'N/A'},{target:'glpi',fieldKey:'deviceType',oldValue:null,newValue:'TIPO II'}])await expect(service.prepare(12130,{mode:'edit',origin:'hub',items:[item]},actor)).rejects.toMatchObject({status:400});
 await expect(service.prepare(12130,{mode:'edit',origin:'hub',items:[edit().items[1]]},actor)).rejects.toMatchObject({status:400});expect(adapter.write).not.toHaveBeenCalled();
});
test('verifica identidade, expiração e propriedade da revisão',async()=>{
 await expect(service.prepare(12130,edit(),null)).rejects.toMatchObject({status:401});
 const review=await service.prepare(12130,edit(),actor);
 await expect(service.confirm(12130,review.operationId,{id:8,username:'outro'})).rejects.toMatchObject({status:404});
 operations.get(review.operationId).expiresAt=new Date(0);await expect(service.confirm(12130,review.operationId,actor)).rejects.toMatchObject({status:410});expect(adapter.write).not.toHaveBeenCalled();
});
test('origem de sincronização é relida e não pode ter valor forjado',async()=>{
 const input={mode:'sync',origin:'auvo',items:[{target:'hub',fieldKey:'name',oldValue:'Original',newValue:'Auvo'}]};
 const review=await service.prepare(12130,input,actor);remote.auvo.values.name='Outro';await expect(service.confirm(12130,review.operationId,actor)).rejects.toMatchObject({status:409});
 input.items[0].newValue='Forjado';await expect(service.prepare(12130,input,actor)).rejects.toMatchObject({status:409});
});
test('vínculo alterado e leitura de confirmação divergente não são considerados sucesso',async()=>{
 const review=await service.prepare(12130,edit(),actor);db.links.glpi='999';await expect(service.confirm(12130,review.operationId,actor)).rejects.toMatchObject({status:409});
 db.links.glpi='4412';adapter.write.mockResolvedValue(undefined);const result=await service.confirm(12130,review.operationId,actor);expect(result.state).toBe('PARTIAL');expect(result.results.filter(row=>row.target!=='hub').every(row=>row.status==='uncertain')).toBe(true);
});

test('status de revisão pendente retorna plano persistido para não confirmar valores diferentes dos exibidos',async()=>{
 repository.withRead=async work=>work({});
 const review=await service.prepare(12130,edit(),actor),status=await service.status(12130,review.operationId,actor);
 expect(status.state).toBe('PREPARED');expect(status.plan.items).toEqual(review.plan.items);expect(adapter.write).not.toHaveBeenCalled();
});

test('homologação bloqueia saída externa por padrão, mantendo edição somente HUB',async()=>{
 const restricted=new PointOperationService(repository,adapter,{externalWritesEnabled:()=>false});
 await expect(restricted.prepare(12130,edit(),actor)).rejects.toMatchObject({status:503});expect(adapter.write).not.toHaveBeenCalled();
 const review=await restricted.prepare(12130,{...edit(),items:[edit().items[0]]},actor);const result=await restricted.confirm(12130,review.operationId,actor);expect(result.state).toBe('COMPLETED');expect(adapter.write).not.toHaveBeenCalled();
});

test('operação interrompida não é reiniciada automaticamente',async()=>{
 const review=await service.prepare(12130,edit(),actor);operations.get(review.operationId).state='RUNNING';
 const result=await service.confirm(12130,review.operationId,actor);expect(result.state).toBe('RUNNING');expect(result.replayed).toBe(true);expect(adapter.write).not.toHaveBeenCalled();
});
test('conflito em destino após início produz resultado parcial sem sobrescrever o destino alterado',async()=>{
 repository.applyHub.mockImplementation(async(c,id,user,origin,items)=>{for(const item of items)db.hub[item.fieldKey]=item.newValue;remote.glpi.values.name='Concorrente';});
 const review=await service.prepare(12130,edit(),actor),result=await service.confirm(12130,review.operationId,actor);
 expect(result.state).toBe('PARTIAL');expect(result.results.find(row=>row.target==='glpi').status).toBe('conflict');expect(remote.glpi.values.name).toBe('Concorrente');
});
