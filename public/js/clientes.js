let projects = [
    {
        name: 'PI-NOVO',
        description: 'Projeto Integrado de Segurança Pública - Nova Infraestrutura',
        total: 182,
        alerts: 12,
        critical: 4,
        tickets: 9
    },
    {
        name: 'LEGADO',
        description: 'Pontos e Câmeras da Primeira Geração Operacional',
        total: 96,
        alerts: 8,
        critical: 2,
        tickets: 5
    },
    {
        name: 'CFTV',
        description: 'Circuito Fechado de Monitoramento de Prédios Públicos',
        total: 74,
        alerts: 6,
        critical: 1,
        tickets: 3
    }
];

let assets = [
    {
        clientId: 1,
        project: 'PI-NOVO',
        point: 'RP 01 - CAJAZEIRAS',
        city: 'Cajazeiras',
        unit: '22º CIPM',
        responsible: 'Adriano Santos'
    },
    {
        clientId: 1,
        project: 'PI-NOVO',
        point: 'RP 02 - ENTRADA DA CIDADE',
        city: 'Simões Filho',
        unit: '22º CIPM',
        responsible: 'Tiago Almeida'
    },
    {
        clientId: 1,
        project: 'PI-NOVO',
        point: 'RP 03 - POSTO FISCAL',
        city: 'Feira de Santana',
        unit: '66º CIPM',
        responsible: 'Marcos Lima'
    },
    {
        clientId: 1,
        project: 'PI-NOVO',
        point: 'RP 04 - VIADUTO',
        city: 'Salvador',
        unit: '1º CIPM',
        responsible: 'José Carlos'
    },
    {
        clientId: 1,
        project: 'LEGADO',
        point: 'RP 05 - ATACADÃO',
        city: 'Lauro de Freitas',
        unit: '52º CIPM',
        responsible: 'Fernanda Costa'
    },
    {
        clientId: 1,
        project: 'LEGADO',
        point: 'RP 06 - ENTRADA NORTE',
        city: 'Alagoinhas',
        unit: '4º CIPM',
        responsible: 'Carlos Eduardo'
    },
    {
        clientId: 1,
        project: 'CFTV',
        point: 'RP 07 - CAMPO DO GADO',
        city: 'Serrinha',
        unit: '16º CIPM',
        responsible: 'Rafael Nunes'
    },
    {
        clientId: 1,
        project: 'CFTV',
        point: 'RP 08 - PRAÇA CENTRAL',
        city: 'Jacaraci',
        unit: '94º CIPM',
        responsible: 'Luiz Henrique'
    }
];

