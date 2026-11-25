import { buildPilotDivergences } from '../src/services/hubDivergenceService.js';
const compare=(hub,auvo={},glpi={},entityId=12130)=>buildPilotDivergences({entityId,platformFields:{hub,auvo,glpi},auvoCustomer:{lastSyncAt:'2026-11-25'},glpiDevice:{}});
test('compara nome normalizado e coordenadas numéricas sem falsos positivos',()=>{
 const r=compare({name:'06-014 Câmera',normalizedName:'06-014 Câmera',latitude:0,longitude:-38}, {name:'**Tag** 06-014 CAMERA',normalizedName:'06-014 CAMERA',latitude:'0.000',longitude:'-38,0'});
 expect(r.platforms.auvo.count).toBe(0);
});
test('alteração externa não muda o HUB; remoções e zero são comparáveis',()=>{
 const hub={name:'Original',latitude:0,address:'Rua A'};
 const r=compare(hub,{name:'Novo',latitude:null,address:'Rua B'});
 expect(hub.name).toBe('Original');
 expect(r.platforms.auvo.items.map(x=>[x.fieldKey,x.status])).toEqual([['name','different'],['latitude','missing_source'],['address','different']]);
 expect(r.platforms.auvo.lastSyncAt).toBe('2026-11-25');
});
test('ausência da plataforma não é divergência de campo; escopo exclusivo do piloto',()=>{
 const r=buildPilotDivergences({entityId:12130,platformFields:{hub:{name:'Ponto'}}});
 expect(r.platforms.glpi.available).toBe(false);expect(r.total).toBe(0);
 expect(compare({}, {}, {}, 999).enabled).toBe(false);
});
test('detecta alteração GLPI em dados complementares e não compara IDs entre plataformas',()=>{
 const r=compare({id:12130,name:'Ponto',model:'Antigo'},{id:8561713,name:'Ponto'},{id:4412,name:'Ponto',model:'Novo'});
 expect(r.platforms.glpi.items).toHaveLength(1);expect(r.platforms.glpi.items[0].fieldKey).toBe('model');
});
test('Tipo e CICOM não contam como divergências GLPI enquanto a relação está indefinida',()=>{
 const r=compare({deviceType:'TIPO II',cicom:'CICOM A'}, {}, {deviceType:'CAMERA FIXA',cicom:'CICOM B'});
 expect(r.platforms.glpi.count).toBe(0);
});
test('endereço GLPI usa campo próprio, separado da descrição de localização',()=>{
 const r=compare({address:'Rua A',locationName:'Local'}, {}, {address:'Rua B',locationName:'Local'});
 expect(r.platforms.glpi.items.map(i=>i.fieldKey)).toEqual(['address']);
});
