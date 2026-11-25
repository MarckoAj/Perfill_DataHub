let assets = [];

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
let hubEntitiesRequestId = 0;
let hubOperationalTags = [];
let hubSelectedTags = new Set();
let hubExcludedTags = new Set();
let hubIncludeUntagged = false;
let hubCoordinates = 'all';
let hubTagsLoaded = false;
let hubLoadError = '';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadHubEntities(page = 1, searchText = hubSearchText) {
    const requestId = ++hubEntitiesRequestId;
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
        params.set('includeTags', [...hubSelectedTags].join(','));
        params.set('includeUntagged', String(hubIncludeUntagged));
        params.set('coordinates', hubCoordinates);
        if (hubTagsLoaded) params.set('excludeTags', [...hubExcludedTags].join(','));
        hubLoadError = '';

        const response = await fetch(`/api/hub/entities?${params.toString()}`, {
            headers: token ? { authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        if (requestId !== hubEntitiesRequestId) return;
        const entities = Array.isArray(payload.data) ? payload.data : [];
        const pagination = payload.meta?.pagination || {};

        const total = Number(pagination.total) || entities.length;
        const limit = Number(pagination.limit) || HUB_PAGE_LIMIT;
        const currentOffset = Number(pagination.offset) || offset;

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
            point: entity.name || `Entidade HUB ${entity.entityId}`,
            city: entity.city || null,
            fieldTechnician: entity.fieldTechnician || null,
            nocTechnician: entity.nocTechnician || null,
            cityBySource: entity.cityBySource || {},
            platformIds: entity.platformIds || { hub: entity.entityId, auvo: [entity.sourceRecordId].filter(Boolean), glpi: [] },
            cicom: entity.cicom || null,
            operationalTags: entity.operationalTags || []
        }));
    } catch (error) {
        if (requestId !== hubEntitiesRequestId) return;
        hubPagination.isLoading = false;
        hubLoadError = 'Não foi possível carregar os pontos. Tente novamente.';
        console.warn('[Clientes] Falha ao carregar /api/hub/entities:', error.message);
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
        hubTagsLoaded = true;
        hubExcludedTags = new Set(
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
    const options = mode => hubOperationalTags.map(tag => `
        <label class="tag-filter-option" data-tag-option="${mode}">
          <input type="checkbox" data-${mode}-tag value="${escapeHtml(tag.normalizedLabel || tag.label)}">
          ${escapeHtml(tag.label)}
        </label>`).join('');
    container.innerHTML = `
      <div class="hub-filter-toolbar">
        <details class="hub-filter-picker">
          <summary>Tags <span id="hubTagCount"></span></summary>
          <div class="hub-filter-picker-body">
            <input type="search" id="hubTagSearch" class="filter-input" placeholder="Buscar tag..." aria-label="Buscar tag">
            <div class="hub-filter-tag-options">
              <label class="tag-filter-option" data-tag-option="include"><input type="checkbox" id="hubIncludeUntagged">Sem tags</label>
              ${options('include')}
            </div>
            <small id="hubTagSearchEmpty" hidden>Nenhuma tag encontrada.</small>
            <small class="tag-filter-help">Nenhuma selecionada: todas as tags. Várias selecionadas: qualquer uma delas.</small>
          </div>
        </details>
        <details class="hub-filter-picker">
          <summary>Mais filtros</summary>
          <div class="hub-filter-picker-body">
            <strong>Ocultar pontos com…</strong>
            <div class="hub-filter-tag-options">${options('exclude')}</div>
            <small class="tag-filter-help">A ocultação prevalece, mesmo quando o ponto possui outras tags selecionadas.</small>
            <small class="tag-filter-help">Coordenadas incompletas: apenas latitude ou longitude. Ausentes: nenhuma das duas.</small>
          </div>
        </details>
        <div class="hub-filter-actions">
          <button type="button" class="tag-filter-show-all" data-reset="clear">Limpar filtros</button>
          <button type="button" class="tag-filter-show-all" data-reset="default">Restaurar padrão</button>
        </div>
      </div>
      <div id="hubSelectedFilterChips" class="hub-filter-chips" aria-label="Filtros selecionados"></div>
      <div id="hubHiddenTagSummary" class="tag-filter-help" aria-live="polite"></div>
      <div id="hubFilterConflict" class="tag-filter-help" role="status"></div>
      ${!hubTagsLoaded ? '<small role="alert">Não foi possível carregar as tags. As ocultações padrão permanecem ativas. <button type="button" class="tag-filter-show-all" id="hubRetryTags">Tentar novamente</button></small>' : ''}
    `;
    container.addEventListener('change', handleHubFilterChange);
    container.addEventListener('click', handleHubFilterClick);
    document.getElementById('hubTagSearch').addEventListener('input', event => {
        const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const query = normalize(event.target.value);
        let visible = 0;
        container.querySelectorAll('[data-tag-option="include"]').forEach(label => {
            label.hidden = !normalize(label.textContent).includes(query);
            if (!label.hidden) visible++;
        });
        document.getElementById('hubTagSearchEmpty').hidden = visible > 0;
    });
    updateHubFilterSummary();
}

function updateHubFilterSummary() {
    const container = document.getElementById('hubTagFilters');
    if (!container) return;
    const labelFor = value => hubOperationalTags.find(tag => (tag.normalizedLabel || tag.label) === value)?.label || value;
    const chip = (kind, value, label) => `<button type="button" class="hub-filter-chip" data-remove-filter="${kind}" data-value="${escapeHtml(value)}" aria-label="Remover filtro ${escapeHtml(label)}">${escapeHtml(label)} <span aria-hidden="true">×</span></button>`;
    const coordinateLabels = { complete: 'Coordenadas completas', incomplete: 'Coordenadas incompletas', missing: 'Coordenadas ausentes' };
    document.getElementById('hubSelectedFilterChips').innerHTML = [...hubSelectedTags].map(tag => chip('tag', tag, labelFor(tag))).join('') +
        (hubIncludeUntagged ? chip('untagged', '', 'Sem tags') : '') +
        (hubCoordinates !== 'all' ? chip('coordinates', '', coordinateLabels[hubCoordinates]) : '');
    const count = hubSelectedTags.size + Number(hubIncludeUntagged);
    document.getElementById('hubTagCount').textContent = count ? `(${count})` : '(Todas)';
    document.getElementById('hubHiddenTagSummary').textContent = hubTagsLoaded
        ? (hubExcludedTags.size ? `Ocultando: ${[...hubExcludedTags].map(labelFor).join(', ')}.` : 'Nenhuma tag oculta.')
        : 'Ocultações padrão aplicadas pelo servidor.';
    const conflicts = [...hubSelectedTags].filter(tag => hubExcludedTags.has(tag));
    document.getElementById('hubFilterConflict').textContent = conflicts.length
        ? `Tags selecionadas também estão ocultas: ${conflicts.map(labelFor).join(', ')}. Desmarque a ocultação em Mais filtros para exibi-las.` : '';
    container.querySelectorAll('[data-include-tag]').forEach(input => { input.checked = hubSelectedTags.has(input.value); });
    container.querySelectorAll('[data-exclude-tag]').forEach(input => { input.checked = hubExcludedTags.has(input.value); });
    document.getElementById('hubIncludeUntagged').checked = hubIncludeUntagged;
    document.getElementById('filterCoordinates').value = hubCoordinates;
    container.querySelectorAll('[data-reset]').forEach(button => { button.disabled = !hubTagsLoaded; });
}

function refreshHubFilters() {
    updateHubFilterSummary();
    return runHubSearch(document.getElementById('searchAsset')?.value ?? hubSearchText);
}

function handleHubFilterChange(event) {
    const input = event.target;
    if (input.id === 'hubIncludeUntagged') hubIncludeUntagged = input.checked;
    else if (input.matches('[data-include-tag], [data-exclude-tag]')) {
        const selection = input.matches('[data-include-tag]') ? hubSelectedTags : hubExcludedTags;
        if (input.checked) selection.add(input.value);
        else selection.delete(input.value);
    } else return;
    refreshHubFilters();
}

function handleHubFilterClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'hubRetryTags') {
        loadHubOperationalTags().then(refreshHubFilters);
        return;
    }
    if (button.dataset.reset) {
        hubSelectedTags.clear();
        hubIncludeUntagged = false;
        hubCoordinates = 'all';
        hubExcludedTags = button.dataset.reset === 'default'
            ? new Set(hubOperationalTags.filter(tag => tag.hideByDefault).map(tag => tag.normalizedLabel || tag.label)) : new Set();
    } else if (button.dataset.removeFilter) {
        if (button.dataset.removeFilter === 'tag') hubSelectedTags.delete(button.dataset.value);
        if (button.dataset.removeFilter === 'untagged') hubIncludeUntagged = false;
        if (button.dataset.removeFilter === 'coordinates') hubCoordinates = 'all';
    } else return;
    refreshHubFilters();
}

