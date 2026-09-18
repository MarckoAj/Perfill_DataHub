/* GLPI history is available only inside the client modal. */
let pointGlpiDetails = new Map();
let pointGlpiExpanded = new Set();
let pointGlpiNavigation = 0;

function resetPointGlpiHistory() {
  pointGlpiDetails = new Map();
  pointGlpiExpanded = new Set();
  pointGlpiNavigation++;
}

async function pointGlpiRequest(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(path, { ...options, headers: {
    'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {})
  } });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.message || `HTTP ${response.status}`);
  return payload.data;
}

function fetchPointGlpiHistory(entityId, offset = 0) {
  return pointGlpiRequest(`/api/hub/entities/${encodeURIComponent(entityId)}/glpi-history?limit=20&offset=${offset}`);
}

async function refreshPointGlpiHistory(force = false, client = _getCurrentClient(), state = null) {
  if (!client) return;
  const key = attendanceKey(client, 'glpi');
  state = state || pointAttendancePages[key];
  if (!state?.historyMode || state.refreshing || pointAttendancePages[key] !== state || _getCurrentClient() !== client) return;
  state.refreshing = true;
  state.refreshError = null;
  const redraw = () => {
    if (pointAttendancePages[key] === state && _getCurrentClient() === client && currentPointTab === 'attendance' && pointAttendanceSource() === 'glpi') _renderBody(client);
  };
  redraw();
  try {
    await pointGlpiRequest(`/api/hub/entities/${_getHubId(client)}/glpi-history/sync`, {
      method: 'POST', body: JSON.stringify({ force })
    });
    let result = await fetchPointGlpiHistory(_getHubId(client), state.offset);
    if (result.enabled && state.offset > 0 && state.offset >= result.pagination.total) {
      state.offset = 0;
      result = await fetchPointGlpiHistory(_getHubId(client));
    }
    if (!result.enabled) {
      state.items = [];
      state.pagination = { total: 0, offset: 0, limit: 20, hasMore: false };
      state.refreshError = 'Este ponto não possui mais chamados compartilhados no piloto.';
    } else Object.assign(state, result);
    if (_getCurrentClient() === client) pointGlpiDetails.clear();
  } catch (error) {
    state.refreshError = error.message;
  } finally {
    state.refreshing = false;
    redraw();
  }
}

function renderGlpiDevices(devices, clickable = true) {
  const container = clickable ? 'ul' : 'span';
  const entry = clickable ? 'li' : 'span';
  return `<${container} class="pm-glpi-devices">${(devices || []).map(device => {
    const label = `${device.name || device.itemType} · GLPI ${device.itemId}`;
    const hubId = Number(device.hubId);
    return `<${entry}>${clickable && Number.isSafeInteger(hubId) && hubId > 0
      ? `<button type="button" class="pm-glpi-device-link" onclick="openGlpiRelatedPoint(${hubId})">${_escapeHtml(label)} <span>HUB-${String(hubId).padStart(6, '0')} ↗</span></button>`
      : `<span>${_escapeHtml(label)}${clickable ? ' · Sem vínculo HUB' : ''}</span>`}</${entry}>`;
  }).join('') || `<${entry}>Nenhum dispositivo associado.</${entry}>`}</${container}>`;
}

function renderPointGlpiHistory(client, state) {
  const tabs = currentPlatformTab === 'hub' ? `<div class="pm-attendance-tabs" role="group" aria-label="Fonte dos atendimentos">
    <button type="button" class="point-tab" aria-pressed="false" onclick="changeAttendanceSource('auvo')">AUVO</button>
    <button type="button" class="point-tab active" aria-pressed="true" onclick="changeAttendanceSource('glpi')">GLPI</button></div>` : '';
  const { total, limit, hasMore } = state.pagination;
  const message = state.refreshError || state.lastError;
  return `<section class="pm-attendances"><h3>Atendimentos</h3>${tabs}
    <div class="pm-glpi-toolbar"><div><strong>${total} chamados GLPI</strong>
      <p class="pm-attendance-message">${state.isPilot ? 'Chamados vinculados ao dispositivo deste ponto.' : 'Chamados compartilhados com o ponto 06-014. Histórico parcial do piloto.'}
      ${state.lastSyncedAt ? `Atualizado em ${_escapeHtml(_formatDateTime(state.lastSyncedAt))}.` : 'Aguardando primeira sincronização.'}</p></div>
      <button type="button" class="pm-match-secondary" onclick="refreshPointGlpiHistory(true)" ${state.refreshing ? 'disabled' : ''}>${state.refreshing ? 'Atualizando…' : 'Atualizar histórico'}</button></div>
    ${message ? `<p class="pm-attendance-message" role="alert">${_escapeHtml(message)}</p>` : ''}
    <p id="pm-glpi-navigation-message" class="pm-attendance-message" role="status"></p>
    <div class="pm-glpi-columns" aria-hidden="true"><span>ID</span><span>Título</span><span>Última atualização</span><span>Elementos associados</span><span>Categoria</span></div>
    <div class="pm-attendance-list">${state.items.map(item => {
      const key = `${_getHubId(client)}:${item.id}`;
      return `<details class="pm-attendance-item pm-glpi-ticket" data-ticket-id="${Number(item.id)}" ${pointGlpiExpanded.has(key) ? 'open' : ''} ontoggle="loadPointGlpiTicket(this)">
        <summary><span class="pm-attendance-id" data-label="ID">#${Number(item.id)}</span>
          <span data-label="Título">${_escapeHtml(item.title)}</span>
          <time data-label="Última atualização">${_escapeHtml(_formatDateTime(item.dateUpdated))}</time>
          <span data-label="Elementos associados">${renderGlpiDevices(item.devices, false)}</span>
          <span data-label="Categoria">${_escapeHtml(item.category || 'Não informada')}</span></summary>
        <div class="pm-attendance-detail pm-glpi-detail">${pointGlpiDetails.has(key) ? renderPointGlpiTicket(pointGlpiDetails.get(key)) : '<p role="status">Carregando interações…</p>'}</div>
      </details>`;
    }).join('') || '<p class="pm-attendance-message">Nenhum chamado sincronizado para este dispositivo.</p>'}</div>
    <div class="pm-attendance-pagination"><span>${total ? state.offset + 1 : 0}–${Math.min(state.offset + state.items.length, total)} de ${total} chamados</span><div>
      <button type="button" class="pm-match-secondary" onclick="loadPointAttendances(${Math.max(0, state.offset - limit)})" ${state.offset === 0 ? 'disabled' : ''}>Anterior</button>
      <button type="button" class="pm-match-secondary" onclick="loadPointAttendances(${state.offset + limit})" ${hasMore ? '' : 'disabled'}>Próxima</button>
    </div></div></section>`;
}

