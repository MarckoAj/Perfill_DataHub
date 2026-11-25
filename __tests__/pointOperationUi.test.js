import {jest} from '@jest/globals';
import vm from 'node:vm';import fs from 'node:fs';
let context,client;
beforeEach(()=>{
 client={clientId:12130,platformFields:{hub:{id:12130,name:'Original',latitude:0},auvo:{id:8561713,name:'Novo',latitude:0}},divergences:{enabled:true,platforms:{auvo:{items:[{fieldKey:'name',hubValue:'Original',sourceValue:'Novo'},{fieldKey:'latitude',hubValue:1,sourceValue:0},{fieldKey:'longitude',hubValue:2,sourceValue:null},{fieldKey:'id',hubValue:12130,sourceValue:8561713}]}}}};
 context=vm.createContext({console,window:{__currentPointModalClient:client},clientsMock:[],localStorage:{getItem:()=> 'token'},document:{getElementById:()=>null},confirm:jest.fn(()=>true),fetch:jest.fn(),setTimeout});
 vm.runInContext(fs.readFileSync(new URL('../public/js/new-point-model.js',import.meta.url),'utf8'),context);context.client=client;vm.runInContext('_renderBody=()=>{}',context);
});
test('visualização preserva campos sem inputs de operação e sem controles permanentes',()=>{
 const html=vm.runInContext("_field('Nome','Original',null,null,client,'name')",context);
 expect(html).not.toContain('<input');expect(vm.runInContext('renderPointOperationBar(client)+renderPointOperationFooter()',context)).toBe('');
});
test('edição local exclusiva do HUB preserva IDs, conta alterações e cancelar descarta',()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Alterado')",context);
 expect(vm.runInContext('pointChangedFields().length',context)).toBe(1);expect(client.platformFields.hub.name).toBe('Original');
 expect(vm.runInContext("_field('Nome','Original',null,null,client,'name')",context)).toContain('pm-operation-input');
 expect(vm.runInContext("_field('ID',12130,null,null,client,'id')",context)).not.toContain('<input');
 vm.runInContext('cancelPointOperation()',context);expect(vm.runInContext('pointOperation.mode',context)).toBe('view');expect(context.fetch).not.toHaveBeenCalled();
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('edit')",context);expect(vm.runInContext('pointOperation.mode',context)).toBe('view');
});
test('divergência ativa seleção elegível, rejeita nulos e IDs e preserva zero',()=>{
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('sync','name');flipPointSyncDirection()",context);
 expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name']);
 const html=vm.runInContext("_field('Nome','Novo',null,null,client,'name')",context);expect(html).toContain('pm-operation-selected');expect(html).toContain('HUB: Original');expect(html).toContain('checked');
 vm.runInContext('toggleAllPointFields()',context);expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name','latitude']);
 vm.runInContext("togglePointField('id');togglePointField('longitude')",context);expect(vm.runInContext('pointOperation.selected.size',context)).toBe(2);
 expect(vm.runInContext("_field('Longitude','N/A',null,null,client,'longitude')",context)).toContain('disabled');expect(context.fetch).not.toHaveBeenCalled();
});
test('troca de plataforma confirma descarte; prévia não aparece fora do piloto ou sem sessão',()=>{
 vm.runInContext("startPointOperation('edit')",context);context.confirm.mockReturnValue(false);vm.runInContext("changePlatformTab('auvo')",context);expect(vm.runInContext('currentPlatformTab',context)).toBe('hub');
 context.confirm.mockReturnValue(true);vm.runInContext("changePlatformTab('auvo')",context);expect(vm.runInContext('pointOperation.mode',context)).toBe('view');
 client.clientId=999;expect(vm.runInContext('renderPointOperationMenu(client)',context)).toBe('');client.clientId=12130;context.localStorage.getItem=()=>null;expect(vm.runInContext('renderPointOperationMenu(client)',context)).toContain('disabled');
});