function renderOperationalTagChips(tags = []) {
    if (!Array.isArray(tags) || tags.length === 0) return '<span class="hub-tag-chip empty">Sem tags</span>';

    return tags
        .map(tag => `<span class="hub-tag-chip">${escapeHtml(tag.label || tag.normalizedLabel || tag)}</span>`)
        .join('');
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
    const disabled = hubPagination.isLoading || !hubPagination.isHub || Boolean(hubLoadError);
    const prevDisabled = disabled || page <= 1;
    const nextDisabled = disabled || page >= totalPages;
    const summary = hubPagination.isLoading
        ? 'Carregando pagina...'
        : hubLoadError ? 'Falha ao carregar os resultados.'
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
    applyFilters();
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




// Inicializar e registrar os escutadores de eventos
document.addEventListener('DOMContentLoaded', async () => {
    setupFilters();
    await loadHubOperationalTags();
    hubSearchText = document.getElementById('searchAsset')?.value.trim() || '';
    await loadHubEntities(1, hubSearchText);
    applyFilters();
    setupHubColumns();
});

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
    
    // Obter valores dos filtros
    const searchText = document.getElementById('searchAsset')?.value.toLowerCase() || '';


    // Resultados da API com filtros e paginação aplicados
    let filtered = assets;

    // Renderizar tabela
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody) return;
    renderPaginationControls(filtered.length);
    renderHubColumnHeaders();

    if (hubLoadError) {
        tbody.innerHTML = `<tr><td colspan="${visibleHubColumns().length}" role="alert" style="text-align:center;padding:24px">${escapeHtml(hubLoadError)} <button type="button" class="tag-filter-show-all" id="hubRetryEntities">Tentar novamente</button></td></tr>`;
        document.getElementById('hubRetryEntities').addEventListener('click', refreshHubFilters);
        return;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${visibleHubColumns().length}" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">
                    Nenhum ativo localizado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(asset => `<tr onclick="openAssetModal(${asset.modalIndex}, ${asset.clientId})">${visibleHubColumns().map(key => renderHubCell(key, asset)).join('')}</tr>`).join('');
}

