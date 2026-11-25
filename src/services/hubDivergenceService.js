// Pilot comparisons use saved canonical values and the latest local source cache.
const fields = {
 name: 'Nome', latitude: 'Latitude', longitude: 'Longitude', address: 'Endereço',
 status: 'Status', deviceType: 'Tipo', manufacturer: 'Fabricante', model: 'Modelo',
 hardwareTechnician: 'Técnico encarregado', locationName: 'Localização', project: 'Projeto',
 updateSource: 'Fonte de atualização', cicom: 'CICOM'
};
const empty = value => value == null || String(value).trim() === '';
function comparable(key, value, record) {
 if (empty(value)) return null;
 if (key === 'latitude' || key === 'longitude') {
  const number = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(number) ? number : String(value).trim();
 }
 return String(key === 'name' ? record.normalizedName || value : value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase();
}
export function buildPilotDivergences({entityId, platformFields, auvoCustomer, glpiDevice}) {
 if (Number(entityId) !== 12130) return {enabled:false};
 const hub=platformFields.hub || {};
 const platforms={};
 for (const [platform, record, keys] of [
 ['auvo',auvoCustomer,['name','latitude','longitude','address']],
 ['glpi',glpiDevice,['name','latitude','longitude','address','status','manufacturer','model','hardwareTechnician','locationName','project','updateSource']]
 ]) {
  const source=platformFields[platform] || {};
  const items=[];
  if(record) for(const key of keys) {
   const left=comparable(key,hub[key],hub), right=comparable(key,source[key],source);
   if(left===right) continue;
   items.push({fieldKey:key,label:fields[key],hubValue:hub[key] ?? null,sourceValue:source[key] ?? null,
    status:left===null ? 'missing_hub' : right===null ? 'missing_source' : 'different'});
  }
  platforms[platform]={available:!!record,lastSyncAt:record?.lastSyncAt || null,count:items.length,items};
 }
 return {enabled:true,entityId:12130,platforms,total:Object.values(platforms).reduce((sum,p)=>sum+p.count,0)};
}