test('inverter direção preserva seleções válidas, remove incompatíveis e atualiza rota',()=>{
 Object.assign(client.divergences.platforms.auvo.items.find(item=>item.fieldKey==='longitude'),{hubValue:null,sourceValue:3});
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('sync');flipPointSyncDirection();toggleAllPointFields()",context);
 expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name','latitude','longitude']);
 vm.runInContext('flipPointSyncDirection()',context);
 expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name','latitude']);
 expect(vm.runInContext('pointSyncEndpoints().origin',context)).toBe('hub');
 const html=vm.runInContext('renderPointOperationBar(client)',context);expect(html).toContain('Inverter origem e destino');expect(html).toContain('Todos divergentes');
 const field=vm.runInContext("_field('Nome','Novo',null,null,client,'name')",context);expect(field).toContain('Novo valor em AUVO: Original');
 expect(client.platformFields.auvo.name).toBe('Novo');expect(context.fetch).not.toHaveBeenCalled();
});
test('GLPI bloqueia tipo sem mapeamento e escrita de coordenadas da localização',()=>{
 client.platformFields.glpi={id:4412};client.divergences.platforms.glpi={items:[{fieldKey:'name',hubValue:'HUB',sourceValue:'GLPI'},{fieldKey:'latitude',hubValue:0,sourceValue:1},{fieldKey:'deviceType',hubValue:'TIPO II',sourceValue:'Câmera'}]};
 vm.runInContext("currentPlatformTab='glpi';startPointOperation('sync');flipPointSyncDirection();toggleAllPointFields()",context);
 expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name','latitude']);
 vm.runInContext('flipPointSyncDirection()',context);expect(Array.from(vm.runInContext('pointOperation.selected',context))).toEqual(['name']);
 expect(vm.runInContext("_field('Latitude',1,null,null,client,'latitude')",context)).toContain('Coordenadas pertencem à localização GLPI');
});
test('origem N/A, coordenada inválida, cadastro ausente e campos indisponíveis bloqueiam seleção',()=>{
 client.divergences.platforms.auvo.items=[{fieldKey:'name',hubValue:'Nome',sourceValue:' N/A '},{fieldKey:'latitude',hubValue:0,sourceValue:91}];
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('sync');flipPointSyncDirection()",context);expect(vm.runInContext('eligiblePointFields(client).length',context)).toBe(0);
 vm.runInContext('flipPointSyncDirection()',context);expect(Array.from(vm.runInContext('eligiblePointFields(client)',context))).toEqual(['name','latitude']);
 client.previewWriteFields={auvo:['name']};expect(Array.from(vm.runInContext('eligiblePointFields(client)',context))).toEqual(['name']);
 delete client.platformFields.auvo.id;expect(vm.runInContext('eligiblePointFields(client).length',context)).toBe(0);
});


test('HUB para plataforma selecionada é a direção inicial e após cancelar',()=>{
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('sync')",context);expect(vm.runInContext('pointSyncEndpoints().origin',context)).toBe('hub');expect(vm.runInContext('pointSyncEndpoints().target',context)).toBe('auvo');
 vm.runInContext("flipPointSyncDirection();cancelPointOperation();startPointOperation('sync')",context);expect(vm.runInContext('pointSyncEndpoints().origin',context)).toBe('hub');
});
test('edição sem destinos propõe somente campos modificados no HUB',()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Nome novo')",context);
 const proposals=vm.runInContext('pointEditProposal(client)',context);expect(proposals).toHaveLength(1);expect(proposals[0]).toMatchObject({target:'hub',fieldKey:'name',oldValue:'Original',newValue:'Nome novo',eligible:true});
 expect(vm.runInContext('renderPointPropagation(client)',context)).toContain('somente ao HUB');expect(client.platformFields.hub.name).toBe('Original');expect(context.fetch).not.toHaveBeenCalled();
});
test('múltiplos destinos recebem apenas propostas modificadas e compatíveis',()=>{
 client.platformFields.glpi={id:4412,name:'Original'};
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Novo nome');updatePointDraft('latitude','-11');setPointPropagation('auvo',true);setPointPropagation('glpi',true)",context);
 const proposals=vm.runInContext('pointEditProposal(client)',context);
 expect(proposals.filter(p=>p.target==='auvo'&&p.eligible).map(p=>p.fieldKey)).toEqual(['name','latitude']);
 expect(proposals.filter(p=>p.target==='glpi'&&p.eligible).map(p=>p.fieldKey)).toEqual(['name']);
 expect(proposals.find(p=>p.target==='auvo'&&p.fieldKey==='name').nativeField).toBe('description');
 expect(proposals.find(p=>p.target==='glpi'&&p.fieldKey==='latitude').eligible).toBe(false);
 expect(client.platformFields.auvo.name).toBe('Novo');expect(context.fetch).not.toHaveBeenCalled();
 vm.runInContext('cancelPointOperation()',context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(0);
});
test('bloqueia destinos sem vínculo e propagações inválidas; não oferece valores já iguais',()=>{
 vm.runInContext("startPointOperation('edit');setPointPropagation('glpi',true);updatePointDraft('name','Novo');setPointPropagation('auvo',true)",context);
 expect(vm.runInContext('pointOperation.destinations.has("glpi")',context)).toBe(false);
 expect(vm.runInContext('pointEditProposal(client).filter(p=>p.target==="auvo").length',context)).toBe(0);
 vm.runInContext("updatePointDraft('latitude','91')",context);expect(vm.runInContext('pointEditProposal(client).find(p=>p.fieldKey==="latitude"&&p.target==="hub").eligible',context)).toBe(false);
 expect(vm.runInContext('pointEditProposal(client).some(p=>p.target==="auvo")',context)).toBe(false);
});

test('formatação numérica equivalente não cria alteração nem propagação',()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('latitude','0.000')",context);
 expect(vm.runInContext('pointChangedFields().length',context)).toBe(0);expect(vm.runInContext('pointEditProposal(client).length',context)).toBe(0);
});


