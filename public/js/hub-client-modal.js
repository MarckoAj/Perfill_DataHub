function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function mapHubEntityToModalClient(entity) {
    const name = entity.name || `Entidade HUB ${entity.entityId}`;

    return {
        hubId: entity.entityId,
        clientId: entity.entityId,
        ticketId: entity.sourceRecordId || '',
        pointId: name,
        assetName: name,
        address: name,
        type: entity.entityType || 'HUB',
        cicom: entity.sourceSystem || 'HUB',
        city: 'N/A',
        unit: entity.sourceSystem || 'HUB',
        region: entity.sourceEntity || 'Fonte externa',
        latitude: entity.latitude,
        longitude: entity.longitude,
        state: 'BA',
        network: {
            ip: 'N/A',
            gateway: 'N/A',
            subnet: 'N/A',
            wanIp: 'N/A',
            circuit: 'N/A',
            linkStatus: 'N/A',
            uptime: 'N/A',
            availabilityDate: 'N/A'
        },
        pointStatus: {
            currentStatus: 'N/A',
            originatedFrom: 'N/A',
            changedTo: 'N/A',
            relatedEntityId: null,
            inspectionDate: 'N/A',
            cameraInstallation: 'N/A',
            cameraSubstitution: 'N/A',
            uninstallDate: 'N/A',
            remanejadoDate: 'N/A',
            dedicatedPole: 'N/A',
            installationDate: 'N/A',
            boxType: 'N/A',
            boxInstallation: 'N/A',
            boxInstallationDate: 'N/A',
            armInstallation: 'N/A',
            poleStatus: 'N/A'
        },
        operationalTags: entity.operationalTags || [],
        operationalHistory: [],
        attendances: []
    };
}

function formatDateTime(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('pt-BR');
}

function inferCityFromAddress(address) {
    const text = String(address || '').trim();
    const match = text.match(/,\s*([^,-]+)\s*-\s*BA\b/i);
    return match ? match[1].trim() : 'N/A';
}

function mapTaskStatus(task) {
    if (task.finished) return 'done';
    if (String(task.statusDescription || '').toLowerCase().includes('desloc')) return 'moving';
    return 'warning';
}

function mapHubEntityDetailsToModalClient(details, fallbackClient) {
    const auvoCustomer = details.sources?.auvo?.customer || null;
    const auvoTasks = details.sources?.auvo?.recentTasks || [];
    const physicalStatus = details.physicalStatus || {};
    const physicalSummary = details.sources?.auvo?.physicalStatusSummary || physicalStatus.summary || {};
    const physicalHistory = details.sources?.auvo?.physicalStatusHistory || physicalStatus.history || [];
    const lineageLink = physicalStatus.lineageLink || {};
    const glpiTickets = details.sources?.glpi?.tickets || [];
    const glpiDevice = details.sources?.glpi?.device || null;
    const name = details.normalizedDisplayName || details.displayName || auvoCustomer?.description || fallbackClient?.assetName || `HUB ${details.entityId}`;
    const address = auvoCustomer?.address || fallbackClient?.address || name;
    const city = details.platformFields?.hub?.city || 'N/A';
    const locationId = glpiTickets.find(ticket => ticket.idLocalizacaoPonto)?.idLocalizacaoPonto || null;

    return {
        ...(fallbackClient || {}),
        hubId: details.entityId,
        entityId: details.entityId,
        clientId: details.entityId,
        ticketId: glpiTickets[0]?.ticketId || fallbackClient?.ticketId || '',
        pointId: details.deviceCode || name,
        assetName: name,
        address,
        type: 'Dispositivo',
        cicom: details.platformFields?.hub?.cicom || 'N/A',
        city,
        unit: locationId ? `GLPI Localizacao ${locationId}` : (fallbackClient?.unit || 'N/A'),
        region: auvoCustomer?.segmentName || glpiTickets[0]?.projeto || fallbackClient?.region || 'N/A',
        latitude: auvoCustomer?.latitude ?? fallbackClient?.latitude ?? null,
        longitude: auvoCustomer?.longitude ?? fallbackClient?.longitude ?? null,
        state: 'BA',
        platformLinks: {
            hub: {
                entityId: details.entityId,
                canonicalKey: details.canonicalKey,
                deviceCode: details.deviceCode
            },
            auvo: auvoCustomer ? {
                customerId: auvoCustomer.customerId,
                description: auvoCustomer.description,
                lastSyncAt: auvoCustomer.lastSyncAt
            } : null,
            glpi: {
                deviceId: glpiDevice?.deviceId || null,
                locationId,
                tickets: glpiTickets.map(ticket => ticket.ticketId)
            }
        },
        sources: details.sources || {},
        fieldValues: details.fieldValues || [],
        platformFields: details.platformFields || {},
        divergences: details.divergences || null,
        fieldRelations: details.fieldRelations || {},
        operationalTags: details.operationalTags || [],
        operationalTagDefinitions: details.operationalTagDefinitions || [],
        normalizedDisplayName: details.normalizedDisplayName || name,
        syncHistory: details.syncHistory || [],
        network: fallbackClient?.network || {
            ip: 'N/A',
            gateway: 'N/A',
            subnet: 'N/A',
            wanIp: 'N/A',
            circuit: 'N/A',
            linkStatus: 'N/A',
            uptime: 'N/A',
            availabilityDate: 'N/A'
        },
        pointStatus: {
            ...(fallbackClient?.pointStatus || {}),
            currentStatus: physicalSummary.currentStatus || fallbackClient?.pointStatus?.currentStatus || 'N/A',
            originatedFrom: lineageLink.relationType === 'originated_from'
                ? (lineageLink.fromName || `AUVO ${lineageLink.fromCustomerId}`)
                : fallbackClient?.pointStatus?.originatedFrom || 'N/A',
            changedTo: lineageLink.relationType === 'changed_to'
                ? (lineageLink.toName || `AUVO ${lineageLink.toCustomerId}`)
                : fallbackClient?.pointStatus?.changedTo || 'N/A',
            relatedEntityId: lineageLink.fromEntityId || lineageLink.toEntityId || null,
            inspectionDate: formatDateTime(physicalSummary.inspectionDate) || fallbackClient?.pointStatus?.inspectionDate || 'N/A',
            cameraInstallation: formatDateTime(physicalSummary.cameraInstallation) || fallbackClient?.pointStatus?.cameraInstallation || 'N/A',
            cameraSubstitution: formatDateTime(physicalSummary.cameraSubstitution) || fallbackClient?.pointStatus?.cameraSubstitution || 'N/A',
            uninstallDate: formatDateTime(physicalSummary.uninstallDate) || fallbackClient?.pointStatus?.uninstallDate || 'N/A',
            remanejadoDate: formatDateTime(physicalSummary.remanejadoDate) || fallbackClient?.pointStatus?.remanejadoDate || 'N/A',
            dedicatedPole: fallbackClient?.pointStatus?.dedicatedPole || 'N/A',
            installationDate: formatDateTime(physicalSummary.cameraInstallation) || fallbackClient?.pointStatus?.installationDate || 'N/A',
            boxType: fallbackClient?.pointStatus?.boxType || 'N/A',
            boxInstallation: formatDateTime(physicalHistory.find(item => item.to === 'CAIXA INSTALADA')?.date) || fallbackClient?.pointStatus?.boxInstallation || 'N/A',
            boxInstallationDate: formatDateTime(physicalHistory.find(item => item.to === 'CAIXA INSTALADA')?.date) || fallbackClient?.pointStatus?.boxInstallationDate || 'N/A',
            armInstallation: formatDateTime(physicalHistory.find(item => item.to === 'BRACO INSTALADO')?.date) || fallbackClient?.pointStatus?.armInstallation || 'N/A',
            poleStatus: physicalSummary.currentStatus || fallbackClient?.pointStatus?.poleStatus || 'N/A'
        },
        physicalStatus,
        operationalHistory: physicalHistory.length > 0 ? physicalHistory : (fallbackClient?.operationalHistory || []),
        glpiTickets,
        attendances: auvoTasks.map(task => ({
            taskId: task.taskId,
            status: mapTaskStatus(task),
            title: task.taskType || `Tarefa AUVO ${task.taskId}`,
            technician: 'AUVO',
            date: formatDateTime(task.dateLastUpdate || task.taskDate || task.taskCreationDate),
            taskUrl: task.taskUrl
        }))
    };
}

