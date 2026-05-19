// clientes.js - Controlador do Painel de Clientes Operacionais

// Dados mockados enriquecidos para interatividade Enterprise
const projects = [
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

const assets = [
    {
        project: 'PI-NOVO',
        point: 'RP 01 - CAJAZEIRAS',
        city: 'Cajazeiras',
        unit: '22º CIPM',
        responsible: 'Adriano Santos',
        camera: 'Online',
        link: 'Online'
    },
    {
        project: 'PI-NOVO',
        point: 'RP 02 - ENTRADA DA CIDADE',
        city: 'Simões Filho',
        unit: '22º CIPM',
        responsible: 'Tiago Almeida',
        camera: 'Offline',
        link: 'Link Down'
    },
    {
        project: 'PI-NOVO',
        point: 'RP 03 - POSTO FISCAL',
        city: 'Feira de Santana',
        unit: '66º CIPM',
        responsible: 'Marcos Lima',
        camera: 'Online',
        link: 'Online'
    },
    {
        project: 'PI-NOVO',
        point: 'RP 04 - VIADUTO',
        city: 'Salvador',
        unit: '1º CIPM',
        responsible: 'José Carlos',
        camera: 'Online',
        link: 'Online'
    },
    {
        project: 'LEGADO',
        point: 'RP 05 - ATACADÃO',
        city: 'Lauro de Freitas',
        unit: '52º CIPM',
        responsible: 'Fernanda Costa',
        camera: 'Online',
        link: 'Atenção'
    },
    {
        project: 'LEGADO',
        point: 'RP 06 - ENTRADA NORTE',
        city: 'Alagoinhas',
        unit: '4º CIPM',
        responsible: 'Carlos Eduardo',
        camera: 'Offline',
        link: 'Link Down'
    },
    {
        project: 'CFTV',
        point: 'RP 07 - CAMPO DO GADO',
        city: 'Serrinha',
        unit: '16º CIPM',
        responsible: 'Rafael Nunes',
        camera: 'Online',
        link: 'Online'
    },
    {
        project: 'CFTV',
        point: 'RP 08 - PRAÇA CENTRAL',
        city: 'Jacaraci',
        unit: '94º CIPM',
        responsible: 'Luiz Henrique',
        camera: 'Online',
        link: 'Atenção'
    }
];

// Estado atual da aplicação no frontend
let selectedProjectIndex = 0;
let activeTab = 'visao-geral';

// Inicializar e registrar os escutadores de eventos
document.addEventListener('DOMContentLoaded', () => {
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
        filterCity.innerHTML = '<option value="">Município: Todos</option>' + 
            cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (filterUnit) {
        const units = [...new Set(projectAssets.map(a => a.unit))].sort();
        filterUnit.innerHTML = '<option value="">Unidade: Todas</option>' + 
            units.map(u => `<option value="${u}">${u}</option>`).join('');
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
    const cameraVal = document.getElementById('filterCamera')?.value || '';
    const linkVal = document.getElementById('filterLink')?.value || '';

    // Filtrar ativos do projeto selecionado
    let filtered = assets.filter(a => a.project === project.name);

    if (searchText) {
        filtered = filtered.filter(a => 
            a.point.toLowerCase().includes(searchText) ||
            a.responsible.toLowerCase().includes(searchText)
        );
    }

    if (cityVal) {
        filtered = filtered.filter(a => a.city === cityVal);
    }

    if (unitVal) {
        filtered = filtered.filter(a => a.unit === unitVal);
    }

    if (cameraVal) {
        filtered = filtered.filter(a => a.camera === cameraVal);
    }

    if (linkVal) {
        filtered = filtered.filter(a => a.link === linkVal);
    }

    // Renderizar tabela
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">
                    Nenhum ativo localizado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered
        .map(asset => `
          <tr>
            <td style="font-weight: 600;">${asset.point}</td>
            <td>${asset.city}</td>
            <td>${asset.unit}</td>
            <td>${asset.responsible}</td>
            <td class="${getStatusClass(asset.camera)}">● ${asset.camera}</td>
            <td class="${getStatusClass(asset.link)}">● ${asset.link}</td>
          </tr>
        `)
        .join('');
}

// Configurar escutadores para os filtros
function setupFilters() {
    const searchAsset = document.getElementById('searchAsset');
    const filterCity = document.getElementById('filterCity');
    const filterUnit = document.getElementById('filterUnit');
    const filterCamera = document.getElementById('filterCamera');
    const filterLink = document.getElementById('filterLink');

    searchAsset?.addEventListener('input', applyFilters);
    filterCity?.addEventListener('change', applyFilters);
    filterUnit?.addEventListener('change', applyFilters);
    filterCamera?.addEventListener('change', applyFilters);
    filterLink?.addEventListener('change', applyFilters);
}

// Configurar navegação entre abas (comportamento de SPA premium)
function setupTabs() {
    const tabsList = document.querySelectorAll('.tabs .tab');
    const tableCard = document.querySelector('.table-card');
    const mapCard = document.querySelector('.map-card');
    const mainGrid = document.querySelector('.main-grid');

    tabsList.forEach(tab => {
        tab.addEventListener('click', () => {
            tabsList.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            activeTab = tab.getAttribute('data-tab');

            // Controlar exibição no Grid principal baseado na aba ativa
            if (activeTab === 'visao-geral') {
                mainGrid.style.gridTemplateColumns = '1fr 420px';
                tableCard.style.display = 'block';
                mapCard.style.display = 'flex';
            } else if (activeTab === 'ativos') {
                mainGrid.style.gridTemplateColumns = '1fr';
                tableCard.style.display = 'block';
                mapCard.style.display = 'none';
            } else if (activeTab === 'mapa') {
                mainGrid.style.gridTemplateColumns = '1fr';
                tableCard.style.display = 'none';
                mapCard.style.display = 'flex';
            } else if (activeTab === 'alertas' || activeTab === 'tickets') {
                // Para abas vazias ou com outros dados mockados
                mainGrid.style.gridTemplateColumns = '1fr';
                tableCard.style.display = 'block';
                mapCard.style.display = 'none';
                
                const tbody = document.getElementById('assetsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 32px;">
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