async function runHubSearch(searchText) {
    clearTimeout(hubSearchTimer);
    hubSearchText = String(searchText || '').trim();
    await loadHubEntities(1, hubSearchText);
    applyFilters();
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
    searchAsset?.addEventListener('input', event => scheduleHubSearch(event.target.value));
    searchAsset?.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        runHubSearch(event.target.value);
    });
    document.getElementById('filterCoordinates')?.addEventListener('change', event => {
        hubCoordinates = event.target.value;
        refreshHubFilters();
    });
}

const hubColumnLabels = { id: 'ID do ponto', name: 'Nome', city: 'Cidade', cicom: 'Unidade CICOM', ip: 'IP', fieldTechnician: 'Técnico de campo', nocTechnician: 'Técnico NOC', tags: 'Tags' };
const hubColumnDefaults = Object.keys(hubColumnLabels);
let hubColumnOrder = [...hubColumnDefaults];
let hubColumnVisible = new Set(hubColumnDefaults);
function visibleHubColumns() { return hubColumnOrder.filter(key => hubColumnVisible.has(key)); }
function renderHubColumnHeaders() {
 const head = document.getElementById('hubColumnHeaders');
 if(head)head.innerHTML = visibleHubColumns().map(key => '<th scope="col" class="hub-col-'+key+'">'+hubColumnLabels[key]+'</th>').join('');
}
function renderHubCell(key, asset) {
 let content = '<span class="hub-no-data" aria-label="Não disponível">—</span>';
 if(key==='id') {
  const ids=asset.platformIds||{};
  const info='HUB: '+asset.clientId+'\nAUVO: '+((ids.auvo||[]).join(', ')||'Não vinculado')+'\nGLPI: '+((ids.glpi||[]).join(', ')||'Não vinculado');
  content='<span tabindex="0" class="hub-value-hint" aria-describedby="hub-tip-'+key+'-'+asset.clientId+'">HUB-'+String(asset.clientId).padStart(6,'0')+'<span class="hub-value-tooltip" id="hub-tip-'+key+'-'+asset.clientId+'" role="tooltip">'+escapeHtml(info)+'</span></span>';
 }
 if(key==='name')content='<button type="button" class="hub-client-link" onclick="event.stopPropagation();openAssetModal('+asset.modalIndex+','+asset.clientId+')">'+escapeHtml(asset.point)+'</button>';
 if(key==='city') {
  const source=asset.cityBySource||{};
  const values=key => (source[key]||[]).map(item => (item.sourceRecordId ? '#'+item.sourceRecordId+': ' : '')+(item.value||'—')).join('; ')||'—';
  const info='HUB: '+(asset.city||'—')+'\nGLPI: '+values('glpi')+'\nZabbix: '+values('zabbix')+'\nPlanilha base: '+values('spreadsheet')+'\nAUVO: campo não disponível';
  content='<span tabindex="0" class="hub-value-hint" aria-describedby="hub-tip-'+key+'-'+asset.clientId+'">'+escapeHtml(asset.city||'—')+'<span class="hub-value-tooltip" id="hub-tip-'+key+'-'+asset.clientId+'" role="tooltip">'+escapeHtml(info)+'</span></span>';
 }
 if(['cicom','fieldTechnician','nocTechnician'].includes(key)&&asset[key])content=escapeHtml(asset[key]);
 if(key==='tags')content='<div class="hub-tag-chip-list">'+renderOperationalTagChips(asset.operationalTags)+'</div>';
 return '<td class="hub-col-'+key+'">'+content+'</td>';
}
function saveHubColumns() {
 try {localStorage.setItem('hub.operationalColumns.v1',JSON.stringify({order:hubColumnOrder,visible:[...hubColumnVisible]}));} catch {}
}
function renderHubColumnOptions() {
 const container=document.getElementById('hubColumnOptions');if(!container)return;
 container.innerHTML=hubColumnOrder.map((key,index)=>'<div class="hub-column-option"><label><input type="checkbox" data-column="'+key+'" '+(hubColumnVisible.has(key)?'checked ':'')+(['id','name'].includes(key)?'disabled ':'')+'>'+hubColumnLabels[key]+'</label><button type="button" data-move="'+key+'" data-direction="-1" aria-label="Mover '+hubColumnLabels[key]+' para esquerda" '+(index===0?'disabled':'')+'>←</button><button type="button" data-move="'+key+'" data-direction="1" aria-label="Mover '+hubColumnLabels[key]+' para direita" '+(index===hubColumnOrder.length-1?'disabled':'')+'>→</button></div>').join('');
}
function setupHubColumns() {
 try {
  const saved=JSON.parse(localStorage.getItem('hub.operationalColumns.v1'));
  if(saved&&Array.isArray(saved.order)&&Array.isArray(saved.visible)){
   hubColumnOrder=[...new Set([...saved.order.filter(key=>hubColumnDefaults.includes(key)),...hubColumnDefaults])];
   hubColumnVisible=new Set([...saved.visible.filter(key=>hubColumnDefaults.includes(key)),'id','name']);
  }
 } catch {}
 const container=document.getElementById('hubColumnOptions');
 container?.addEventListener('change',event=>{const key=event.target.dataset.column;if(!hubColumnDefaults.includes(key)||['id','name'].includes(key))return;if(event.target.checked)hubColumnVisible.add(key);else hubColumnVisible.delete(key);saveHubColumns();applyFilters();});
 container?.addEventListener('click',event=>{const button=event.target.closest('[data-move]');if(!button)return;const index=hubColumnOrder.indexOf(button.dataset.move),next=index+Number(button.dataset.direction);if(index<0||next<0||next>=hubColumnOrder.length)return;[hubColumnOrder[index],hubColumnOrder[next]]=[hubColumnOrder[next],hubColumnOrder[index]];saveHubColumns();renderHubColumnOptions();applyFilters();});
 document.getElementById('hubResetColumns')?.addEventListener('click',()=>{hubColumnOrder=[...hubColumnDefaults];hubColumnVisible=new Set(hubColumnDefaults);saveHubColumns();renderHubColumnOptions();applyFilters();});
 renderHubColumnOptions();applyFilters();
}