test('destino habilita apenas com alteração aplicável e desmarca ao desfazer',()=>{
 client.platformFields.glpi={id:4412,name:'Outro'};
 vm.runInContext("startPointOperation('edit');setPointPropagation('auvo',true)",context);
 expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(0);
 expect(vm.runInContext('pointPropagationContent(client)',context)).toContain('Nenhum campo compatível alterado');
 vm.runInContext("updatePointDraft('latitude','-11');setPointPropagation('auvo',true);setPointPropagation('glpi',true)",context);
 expect(Array.from(vm.runInContext('pointOperation.destinations',context))).toEqual(['auvo']);
 vm.runInContext("updatePointDraft('name','Editado');setPointPropagation('glpi',true)",context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(2);
 vm.runInContext("updatePointDraft('name','Original')",context);expect(Array.from(vm.runInContext('pointOperation.destinations',context))).toEqual(['auvo']);
 vm.runInContext("updatePointDraft('latitude','0')",context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(0);
});
test('valor igual ao destino, inválido ou campo sem mapeamento não habilita propagação',()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('city','OLINDINA')",context);
 expect(vm.runInContext('pointPropagationFields(client,"auvo").length',context)).toBe(0);
 vm.runInContext("updatePointDraft('name','Novo');setPointPropagation('auvo',true)",context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(0);
 vm.runInContext("updatePointDraft('latitude','-10');setPointPropagation('auvo',true)",context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(1);
 vm.runInContext("updatePointDraft('latitude','91')",context);expect(vm.runInContext('pointOperation.destinations.size',context)).toBe(0);expect(context.fetch).not.toHaveBeenCalled();
});


test('revisão de edição reúne alterações por destino e os valores atuais corretos',()=>{
 client.platformFields.glpi={id:4412,name:'Nome GLPI'};
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Novo nome');setPointPropagation('auvo',true);setPointPropagation('glpi',true)",context);
 const plan=vm.runInContext('pointReviewPlan(client)',context);expect(plan.items).toHaveLength(3);
 expect(plan.items.map(x=>[x.target,x.oldValue,x.newValue])).toEqual([['hub','Original','Novo nome'],['auvo','Novo','Novo nome'],['glpi','Nome GLPI','Novo nome']]);
 context.plan=plan;const html=vm.runInContext('renderPointReviewMarkup(plan)',context);
 expect(html).toContain('Valor atual');expect(html).toContain('Novo valor');expect(html).toContain('registrada no histórico de alterações');expect(html).toContain('disabled');
 expect(context.fetch).not.toHaveBeenCalled();expect(client.platformFields.hub.name).toBe('Original');
});
test('revisão da sincronização respeita origem e destino ao inverter',()=>{
 vm.runInContext("currentPlatformTab='auvo';startPointOperation('sync','name')",context);
 let plan=vm.runInContext('pointReviewPlan(client)',context);expect(plan.items[0]).toMatchObject({target:'auvo',oldValue:'Novo',newValue:'Original'});
 vm.runInContext('flipPointSyncDirection()',context);plan=vm.runInContext('pointReviewPlan(client)',context);expect(plan.items[0]).toMatchObject({target:'hub',oldValue:'Original',newValue:'Novo'});
});
test('não permite revisão sem alteração ou com campo HUB inválido; escapa valores',()=>{
 vm.runInContext("startPointOperation('edit')",context);expect(vm.runInContext('canReviewPointOperation(client)',context)).toBe(false);
 vm.runInContext("updatePointDraft('latitude','91')",context);expect(vm.runInContext('canReviewPointOperation(client)',context)).toBe(false);
 vm.runInContext("updatePointDraft('latitude','0');updatePointDraft('name','<img src=x>')",context);expect(vm.runInContext('canReviewPointOperation(client)',context)).toBe(true);
 const html=vm.runInContext('renderPointReviewMarkup(pointReviewPlan(client))',context);expect(html).toContain('&lt;img src=x&gt;');expect(html).not.toContain('<img src=x>');
});
test('cancelar revisão fecha diálogo, restaura foco e preserva rascunho e seleção',()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Rascunho');setPointPropagation('auvo',true)",context);
 let visible=null;const focus=jest.fn(),dialog={setAttribute:jest.fn(),addEventListener:jest.fn(),showModal:jest.fn(),close:jest.fn(),remove:jest.fn(()=>visible=null),querySelector:()=>({focus:jest.fn()})};
 context.document.activeElement={focus};context.document.createElement=jest.fn(()=>dialog);context.document.body={appendChild:jest.fn(node=>visible=node)};context.document.getElementById=id=>id==='pmPointOperationReview'?visible:null;
 vm.runInContext('openPointReview()',context);expect(dialog.showModal).toHaveBeenCalled();expect(dialog.innerHTML).toContain('Rascunho');
 vm.runInContext('closePointReview()',context);expect(dialog.close).toHaveBeenCalled();expect(focus).toHaveBeenCalled();expect(vm.runInContext('pointOperation.draft.name',context)).toBe('Rascunho');expect(vm.runInContext('pointOperation.destinations.has("auvo")',context)).toBe(true);expect(context.fetch).not.toHaveBeenCalled();
});

test('preparação no servidor não confirma automaticamente e utiliza a revisão retornada',async()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Novo nome')",context);
 const plan=vm.runInContext('pointReviewPlan(client)',context),nodes={'#pm-review-state':{},'#pm-review-confirm':{disabled:true}};
 const state={snapshot:plan,client,busy:false,prepared:null,dialog:{querySelector:selector=>nodes[selector]||{focus:()=>{}},innerHTML:''}};
 context.state=state;context.localStorage.getItem=key=>key==='hubOperationSession'?'a'.repeat(64):key==='authToken'?'token':null;
 context.fetch.mockResolvedValue({ok:true,json:async()=>({operationId:'review',plan:{items:plan.items}})});
 vm.runInContext('pointReviewBackend=state',context);await vm.runInContext('preparePointReview(state)',context);
 expect(context.fetch).toHaveBeenCalledTimes(1);expect(context.fetch.mock.calls[0][0]).toContain('/prepare');expect(context.fetch.mock.calls[0][0]).not.toContain('/confirm');expect(nodes['#pm-review-confirm'].disabled).toBe(false);expect(state.dialog.innerHTML).toContain('Novo nome');
});
test('falha de confirmação conserva operação pendente e evita dois envios simultâneos',async()=>{
 vm.runInContext("startPointOperation('edit');updatePointDraft('name','Novo nome')",context);
 const nodes={'#pm-review-state':{},'#pm-review-confirm':{},'button.pm-match-secondary':{}};
 const state={snapshot:vm.runInContext('pointReviewPlan(client)',context),prepared:{operationId:'review'},busy:false,dialog:{querySelector:selector=>nodes[selector],querySelectorAll:()=>Object.values(nodes)}};
 context.state=state;context.localStorage.setItem=jest.fn();context.localStorage.removeItem=jest.fn();
 context.fetch.mockRejectedValue(new Error('network'));
 vm.runInContext('pointReviewBackend=state',context);await Promise.all([vm.runInContext('executePointReview()',context),vm.runInContext('executePointReview()',context)]);
 expect(context.fetch).toHaveBeenCalledTimes(1);expect(context.fetch.mock.calls[0][0]).toContain('/confirm');expect(context.localStorage.setItem).toHaveBeenCalledWith('hubPendingPointOperation','review');expect(context.localStorage.removeItem).not.toHaveBeenCalled();expect(nodes['#pm-review-confirm'].textContent).toBe('Consultar resultado');
});

test('menu usa a identidade HUB exibida, mesmo com ID legado diferente, e orienta sessão ausente',()=>{
 client.hubId=12130;client.entityId=8561713;
 expect(vm.runInContext('renderPointOperationMenu(client)',context)).toContain('Editar informações');
 vm.runInContext("startPointOperation('edit')",context);expect(vm.runInContext('pointOperation.mode',context)).toBe('edit');expect(vm.runInContext('pointReviewPlan(client).entityId',context)).toBe(12130);
 context.localStorage.getItem=()=>null;
 const html=vm.runInContext('renderPointOperationMenu(client)',context);expect(html).toContain('Editar informações');expect(html).toContain('disabled');expect(html).toContain('Entre novamente');
 client.hubId=8438;client.entityId=12130;expect(vm.runInContext('renderPointOperationMenu(client)',context)).toBe('');
});