async function loadPointGlpiTicket(element) {
  if (!element.isConnected) return;
  const client = _getCurrentClient();
  if (!client) return;
  const key = `${_getHubId(client)}:${element.dataset.ticketId}`;
  if (!element.open) { pointGlpiExpanded.delete(key); return; }
  pointGlpiExpanded.add(key);
  const target = element.querySelector('.pm-glpi-detail');
  if (pointGlpiDetails.has(key)) { target.innerHTML = renderPointGlpiTicket(pointGlpiDetails.get(key)); return; }
  if (element.dataset.loading === 'true') return;
  element.dataset.loading = 'true';
  try {
    const ticket = await pointGlpiRequest(`/api/hub/entities/${_getHubId(client)}/glpi-history/${Number(element.dataset.ticketId)}`);
    if (_getCurrentClient() !== client || !element.isConnected) return;
    pointGlpiDetails.set(key, ticket);
    target.innerHTML = renderPointGlpiTicket(ticket);
  } catch (error) {
    if (element.isConnected) target.innerHTML = `<p role="alert">${_escapeHtml(error.message)}</p><button type="button" class="pm-match-secondary" onclick="loadPointGlpiTicket(this.closest('details'))">Tentar novamente</button>`;
  } finally { element.dataset.loading = 'false'; }
}

function pointGlpiTimeline(interactions) {
  return [...interactions]
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

function renderPointGlpiTicket(ticket) {
  const labels = { response: 'Resposta / acompanhamento', task: 'Tarefa', solution: 'Solução', closure: 'Encerramento do chamado' };
  const url = safeAttendanceUrl(ticket.url);
  return `<div class="pm-glpi-detail-heading"><div class="pm-glpi-detail-title"><strong>${_escapeHtml(ticket.title)}</strong><span class="pm-attendance-status">${_escapeHtml(ticket.status)}</span></div><strong class="pm-glpi-detail-id" aria-label="Chamado ${_escapeHtml(ticket.id)}">#${_escapeHtml(ticket.id)}</strong></div>
    <p class="pm-glpi-content">${_escapeHtml(ticket.description || 'Sem descrição.')}</p>
    <h4>Dispositivos vinculados</h4>${renderGlpiDevices(ticket.devices)}
    <h4>Histórico de interações</h4>
    ${ticket.privateInteractionsHidden ? '<p class="pm-attendance-message">Há interações internas com acesso restrito.</p>' : ''}
    <ol class="pm-glpi-timeline">${pointGlpiTimeline(ticket.interactions).map(item => `<li>
      <div class="pm-glpi-event-heading"><strong>${labels[item.kind] || 'Interação'}${item.isPrivate ? ' · Interna' : ''}</strong><time>${_escapeHtml(_formatDateTime(item.date))}</time></div>
      <p class="pm-glpi-event-author">${_escapeHtml(item.author || 'Não informado')}</p>
      ${item.solutionType ? `<p><strong>Tipo de solução:</strong> ${_escapeHtml(item.solutionType)}</p>` : ''}
      ${item.kind === 'solution' && item.status != null ? `<p><strong>Situação da solução:</strong> ${_escapeHtml(item.solutionStatusLabel || ({ 1: 'Sem aprovação', 2: 'Aguardando aprovação', 3: 'Aprovada', 4: 'Recusada' })[item.status] || String(item.status))}</p>` : ''}
      <div class="pm-glpi-content">${_escapeHtml(item.content || 'Sem conteúdo informado.')}</div>
    </li>`).join('') || '<li>Nenhuma interação disponível.</li>'}</ol>
    ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Abrir chamado no GLPI ↗</a>` : ''}`;
}

async function openGlpiRelatedPoint(hubId) {
  const origin = _getCurrentClient();
  if (!origin) return;
  const requestId = ++pointGlpiNavigation;
  const message = document.getElementById('pm-glpi-navigation-message');
  if (message) message.textContent = 'Carregando ponto vinculado…';
  try {
    const details = await fetchHubEntityDetails(hubId);
    if (requestId !== pointGlpiNavigation || _getCurrentClient() !== origin) return;
    openPointModal(mapHubEntityDetailsToModalClient(details));
    currentPointTab = 'attendance';
    currentAttendanceSource = 'glpi';
    _renderBody(_getCurrentClient());
  } catch {
    if (requestId === pointGlpiNavigation && message?.isConnected) message.textContent = 'Não foi possível abrir o ponto vinculado. Tente novamente.';
  }
}