async function fetchHubEntityDetails(entityId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/hub/entities/${entityId}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    return payload.data;
}


let hubClientLookupVersion = 0;
async function openHubClientByName(name) {
 const version = ++hubClientLookupVersion;
 let dialog = document.getElementById('hubClientPicker');
 if (!dialog) { dialog=document.createElement('dialog');dialog.id='hubClientPicker';dialog.className='hub-client-picker';document.body.append(dialog); }
 dialog.innerHTML='<h2>Cliente / ponto</h2><p role="status">Buscando cadastro…</p><button type="button">Fechar</button>';
 dialog.querySelector('button').onclick=()=>{hubClientLookupVersion++;dialog.close();};
 if(!dialog.open)dialog.showModal();
 const status=dialog.querySelector('p');
 try {
  const search=String(name||'').trim();
  if(!search || search==='Não Atribuído')throw Error('Este registro não informa um cliente.');
  const code=search.match(/(?:^|[^0-9])(\d{2}-\d{3})(?=[^0-9]|$)/)?.[1];
  const params=new URLSearchParams({search:code||search,excludeTags:'',refresh:'false',limit:'100'});
  const response=await fetch('/api/hub/entities?'+params,{headers:{authorization:'Bearer '+localStorage.getItem('authToken')}});
  if(!response.ok)throw Error('Não foi possível consultar os clientes.');
  const payload=await response.json();
  if(version!==hubClientLookupVersion||!dialog.open)return;
  const items=payload.data||[];
  status.textContent=items.length ? 'Selecione o cadastro para abrir sua ficha:' : 'Nenhum cadastro HUB encontrado para este nome. Consulte a lista de Clientes.';
  for(const entity of items){const button=document.createElement('button');button.textContent=entity.name+' — HUB-'+String(entity.entityId).padStart(6,'0');
   button.onclick=async()=>{button.disabled=true;try{const details=await fetchHubEntityDetails(entity.entityId);if(version!==hubClientLookupVersion||!dialog.open)return;dialog.close();openPointModal(mapHubEntityDetailsToModalClient(details,mapHubEntityToModalClient(entity)));}catch(error){status.textContent='Não foi possível abrir a ficha. Tente novamente.';button.disabled=false;}};
   dialog.append(button);
  }
  if(items.length===1)dialog.lastElementChild.click();
 }catch(error){if(version===hubClientLookupVersion)status.textContent=error.message;}
}
