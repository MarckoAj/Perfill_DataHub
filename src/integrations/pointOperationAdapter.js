import auvo from './auvo/auvoClient.js';
import glpi from './glpi/glpiClient.js';
import urls from '../utils/glpiUrlBuilder.js';
const fail=message=>Object.assign(new Error(message),{status:502});
async function jsonRequest(url,options) {
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(30000),redirect:'error'});
 const body=await response.json().catch(()=>null);
 if(!response.ok)throw fail('Plataforma respondeu HTTP '+response.status+'.');
 return {body,status:response.status};
}
export class PointOperationAdapter {
 async request(target,id,method,body) {
  if(target==='auvo') {
   const headers=await auvo.getAuthHeader();if(!auvo.token)throw fail('Autenticação AUVO indisponível.');
   return jsonRequest(auvo.baseUrl+'/customers/'+id,{method,headers:{...headers,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  }
  return jsonRequest(urls.glpiBaseUrl()+'/Peripheral/'+id,{method,dispatcher:glpi.dispatcher,headers:await glpi.getGlpiHeader(),...(body?{body:JSON.stringify(body)}:{})});
 }
 async read(target,id,keys=[]) {
  const body=target==='auvo'?(await this.request(target,id,'GET')).body:(await glpi.glpiRequestData('Peripheral','GET',undefined,Number(id),{suppressErrorLog:true}))?.data;
  const raw=target==='auvo'?body?.result:body;
  if(!raw||Number(raw.id)!==Number(id))throw fail('Cadastro de destino não encontrado ou incompatível.');
  if(target==='auvo')return {values:{address:raw.address??null,name:raw.description??raw.name??null,latitude:raw.latitude==null||raw.latitude===''?null:Number(raw.latitude),longitude:raw.longitude==null||raw.longitude===''?null:Number(raw.longitude)},version:String(raw.lastUpdate??raw.dateLastUpdate??'')};
  const values={name:raw.name??null};let locationId=null;
  if(keys.some(key=>['latitude','longitude','address'].includes(key))) {
   locationId=Number(raw.locations_id)||null;values.locationId=locationId;values.address=null;
   if(locationId){const location=(await glpi.glpiRequestData('Location','GET',undefined,locationId,{suppressErrorLog:true}))?.data;if(!location||Number(location.id)!==locationId)throw fail('Localização GLPI indisponível.');values.address=location.address??null;values.latitude=location?.latitude==null||location.latitude===''?null:Number(location.latitude);values.longitude=location?.longitude==null||location.longitude===''?null:Number(location.longitude);}
  }
  return {values,version:String(raw.date_mod??''),locationId};
 }
 async write(target,id,items) {
  if(target==='auvo') {
   const field=key=>({name:'name',latitude:'latitude',longitude:'longitude',address:'address'})[key];
   const operations=[...items.map(item=>({op:'test',path:'/'+field(item.fieldKey),value:item.oldValue})),...items.map(item=>({op:'replace',path:'/'+field(item.fieldKey),value:item.newValue}))];
   await this.request(target,id,'PATCH',operations);return;
  }
  if(items.some(item=>!['name','address'].includes(item.fieldKey)))throw fail('Campos GLPI incompatíveis.');
  const address = items.find(item=>item.fieldKey==='address');
  if(address) {
   const current=await this.read('glpi',id,['address']);
   if(Number(id)!==4412 || current.locationId!==12341)throw fail('Localização fora do piloto autorizado.');
   if((current.values.address??'')!==(address.oldValue??''))throw fail('Endereço GLPI mudou antes da escrita.');
   const related=await glpi.glpiRequestData('Location/12341/Peripheral');
   if(!Array.isArray(related?.data)||related.data.length!==1||Number(related.data[0].id)!==4412)throw fail('Localização compartilhada ou vínculo não confirmado.');
   const result=await jsonRequest(urls.glpiBaseUrl()+'/Location/12341',{
    method:'PUT',dispatcher:glpi.dispatcher,headers:await glpi.getGlpiHeader(),
    body:JSON.stringify({input:{id:12341,address:address.newValue}})
   });
   if(!Array.isArray(result.body)||!result.body.some(row=>row['12341']===true))throw fail('GLPI não confirmou a atualização da localização.');
  }
  const name=items.find(item=>item.fieldKey==='name')?.newValue;
  if(name) {
   const {body}=await this.request(target,id,'PUT',{input:{id:Number(id),name}});
   if(!Array.isArray(body)||!body.some(row=>row[String(id)]===true))throw fail('GLPI não confirmou a atualização do dispositivo.');
  }
 }
}
export default new PointOperationAdapter();
