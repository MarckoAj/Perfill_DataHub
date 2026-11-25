import {jest} from '@jest/globals';
jest.unstable_mockModule('../src/integrations/auvo/auvoClient.js',()=>({default:{token:'fake',baseUrl:'https://auvo.invalid/v2',getAuthHeader:async()=>({Authorization:'Bearer fake'})}}));
const glpiRead=jest.fn();
jest.unstable_mockModule('../src/integrations/glpi/glpiClient.js',()=>({default:{dispatcher:undefined,glpiRequestData:glpiRead,getGlpiHeader:async()=>({'Session-Token':'fake'})}}));
jest.unstable_mockModule('../src/utils/glpiUrlBuilder.js',()=>({default:{glpiBaseUrl:()=> 'https://glpi.invalid/apirest.php'}}));
const {PointOperationAdapter}=await import('../src/integrations/pointOperationAdapter.js');
const adapter=new PointOperationAdapter();
afterEach(()=>jest.restoreAllMocks());
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
test('AUVO envia somente testes e substituições dos campos revisados, usando name no PATCH',async()=>{
 const request=jest.spyOn(globalThis,'fetch').mockResolvedValue(response({result:{id:8561713}}));
 await adapter.write('auvo','8561713',[{fieldKey:'name',oldValue:'Antes',newValue:'Depois'}]);
 const [url,options]=request.mock.calls[0];expect(url).toBe('https://auvo.invalid/v2/customers/8561713');expect(options.method).toBe('PATCH');expect(JSON.parse(options.body)).toEqual([{op:'test',path:'/name',value:'Antes'},{op:'replace',path:'/name',value:'Depois'}]);
});
test('GLPI envia apenas nome no dispositivo específico e exige confirmação por ID',async()=>{
 const request=jest.spyOn(globalThis,'fetch').mockResolvedValue(response([{'4412':true}]));
 await adapter.write('glpi','4412',[{fieldKey:'name',oldValue:'Antes',newValue:'Depois'}]);
 expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({input:{id:4412,name:'Depois'}});
 request.mockResolvedValue(response([{'4412':false}]));await expect(adapter.write('glpi','4412',[{fieldKey:'name',newValue:'Depois'}])).rejects.toThrow('não confirmou');
});
test('falhas HTTP e cadastro incompatível não produzem sucesso',async()=>{
 jest.spyOn(globalThis,'fetch').mockResolvedValueOnce(response({},403)).mockResolvedValueOnce(response({result:{id:99}}));
 await expect(adapter.read('auvo','8561713')).rejects.toThrow('HTTP 403');await expect(adapter.read('auvo','8561713')).rejects.toThrow('incompatível');
});

test('leitura GLPI utiliza renovação existente e coordenadas da localização correta',async()=>{
 const network=jest.spyOn(globalThis,'fetch').mockRejectedValue(new Error('nenhuma chamada de escrita permitida'));
 glpiRead.mockResolvedValueOnce({data:{id:4412,name:'Piloto',locations_id:55}}).mockResolvedValueOnce({data:{id:55,latitude:-11,longitude:-38}});
 const result=await adapter.read('glpi','4412',['latitude','longitude']);expect(result.values).toMatchObject({name:'Piloto',latitude:-11,longitude:-38,locationId:55});expect(network).not.toHaveBeenCalled();
});
test('endereço GLPI grava Location do piloto e não o Peripheral',async()=>{
 glpiRead.mockReset();
 glpiRead.mockResolvedValueOnce({data:{id:4412,name:'Piloto',locations_id:12341}})
 .mockResolvedValueOnce({data:{id:12341,address:null}})
 .mockResolvedValueOnce({data:[{id:4412}]});
 const request=jest.spyOn(globalThis,'fetch').mockResolvedValue(response([{'12341':true}]));
 await adapter.write('glpi','4412',[{fieldKey:'address',oldValue:null,newValue:'Rua A'}]);
 expect(request.mock.calls[0][0]).toBe('https://glpi.invalid/apirest.php/Location/12341');
 expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({input:{id:12341,address:'Rua A'}});
});
test('localização compartilhada bloqueia escrita do endereço',async()=>{
 glpiRead.mockReset();glpiRead.mockResolvedValueOnce({data:{id:4412,locations_id:12341}})
 .mockResolvedValueOnce({data:{id:12341,address:null}}).mockResolvedValueOnce({data:[{id:4412},{id:99}]});
 const request=jest.spyOn(globalThis,'fetch');
 await expect(adapter.write('glpi','4412',[{fieldKey:'address',oldValue:null,newValue:'Rua A'}])).rejects.toThrow('compartilhada');
 expect(request).not.toHaveBeenCalled();
});
test('consulta de nome não fornece endereço vazio artificial',async()=>{
 glpiRead.mockReset();glpiRead.mockResolvedValueOnce({data:{id:4412,name:'Piloto'}});
 const result=await adapter.read('glpi','4412',['name']);
 expect(result.values).not.toHaveProperty('address');
});
