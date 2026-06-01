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

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadHubEntities(page = 1) {
    try {
        hubPagination.isLoading = true;
        renderPaginationControls();

        const token = localStorage.getItem('authToken');
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (safePage - 1) * HUB_PAGE_LIMIT;
        const response = await fetch(`/api/hub/entities?limit=${HUB_PAGE_LIMIT}&offset=${offset}`, {
            headers: token ? { authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        const entities = Array.isArray(payload.data) ? payload.data : [];
        const pagination = payload.meta?.pagination || {};
        if (entities.length === 0) {
            hubPagination.isLoading = false;
            renderPaginationControls();
            return;
        }

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
            hasMore: Boolean(pagination.hasMore)
        };

        window.hubClients = entities.map(mapHubEntityToModalClient);
        assets = entities.map((entity, index) => ({
            clientId: entity.entityId,
            modalIndex: index,
            project: 'HUB',
            point: entity.name || `Entidade HUB ${entity.entityId}`,
            city: entity.latitude ?? 'N/A',
            unit: entity.longitude ?? 'N/A',
            responsible: entity.sourceSystem || 'HUB'
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
            inspectionDate: 'N/A',
            cameraInstallation: 'N/A',
            cameraSubstitution: 'N/A',
            uninstallDate: 'N/A',
            dedicatedPole: 'N/A',
            installationDate: 'N/A',
            boxType: 'N/A',
            boxInstallation: 'N/A',
            boxInstallationDate: 'N/A',
            armInstallation: 'N/A',
            poleStatus: 'N/A'
        },
        operationalHistory: [],
        attendances: []
    };
}

function openAssetModal(modalIndex, fallbackClientId = 1) {
    if (Number.isInteger(modalIndex) && window.hubClients[modalIndex]) {
        openPointModal(window.hubClients[modalIndex]);
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
        : `Pagina ${page} de ${totalPages} - ${from}-${to} de ${total} itens`;

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

    await loadHubEntities(targetPage);
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
                <td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">
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
            <td style="text-align: center; padding-right: 24px;">${escapeHtml(asset.responsible)}</td>
          </tr>
        `)
        .join('');
}

// Configurar escutadores para os filtros
function setupFilters() {
    const searchAsset = document.getElementById('searchAsset');
    const filterCity = document.getElementById('filterCity');
    const filterUnit = document.getElementById('filterUnit');

    searchAsset?.addEventListener('input', applyFilters);
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
                            <td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 32px;">
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