window.hubClients = [];
const HUB_PAGE_LIMIT = 100;
let hubPagination = {
    isHub: false,
    isLoading: false,
    currentPage: 1,
    limit: HUB_PAGE_LIMIT,
    offset: 0,
    total: assets.length,
    totalPages: 1,
    hasMore: false
};
let hubSearchText = '';
let hubSearchTimer = null;
let hubOperationalTags = [];
let hubTagFilters = {
    include: new Set(),
    exclude: new Set()
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadHubEntities(page = 1, searchText = hubSearchText) {
    try {
        hubPagination.isLoading = true;
        renderPaginationControls();

        const token = localStorage.getItem('authToken');
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (safePage - 1) * HUB_PAGE_LIMIT;
        const params = new URLSearchParams({
            limit: String(HUB_PAGE_LIMIT),
            offset: String(offset)
        });
        const normalizedSearch = String(searchText || '').trim();
        if (normalizedSearch) params.set('search', normalizedSearch);
        if (hubTagFilters.include.size > 0) {
            params.set('includeTags', Array.from(hubTagFilters.include).join(','));
        }
        params.set('excludeTags', Array.from(hubTagFilters.exclude).join(','));

        const response = await fetch(`/api/hub/entities?${params.toString()}`, {
            headers: token ? { authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        const entities = Array.isArray(payload.data) ? payload.data : [];
        const pagination = payload.meta?.pagination || {};

        const total = Number(pagination.total) || entities.length;
        const limit = Number(pagination.limit) || HUB_PAGE_LIMIT;
        const currentOffset = Number(pagination.offset) || offset;

        projects = [{
            name: 'HUB',
            description: 'Entidades canônicas sincronizadas a partir das fontes externas',
            total,
            alerts: 0,
            critical: 0,
            tickets: 0
        }];

        hubPagination = {
            isHub: true,
            isLoading: false,
            currentPage: Math.floor(currentOffset / limit) + 1,
            limit,
            offset: currentOffset,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasMore: Boolean(pagination.hasMore),
            search: normalizedSearch
        };

        window.hubClients = entities.map(mapHubEntityToModalClient);
        assets = entities.map((entity, index) => ({
            clientId: entity.entityId,
            modalIndex: index,
            project: 'HUB',
            point: entity.name || `Entidade HUB ${entity.entityId}`,
            city: entity.latitude ?? 'N/A',
            unit: entity.longitude ?? 'N/A',
            responsible: entity.sourceSystem || 'HUB',
            operationalTags: entity.operationalTags || []
        }));
    } catch (error) {
        hubPagination = {
            isHub: false,
            isLoading: false,
            currentPage: 1,
            limit: assets.length || HUB_PAGE_LIMIT,
            offset: 0,
            total: assets.length,
            totalPages: 1,
            hasMore: false
        };
        console.warn('[Clientes] Usando dados mockados. Falha ao carregar /api/hub/entities:', error.message);
    }
}

async function loadHubOperationalTags() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/hub/tags', {
            headers: token ? { authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        hubOperationalTags = Array.isArray(payload.data) ? payload.data : [];
        hubTagFilters.exclude = new Set(
            hubOperationalTags
                .filter(tag => tag.hideByDefault)
                .map(tag => tag.normalizedLabel || tag.label)
                .filter(Boolean)
        );
        renderHubTagFilters();
    } catch (error) {
        console.warn('[Clientes] Falha ao carregar tags operacionais:', error.message);
        hubOperationalTags = [];
        renderHubTagFilters();
    }
}

function renderHubTagFilters() {
    const container = document.getElementById('hubTagFilters');
    if (!container) return;

    if (hubOperationalTags.length === 0) {
        container.innerHTML = '<div class="tag-filter-empty">Nenhuma tag cadastrada</div>';
        return;
    }

    const renderGroup = (title, type) => `
      <div class="tag-filter-group">
        <span>${title}</span>
        <div class="tag-filter-options">
          ${hubOperationalTags.map(tag => {
            const normalized = tag.normalizedLabel || tag.label;
            const checked = hubTagFilters[type].has(normalized) ? 'checked' : '';
            return `
              <label class="tag-filter-option">
                <input type="checkbox" data-tag-filter="${type}" value="${escapeHtml(normalized)}" ${checked}>
                ${escapeHtml(tag.label)}
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = renderGroup('Incluir tags', 'include') + renderGroup('Ocultar tags', 'exclude');
    container.querySelectorAll('input[data-tag-filter]').forEach(input => {
        input.addEventListener('change', handleHubTagFilterChange);
    });
}

function handleHubTagFilterChange(event) {
    const type = event.target.dataset.tagFilter;
    const value = event.target.value;
    if (!hubTagFilters[type]) return;

    if (event.target.checked) hubTagFilters[type].add(value);
    else hubTagFilters[type].delete(value);

    runHubSearch(hubSearchText).catch(error => {
        console.warn('[Clientes] Falha ao aplicar filtro de tags:', error.message);
    });
}

function renderOperationalTagChips(tags = []) {
    if (!Array.isArray(tags) || tags.length === 0) return '<span class="hub-tag-chip empty">Sem tags</span>';

    return tags
        .map(tag => `<span class="hub-tag-chip">${escapeHtml(tag.label || tag.normalizedLabel || tag)}</span>`)
        .join('');
}

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
    const city = inferCityFromAddress(address);
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
        cicom: glpiTickets[0]?.projeto || fallbackClient?.cicom || 'HUB',
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

async function openAssetModal(modalIndex, fallbackClientId = 1) {
    if (Number.isInteger(modalIndex) && window.hubClients[modalIndex]) {
        const fallbackClient = window.hubClients[modalIndex];
        openPointModal(fallbackClient);

        try {
            const details = await fetchHubEntityDetails(fallbackClient.hubId || fallbackClient.entityId || fallbackClient.clientId);
            const detailedClient = mapHubEntityDetailsToModalClient(details, fallbackClient);
            window.hubClients[modalIndex] = detailedClient;
            openPointModal(detailedClient);
        } catch (error) {
            console.warn('[Clientes] Falha ao carregar detalhes HUB do modal:', error.message);
        }
        return;
    }

    openPointModal(fallbackClientId);
}

function renderPaginationControls(visibleCount = assets.length) {
    const containers = document.querySelectorAll('[data-pagination]');
    if (!containers.length) return;

    const page = hubPagination.currentPage || 1;
    const totalPages = hubPagination.totalPages || 1;
    const total = hubPagination.total || visibleCount;
    const from = total === 0 ? 0 : hubPagination.offset + 1;
    const to = hubPagination.isHub
        ? Math.min(hubPagination.offset + visibleCount, total)
        : visibleCount;
    const disabled = hubPagination.isLoading || !hubPagination.isHub;
    const prevDisabled = disabled || page <= 1;
    const nextDisabled = disabled || page >= totalPages;
    const summary = hubPagination.isLoading
        ? 'Carregando pagina...'
        : `${hubPagination.search ? `Busca "${escapeHtml(hubPagination.search)}" - ` : ''}Pagina ${page} de ${totalPages} - ${from}-${to} de ${total} itens`;

    const html = `
      <div class="hub-pagination-info">${summary}</div>
      <div class="hub-pagination-actions">
        <button class="hub-page-btn" type="button" onclick="goToHubPage(1)" ${prevDisabled ? 'disabled' : ''} title="Primeira pagina">&laquo;</button>
        <button class="hub-page-btn" type="button" onclick="goToHubPage(${page - 1})" ${prevDisabled ? 'disabled' : ''} title="Pagina anterior">&lsaquo;</button>
        <button class="hub-page-btn" type="button" onclick="goToHubPage(${page + 1})" ${nextDisabled ? 'disabled' : ''} title="Proxima pagina">&rsaquo;</button>
        <button class="hub-page-btn" type="button" onclick="goToHubPage(${totalPages})" ${nextDisabled ? 'disabled' : ''} title="Ultima pagina">&raquo;</button>
      </div>
    `;

    containers.forEach(container => {
        container.innerHTML = html;
    });
}

async function goToHubPage(page) {
    if (!hubPagination.isHub || hubPagination.isLoading) return;

    const targetPage = Math.min(Math.max(parseInt(page, 10) || 1, 1), hubPagination.totalPages || 1);
    if (targetPage === hubPagination.currentPage) return;

    await loadHubEntities(targetPage, hubSearchText);
    renderProjects(document.getElementById('projectSearch')?.value || '');
    selectProject(0);
    scrollClientesToTop();
}

function scrollClientesToTop() {
    const target = document.querySelector('.content-area') || document.querySelector('.page-wrapper');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Estado atual da aplicação no frontend
let selectedProjectIndex = 0;
let activeTab = 'visao-geral';

// Inicializar e registrar os escutadores de eventos
document.addEventListener('DOMContentLoaded', async () => {
    await loadHubOperationalTags();
    await loadHubEntities();
    renderProjects();
    selectProject(0);
    setupFilters();
    setupTabs();
    setupProjectSearch();
});

// Renderizar a lista de projetos na sidebar
function renderProjects(filterText = '') {
    const container = document.getElementById('projectsList');
    if (!container) return;

    const filtered = projects.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

    container.innerHTML = filtered
        .map((project, index) => {
            const originalIndex = projects.findIndex(p => p.name === project.name);
            const isActive = originalIndex === selectedProjectIndex;
            return `
              <div class="project-card ${isActive ? 'active' : ''}" onclick="selectProject(${originalIndex})">
                <div class="project-card-top">
                  <h3>${project.name}</h3>
                  <div class="project-total">${project.total}</div>
                </div>
                <div class="project-metrics">
                  <div class="metric-small">
                    <strong style="color: var(--danger);">${project.alerts}</strong>
                    <span>alertas</span>
                  </div>
                  <div class="metric-small">
                    <strong style="color: var(--warning);">${project.critical}</strong>
                    <span>críticos</span>
                  </div>
                  <div class="metric-small">
                    <strong style="color: var(--text-primary);">${project.tickets}</strong>
                    <span>tickets</span>
                  </div>
                </div>
              </div>
            `;
        })
        .join('');
}

// Selecionar um projeto e carregar seus ativos e métricas correspondentes
function selectProject(index) {
    selectedProjectIndex = index;
    const project = projects[index];
    if (!project) return;

    // Atualizar classe ativa na lista
    renderProjects(document.getElementById('projectSearch')?.value || '');

    // Atualizar Cabeçalho Principal do Conteúdo
    const pName = document.getElementById('projectName');
    const pDesc = pName?.nextElementSibling;
    if (pName) pName.textContent = project.name;
    if (pDesc) pDesc.textContent = project.description;

    // Atualizar Cards de Métricas
    const metricTotal = document.getElementById('metricTotal');
    const metricAlerts = document.getElementById('metricAlerts');
    const metricCritical = document.getElementById('metricCritical');
    const metricTickets = document.getElementById('metricTickets');

    if (metricTotal) metricTotal.textContent = project.total;
    if (metricAlerts) metricAlerts.textContent = project.alerts;
    if (metricCritical) metricCritical.textContent = project.critical;
    if (metricTickets) metricTickets.textContent = project.tickets;

    // Repopular e Resetar Filtros
    populateFilterOptions();
    applyFilters();
}

// Preencher os selects de filtros de forma dinâmica baseados apenas nos ativos do projeto selecionado
function populateFilterOptions() {
    const project = projects[selectedProjectIndex];
    const projectAssets = assets.filter(a => a.project === project.name);

    const filterCity = document.getElementById('filterCity');
    const filterUnit = document.getElementById('filterUnit');

    if (filterCity) {
        const cities = [...new Set(projectAssets.map(a => a.city))].sort();
        filterCity.innerHTML = '<option value="">Latitude: Todas</option>' + 
            cities.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    if (filterUnit) {
        const units = [...new Set(projectAssets.map(a => a.unit))].sort();
        filterUnit.innerHTML = '<option value="">Longitude: Todas</option>' + 
            units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
    }
}

// Obter classe CSS de status
function getStatusClass(value) {
    const normalized = value.toLowerCase();
    if (normalized.includes('offline') || normalized.includes('down')) {
        return 'status-offline';
    }
    if (normalized.includes('atenção')) {
        return 'status-warning';
    }
    return 'status-online';
}

// Aplicar filtros e renderizar ativos correspondentes na tabela
function applyFilters() {
    const project = projects[selectedProjectIndex];
    
    // Obter valores dos filtros
    const searchText = document.getElementById('searchAsset')?.value.toLowerCase() || '';
    const cityVal = document.getElementById('filterCity')?.value || '';
    const unitVal = document.getElementById('filterUnit')?.value || '';

    // Filtrar ativos do projeto selecionado
    let filtered = assets.filter(a => a.project === project.name);

    if (searchText) {
        filtered = filtered.filter(a => 
            String(a.point).toLowerCase().includes(searchText) ||
            String(a.city).toLowerCase().includes(searchText) ||
            String(a.unit).toLowerCase().includes(searchText) ||
            String(a.responsible).toLowerCase().includes(searchText)
        );
    }

    if (cityVal) {
        filtered = filtered.filter(a => a.city === cityVal);
    }

    if (unitVal) {
        filtered = filtered.filter(a => a.unit === unitVal);
    }

    // Renderizar tabela
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody) return;
    renderPaginationControls(filtered.length);

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">
                    Nenhum ativo localizado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered
        .map(asset => `
          <tr style="cursor: pointer;" onclick="openAssetModal(${Number.isInteger(asset.modalIndex) ? asset.modalIndex : 'null'}, ${asset.clientId || 1})">
            <td style="font-weight: 600; text-align: left; padding-left: 24px;">${escapeHtml(asset.point)}</td>
            <td style="text-align: center;">${escapeHtml(asset.city)}</td>
            <td style="text-align: center;">${escapeHtml(asset.unit)}</td>
            <td style="text-align: center;"><div class="hub-tag-chip-list">${renderOperationalTagChips(asset.operationalTags)}</div></td>
            <td style="text-align: center; padding-right: 24px;">${escapeHtml(asset.responsible)}</td>
          </tr>
        `)
        .join('');
}

async function runHubSearch(searchText) {
    if (hubPagination.isLoading) return;

    hubSearchText = String(searchText || '').trim();
    await loadHubEntities(1, hubSearchText);
    renderProjects(document.getElementById('projectSearch')?.value || '');
    selectProject(0);
}

function scheduleHubSearch(searchText) {
    clearTimeout(hubSearchTimer);
    hubSearchTimer = setTimeout(() => {
        runHubSearch(searchText).catch(error => {
            console.warn('[Clientes] Falha ao buscar entidades HUB:', error.message);
        });
    }, 300);
}

// Configurar escutadores para os filtros
function setupFilters() {
    const searchAsset = document.getElementById('searchAsset');
    const filterCity = document.getElementById('filterCity');
    const filterUnit = document.getElementById('filterUnit');

    searchAsset?.addEventListener('input', (event) => {
        if (hubPagination.isHub) {
            scheduleHubSearch(event.target.value);
            return;
        }

        applyFilters();
    });
    filterCity?.addEventListener('change', applyFilters);
    filterUnit?.addEventListener('change', applyFilters);
}

// Configurar navegação entre abas (comportamento de SPA premium)
function setupTabs() {
    const tabsList = document.querySelectorAll('.tabs .tab');
    const tableCard = document.querySelector('.table-card');
    const mainGrid = document.querySelector('.main-grid');

    tabsList.forEach(tab => {
        tab.addEventListener('click', () => {
            tabsList.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            activeTab = tab.getAttribute('data-tab');

            // Controlar exibição no Grid principal baseado na aba ativa (mapa removido)
            if (activeTab === 'visao-geral' || activeTab === 'ativos') {
                mainGrid.style.gridTemplateColumns = '1fr';
                tableCard.style.display = 'block';
            } else if (activeTab === 'alertas' || activeTab === 'tickets') {
                mainGrid.style.gridTemplateColumns = '1fr';
                tableCard.style.display = 'block';
                
                const tbody = document.getElementById('assetsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 32px;">
                                Não há registros de ${activeTab} ativos no momento para este projeto.
                            </td>
                        </tr>
                    `;
                }
            }
        });
    });
}

// Busca na barra lateral de projetos
function setupProjectSearch() {
    const projectSearch = document.getElementById('projectSearch');
    projectSearch?.addEventListener('input', (e) => {
        renderProjects(e.target.value);
    });
}
