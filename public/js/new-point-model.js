/* =========================================================
   POINT MODAL — ENTERPRISE NOC v2
========================================================= */

let currentPlatformTab = "hub";
let currentPointTab = "general";
let currentClientId = null;
let _sidebarOpen = false;

/* =========================================================
   SVG ICONS
========================================================= */
const pmIcons = {
  hub:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-2.239 10-5V7c0-2.761-4.477-5-10-5S2 4.239 2 7v10c0 2.761 4.477 5 10 5z"/><path d="M2 7c0 2.761 4.477 5 10 5s10-2.239 10-5"/><path d="M2 12c0 2.761 4.477 5 10 5s10-2.239 10-5"/></svg>`,
  glpi:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  zabbix:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/><path d="M6 12h4"/></svg>`,
  auvo:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  history: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  pin:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  shield:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
  warn:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  check:   `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clock:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  sliders: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  terminal:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  ping:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  route:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
};

/* =========================================================
   MODAL CONTROL
========================================================= */

function openPointModal(clientOrId = 1) {
  const client = typeof clientOrId === "object"
    ? clientOrId
    : clientsMock.find(c => c.clientId === clientOrId);

  if (!client) return;

  currentClientId = client.clientId;
  window.__currentPointModalClient = client;
  currentPlatformTab = "hub";
  currentPointTab = "general";
  _sidebarOpen = false;

  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  _renderHeader(client, overlay);
  _renderBody(client);
}

function closePointModal() {
  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
  _sidebarOpen = false;
  window.__currentPointModalClient = null;
}

/* =========================================================
   TAB SWITCHERS
========================================================= */

function changePlatformTab(tab) {
  currentPlatformTab = tab;
  const client = _getCurrentClient();
  if (!client) return;
  _renderBody(client);
}

function changePointTab(tab) {
  currentPointTab = tab;
  const client = _getCurrentClient();
  if (!client) return;
  _renderBody(client);
}

function _getCurrentClient() {
  return window.__currentPointModalClient || clientsMock.find(c => c.clientId === currentClientId);
}

/* =========================================================
   SIDEBAR POPOVER TOGGLE
========================================================= */

function toggleSidebarPopover() {
  _sidebarOpen = !_sidebarOpen;
  const popover = document.getElementById("pmSidebarPopover");
  const btn = document.getElementById("pmSidebarToggleBtn");
  if (!popover) return;
  if (_sidebarOpen) {
    popover.classList.add("open");
    btn && btn.classList.add("active");
    // fecha ao clicar fora
    setTimeout(() => {
      document.addEventListener("click", _closeSidebarOnOutsideClick, { once: true });
    }, 10);
  } else {
    popover.classList.remove("open");
    btn && btn.classList.remove("active");
  }
}

function _closeSidebarOnOutsideClick(e) {
  const popover = document.getElementById("pmSidebarPopover");
  const btn = document.getElementById("pmSidebarToggleBtn");
  if (popover && !popover.contains(e.target) && btn && !btn.contains(e.target)) {
    popover.classList.remove("open");
    const b = document.getElementById("pmSidebarToggleBtn");
    b && b.classList.remove("active");
    _sidebarOpen = false;
  }
}

/* =========================================================
   CMD / TERMINAL
========================================================= */

function runNetworkCmd(type) {
  const client = _getCurrentClient();
  const ip = client?.network?.ip || "192.168.1.1";
  const output = document.getElementById("pmCmdOutput");
  if (!output) return;

  output.innerHTML = `<span class="cmd-prompt">C:\\Windows\\System32&gt; </span><span class="cmd-text">${type === "ping" ? `ping -t ${ip}` : `tracert -d ${ip}`}</span>\n`;

  const lines = type === "ping"
    ? [
        `\nDisparando ${ip} com 32 bytes de dados:`,
        `Resposta de ${ip}: bytes=32 tempo=14ms TTL=64`,
        `Resposta de ${ip}: bytes=32 tempo=12ms TTL=64`,
        `Resposta de ${ip}: bytes=32 tempo=13ms TTL=64`,
        `Resposta de ${ip}: bytes=32 tempo=11ms TTL=64`,
        `Resposta de ${ip}: bytes=32 tempo=15ms TTL=64`,
        `\nEstatísticas do Ping para ${ip}:`,
        `    Pacotes: Enviados = 5, Recebidos = 5, Perdidos = 0 (0% de perda)`,
        `Tempos Aproximados de Ida e Volta em Milissegundos:`,
        `    Mínimo = 11ms, Máximo = 15ms, Média = 13ms`,
      ]
    : [
        `\nRastreando rota para ${ip} com máximo de 30 saltos:`,
        `  1    2 ms    1 ms    2 ms  192.168.0.1`,
        `  2   10 ms    9 ms   11 ms  10.0.0.1`,
        `  3   18 ms   17 ms   19 ms  200.98.10.1`,
        `  4   25 ms   24 ms   26 ms  ${ip}`,
        `\nRastreamento concluído.`,
      ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= lines.length) { clearInterval(interval); return; }
    output.innerHTML += `<span class="cmd-line">${lines[i]}</span>\n`;
    output.scrollTop = output.scrollHeight;
    i++;
  }, 180);
}

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function _shortText(value, maxLength = 42) {
  const text = String(value ?? "N/A").trim() || "N/A";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function _getAssetName(client) {
  return client.assetName || client.pointId || client.address || "Ponto";
}

function _getHubId(client) {
  return client.hubId || client.entityId || client.clientId;
}

function _formatHubId(client) {
  const hubId = _getHubId(client);
  return `HUB-${String(hubId).padStart(6, "0")}`;
}

function _getPlatformLinks(client) {
  return client.platformLinks || {};
}

function _getFieldRelations(client, fieldKey) {
  return client.fieldRelations?.[fieldKey] || [];
}

function _relationHint(client, fieldKey) {
  const relations = _getFieldRelations(client, fieldKey);
  if (!relations.length) return "";

  const rows = relations.map(item => `
    <div class="pm-relation-row">
      <span class="pm-relation-platform">${_escapeHtml(item.platform)}</span>
      <span class="pm-relation-path">${_escapeHtml(item.entity)}.${_escapeHtml(item.field)}</span>
      <span class="pm-relation-value">${_escapeHtml(item.value ?? "N/A")}</span>
      <span class="pm-relation-role">${_escapeHtml(item.role || "")}</span>
    </div>
  `).join("");

  return `
    <span class="pm-relation-trigger" tabindex="0">?</span>
    <div class="pm-relation-tooltip">
      <div class="pm-relation-title">Relacionamentos deste campo</div>
      ${rows}
    </div>
  `;
}

function _formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR");
}

function _getPlatformGeneralValue(client, fieldKey, fallback = "N/A") {
  const platformFields = client.platformFields?.[currentPlatformTab];
  if (platformFields) {
    return Object.prototype.hasOwnProperty.call(platformFields, fieldKey)
      ? platformFields[fieldKey]
      : undefined;
  }

  const links = _getPlatformLinks(client);
  const auvoCustomer = client.sources?.auvo?.customer || null;
  const glpiTicket = client.sources?.glpi?.tickets?.[0] || null;

  if (currentPlatformTab === "auvo") {
    const auvoValues = {
      id: links.auvo?.customerId,
      name: auvoCustomer?.description,
      type: "AUVO/customer",
      city: client.city,
      latitude: auvoCustomer?.latitude,
      longitude: auvoCustomer?.longitude,
      location: auvoCustomer?.address,
      unit: auvoCustomer?.segmentName || client.unit,
      region: auvoCustomer?.segmentName || client.region,
      responsible: "AUVO"
    };
    return auvoValues[fieldKey] ?? fallback;
  }

  if (currentPlatformTab === "glpi") {
    const glpiDevice = client.sources?.glpi?.device || null;
    const glpiValues = {
      id: links.glpi?.deviceId,
      name: glpiDevice?.name || glpiTicket?.nomeCliente,
      type: "GLPI/device",
      city: client.city,
      latitude: glpiDevice?.latitude,
      longitude: glpiDevice?.longitude,
      location: links.glpi?.locationId,
      unit: links.glpi?.locationId ? `Localizacao ${links.glpi.locationId}` : client.unit,
      region: glpiDevice?.region || glpiTicket?.projeto || client.region,
      responsible: glpiTicket?.status || "GLPI"
    };
    return glpiValues[fieldKey] ?? fallback;
  }

  return fallback;
}

function _countPlatformDivergences(client, platform) {
  if (platform === "glpi") return client.sources?.glpi?.device ? 0 : 1;
  if (platform === "auvo") return client.sources?.auvo?.customer ? 0 : 1;
  return 0;
}

function _hasPlatformField(client, fieldKey) {
  if (currentPlatformTab === "hub") return true;
  const platformFields = client.platformFields?.[currentPlatformTab];
  if (!platformFields) return true;
  return Object.prototype.hasOwnProperty.call(platformFields, fieldKey);
}

function _platformField(client, label, fieldKey, fallback = "N/A", badge = null, title = null, relationKey = fieldKey) {
  if (!_hasPlatformField(client, fieldKey)) return "";
  const value = _getPlatformGeneralValue(client, fieldKey, fallback);
  return _field(label, value, badge, title, client, relationKey);
}

function _renderGeneralFieldGroups(client, assetName, nameBadge, links) {
  const activeId = currentPlatformTab === "hub"
    ? _formatHubId(client)
    : _getPlatformGeneralValue(client, "id", _formatHubId(client));
  const activeName = _getPlatformGeneralValue(client, "name", assetName);

  const left = [
    _field("Nome do ativo", _shortText(activeName, 36), nameBadge, activeName, client, "name"),
    _field("ID do ativo", activeId, null, null, client, "id"),
    _platformField(client, "Status", "status"),
    _platformField(client, "Tipo", "deviceType", client.type),
    _platformField(client, "Localizacao", "locationName", client.address, null, null, "location"),
    _platformField(client, "Latitude", "latitude", client.latitude, { type: "critical", label: "Campo Critico" })
  ].join("");

  const right = [
    _platformField(client, "Longitude", "longitude", client.longitude, { type: "critical", label: "Campo Critico" }),
    _platformField(client, "Fabricante", "manufacturer"),
    _platformField(client, "Modelo", "model", "N/A", null, null, "model"),
    _platformField(client, "Tecnico encarregado", "hardwareTechnician"),
    _platformField(client, "Projeto", "project"),
    _platformField(client, "Fonte de Atualizacao", "updateSource"),
    _platformField(client, "ID Auvo", "auvoCustomerId", links.auvo?.customerId, null, null, "id")
  ].join("");

  return `
    <div class="pm-fields-grid">
      <div>${left}</div>
      <div>${right}</div>
    </div>
  `;
}

function requestHubSync(platform) {
  const client = _getCurrentClient();
  if (!client) return;

  const label = String(platform || "").toUpperCase();
  client.syncHistory = [
    {
      type: "warning",
      title: `Sincronizacao manual solicitada: ${label} -> HUB`,
      description: "Acao registrada no modal. A persistencia e aplicacao campo-a-campo entram na proxima etapa.",
      at: new Date().toISOString(),
      sourceSystem: label
    },
    ...(client.syncHistory || [])
  ];

  window.__currentPointModalClient = client;
  _renderBody(client);
}

async function fetchHubOperationalTags() {
  const token = localStorage.getItem("authToken");
  const response = await fetch("/api/hub/tags", {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  return payload.data || [];
}

function openHubOperationalTagDialog(action, label) {
  return new Promise(resolve => {
    const existing = document.getElementById("pmOperationalTagDialog");
    existing?.remove();

    const overlay = document.createElement("div");
    overlay.id = "pmOperationalTagDialog";
    overlay.className = "pm-tag-dialog-overlay active";
    overlay.innerHTML = `
      <div class="pm-tag-dialog">
        <div class="pm-tag-dialog-head">
          <strong>${action === "remove" ? "Remover tag operacional" : "Adicionar tag operacional"}</strong>
          <button type="button" onclick="closeHubOperationalTagDialog(false)">x</button>
        </div>
        <div class="pm-tag-dialog-body">
          <div class="pm-tag-dialog-label">${_escapeHtml(label)}</div>
          <label class="pm-tag-dialog-check">
            <input id="pmTagDialogHistory" type="checkbox" checked>
            Adicionar ao historico do ponto
          </label>
          <textarea id="pmTagDialogComment" class="pm-tag-dialog-comment" placeholder="Comentario opcional"></textarea>
        </div>
        <div class="pm-tag-dialog-foot">
          <button type="button" class="pm-match-secondary" onclick="closeHubOperationalTagDialog(false)">Cancelar</button>
          <button type="button" class="pm-match-primary" onclick="closeHubOperationalTagDialog(true)">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    window.__pmTagDialogResolve = resolve;
  });
}

function closeHubOperationalTagDialog(confirmed) {
  const overlay = document.getElementById("pmOperationalTagDialog");
  const resolve = window.__pmTagDialogResolve;
  const result = confirmed ? {
    confirmed: true,
    addToHistory: document.getElementById("pmTagDialogHistory")?.checked === true,
    comment: document.getElementById("pmTagDialogComment")?.value?.trim() || ""
  } : { confirmed: false };
  overlay?.remove();
  window.__pmTagDialogResolve = null;
  resolve?.(result);
}

async function refreshCurrentHubClientAfterTagChange() {
  const client = _getCurrentClient();
  if (!client) return;

  if (client.entityId && typeof fetchHubEntityDetails === "function" && typeof mapHubEntityDetailsToModalClient === "function") {
    const details = await fetchHubEntityDetails(client.entityId);
    window.__currentPointModalClient = mapHubEntityDetailsToModalClient(details, client);
  } else {
    client.operationalTagDefinitions = await fetchHubOperationalTags();
    window.__currentPointModalClient = client;
  }

  _renderBody(window.__currentPointModalClient);
}

async function addHubOperationalTag() {
  const input = document.getElementById("pmOperationalTagInput");
  const label = input?.value?.trim();
  if (!label) return;
  const dialog = await openHubOperationalTagDialog("add", label);
  if (!dialog.confirmed) return;

  const token = localStorage.getItem("authToken");
  const client = _getCurrentClient();
  try {
    const response = await fetch("/api/hub/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        label,
        entityId: client?.entityId,
        addToHistory: dialog.addToHistory,
        comment: dialog.comment
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);

    if (input) input.value = "";
    await refreshCurrentHubClientAfterTagChange();
  } catch (error) {
    alert(`Falha ao adicionar tag operacional: ${error.message}`);
  }
}

async function removeHubOperationalTag(tagId) {
  const currentClient = _getCurrentClient();
  const label = (currentClient?.operationalTagDefinitions || []).find(tag => Number(tag.tagId) === Number(tagId))?.label || `Tag ${tagId}`;
  const dialog = await openHubOperationalTagDialog("remove", label);
  if (!dialog.confirmed) return;

  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`/api/hub/tags/${encodeURIComponent(tagId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        entityId: currentClient?.entityId,
        addToHistory: dialog.addToHistory,
        comment: dialog.comment
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);

    await refreshCurrentHubClientAfterTagChange();
  } catch (error) {
    alert(`Falha ao remover tag operacional: ${error.message}`);
  }
}

async function fetchHubGlpiMatchPreview(entityId, mode = "both") {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`/api/hub/entities/${entityId}/matching/glpi/preview?mode=${encodeURIComponent(mode)}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  return payload.data;
}

function ensureHubGlpiMatchModal() {
  let overlay = document.getElementById("hubGlpiMatchOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "hubGlpiMatchOverlay";
  overlay.className = "pm-match-overlay";
  overlay.innerHTML = `
    <div class="pm-match-modal">
      <div class="pm-match-header">
        <div>
          <div class="pm-match-kicker">HUB x GLPI</div>
          <h3>Associacao do ativo</h3>
        </div>
        <button class="pm-match-close" type="button" onclick="closeHubGlpiMatchModal()" aria-label="Fechar">x</button>
      </div>
      <div class="pm-match-controls">
        <button class="pm-match-mode active" type="button" data-match-mode="both" onclick="changeHubGlpiMatchMode('both')">ID + Nome</button>
        <button class="pm-match-mode" type="button" data-match-mode="id" onclick="changeHubGlpiMatchMode('id')">ID</button>
        <button class="pm-match-mode" type="button" data-match-mode="name" onclick="changeHubGlpiMatchMode('name')">Nome</button>
      </div>
      <div class="pm-match-body" id="hubGlpiMatchBody"></div>
      <div class="pm-match-footer">
        <button class="pm-match-secondary" type="button" onclick="closeHubGlpiMatchModal()">Fechar</button>
        <button class="pm-match-primary" id="hubGlpiMatchConfirmBtn" type="button" onclick="confirmHubGlpiMatchFromModal()" disabled>Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeHubGlpiMatchModal();
  });
  return overlay;
}

function getHubGlpiMatchStatusLabel(status) {
  const labels = {
    sem_vinculo: "Sem vinculo",
    match_id: "Match por ID",
    match_nome: "Match por nome",
    match_ambos: "Match por ambos",
    ambiguo: "Revisao manual",
    baixo_score: "Baixo score",
    ja_vinculado: "Ja vinculado"
  };
  return labels[status] || status || "Indefinido";
}

function getHubGlpiMatchStatusClass(status) {
  if (status === "match_id" || status === "match_nome" || status === "match_ambos" || status === "ja_vinculado") return "success";
  if (status === "ambiguo" || status === "baixo_score") return "warning";
  return "muted";
}

function renderHubGlpiMatchLoading() {
  const body = document.getElementById("hubGlpiMatchBody");
  if (!body) return;
  body.innerHTML = `<div class="pm-match-empty">Carregando preview...</div>`;
}

function renderHubGlpiMatchError(message) {
  const body = document.getElementById("hubGlpiMatchBody");
  if (!body) return;
  body.innerHTML = `<div class="pm-match-empty danger">Falha ao carregar: ${_escapeHtml(message)}</div>`;
}

function renderHubGlpiMatchPreview(preview) {
  const body = document.getElementById("hubGlpiMatchBody");
  const confirmBtn = document.getElementById("hubGlpiMatchConfirmBtn");
  if (!body) return;

  if (!preview) {
    body.innerHTML = `<div class="pm-match-empty">Nenhuma entidade HUB encontrada.</div>`;
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }

  window.__currentHubGlpiMatchPreview = preview;

  const candidates = preview.candidates || [];
  const statusClass = getHubGlpiMatchStatusClass(preview.status);
  const candidateRows = candidates.length
    ? candidates.map(candidate => `
        <label class="pm-match-candidate">
          <input type="radio" name="hubGlpiCandidate" value="${_escapeHtml(candidate.glpiDeviceId || "")}" ${candidate.glpiDeviceId === preview.glpiDeviceId ? "checked" : ""}>
          <div class="pm-match-candidate-main">
            <strong>${_escapeHtml(candidate.glpiName || "GLPI sem nome")}</strong>
            <span>ID GLPI ${_escapeHtml(candidate.glpiDeviceId || "-")} | AUVO ${_escapeHtml(candidate.glpiAuvoCustomerId || "-")}</span>
          </div>
          <div class="pm-match-score">${Number(candidate.score || 0).toFixed(0)}%</div>
        </label>
      `).join("")
    : `<div class="pm-match-empty">Nenhum candidato GLPI local encontrado.</div>`;

  body.innerHTML = `
    <div class="pm-match-summary">
      <div>
        <span>HUB</span>
        <strong>${_escapeHtml(preview.hubName || "-")}</strong>
        <small>ID ${_escapeHtml(String(preview.entityId || "-"))} | AUVO ${_escapeHtml(preview.auvoCustomerId || "-")}</small>
      </div>
      <div class="pm-match-result">
        <span class="pm-match-badge ${statusClass}">${getHubGlpiMatchStatusLabel(preview.status)}</span>
        <strong>${Number(preview.score || 0).toFixed(0)}%</strong>
      </div>
    </div>
    <div class="pm-match-grid">
      <div class="pm-match-field">
        <span>Origem</span>
        <strong>${_escapeHtml(preview.matchOrigin || "-")}</strong>
      </div>
      <div class="pm-match-field">
        <span>Modo</span>
        <strong>${_escapeHtml(preview.matchMode || "-")}</strong>
      </div>
      <div class="pm-match-field">
        <span>Destino</span>
        <strong>${_escapeHtml(preview.glpiDeviceId || "-")}</strong>
      </div>
    </div>
    <div class="pm-match-candidates">
      ${candidateRows}
    </div>
  `;

  if (confirmBtn) {
    confirmBtn.disabled = !preview.canAutoConfirm || preview.alreadyLinked || !preview.glpiDeviceId;
    confirmBtn.title = preview.alreadyLinked
      ? "Vinculo ja existente"
      : (confirmBtn.disabled ? "Preview atual exige revisao ou nao possui candidato confirmavel" : "Confirmar vinculo HUB x GLPI");
  }
}

async function loadHubGlpiMatchPreview(mode = "both") {
  const client = _getCurrentClient();
  const entityId = client?.entityId || client?.hubId || client?.clientId;
  if (!entityId) {
    renderHubGlpiMatchError("cliente sem entityId");
    return;
  }

  renderHubGlpiMatchLoading();
  try {
    const preview = await fetchHubGlpiMatchPreview(entityId, mode);
    renderHubGlpiMatchPreview(preview);
  } catch (error) {
    renderHubGlpiMatchError(error.message);
  }
}

function openHubGlpiMatchModal(mode = "both") {
  const overlay = ensureHubGlpiMatchModal();
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  changeHubGlpiMatchMode(mode);
}

function closeHubGlpiMatchModal() {
  const overlay = document.getElementById("hubGlpiMatchOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = document.getElementById("pointModalOverlay")?.classList.contains("active") ? "hidden" : "auto";
  window.__currentHubGlpiMatchPreview = null;
}

function changeHubGlpiMatchMode(mode) {
  document.querySelectorAll(".pm-match-mode").forEach(button => {
    button.classList.toggle("active", button.dataset.matchMode === mode);
  });
  loadHubGlpiMatchPreview(mode);
}

async function confirmHubGlpiMatchFromModal() {
  const preview = window.__currentHubGlpiMatchPreview;
  const selectedCandidate = document.querySelector('input[name="hubGlpiCandidate"]:checked')?.value;
  const glpiDeviceId = selectedCandidate || preview?.glpiDeviceId;
  if (!preview || !glpiDeviceId) return;

  if (!confirm(`Confirmar vinculo HUB ${preview.entityId} com GLPI ${glpiDeviceId}? A propagacao ficara bloqueada.`)) return;

  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`/api/hub/entities/${preview.entityId}/matching/glpi/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        glpiDeviceId,
        matchMode: preview.matchMode,
        score: preview.score,
        propagate: false
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);

    alert(result.message || "Vinculo confirmado.");
    closeHubGlpiMatchModal();
    const client = _getCurrentClient();
    if (client?.entityId && typeof fetchHubEntityDetails === "function" && typeof mapHubEntityDetailsToModalClient === "function") {
      const details = await fetchHubEntityDetails(client.entityId);
      const refreshedClient = mapHubEntityDetailsToModalClient(details, client);
      window.__currentPointModalClient = refreshedClient;
      _renderBody(refreshedClient);
    }
  } catch (error) {
    alert(`Falha ao confirmar vinculo: ${error.message}`);
  }
}

/* =========================================================
   HEADER RENDER
========================================================= */

function _renderHeader(client, overlay) {
  window.__currentPointModalClient = client;
  const header = overlay.querySelector(".point-modal-header");
  if (!header) return;

  const fullName = _getAssetName(client);
  const displayName = _shortText(fullName, 56);
  const hubId = _formatHubId(client);

  header.innerHTML = `
    <!-- Esquerda: Título + Metadados -->
    <div class="pm-header-left">
      <div class="pm-title-row">
        <h2 class="pm-title" title="${_escapeHtml(fullName)}">${_escapeHtml(displayName)}</h2>
        <span class="pm-badge online">ONLINE</span>
      </div>
      <div class="pm-meta-row">
        <span class="pm-meta-item">${pmIcons.pin} ${client.city} / ${client.state || "BA"}</span>
        <span class="pm-meta-item">${pmIcons.shield} ${client.cicom || client.unit}</span>
        <span class="pm-meta-item">ID Hub: <strong style="color:var(--accent)">${hubId}</strong></span>
      </div>
    </div>

    <!-- Direita: pills de sync + botão de ações + fechar -->
    <div class="pm-header-right">
      <div class="pm-sync-box">
        <div class="pm-sync-label">Situação de sincronização</div>
        <div class="pm-sync-pills">
          ${_syncPill("HUB",    pmIcons.hub,    "success", null)}
          ${_syncPill("GLPI",   pmIcons.glpi,   _countPlatformDivergences(client, "glpi") ? "warning" : "success", _countPlatformDivergences(client, "glpi"))}
          ${_syncPill("ZABBIX", pmIcons.zabbix, "success", null)}
          ${_syncPill("AUVO",   pmIcons.auvo,   _countPlatformDivergences(client, "auvo") ? "warning" : "success", _countPlatformDivergences(client, "auvo"))}
        </div>
      </div>
      <div class="pm-header-actions">
        <button class="point-btn-auvo">Adicionar nova tarefa AUVO</button>
        <div class="pm-header-btns-row">
          <!-- Botão de opções (substitui sidebar) -->
          <div class="pm-options-wrapper">
            <button id="pmSidebarToggleBtn" class="pm-options-btn" onclick="toggleSidebarPopover()" title="Opções do Ponto">
              ${pmIcons.sliders}
              <span>Opções</span>
            </button>
            <div id="pmSidebarPopover" class="pm-sidebar-popover">
              <div class="pm-popover-header">Painel de Controle</div>
              ${_sidebarDivergences()}
              ${_sidebarSync()}
              ${_sidebarActions()}
            </div>
          </div>
        </div>
      </div>
    </div>
    <button onclick="closePointModal()" class="ticket-modal-close" aria-label="Fechar modal">x</button>
  `;
}

function _syncPill(label, icon, state, count) {
  const badgeColor = state === "success"
    ? `background:rgba(16,185,129,.2);color:#10b981;border:1px solid rgba(16,185,129,.35);`
    : `background:rgba(245,158,11,.2);color:var(--warning);border:1px solid rgba(245,158,11,.35);`;
  const badge = state === "success"
    ? `<span class="pm-pill-badge" style="${badgeColor}">${pmIcons.check}</span>`
    : `<span class="pm-pill-badge" style="${badgeColor}">⚠</span>`;
  const countBadge = count
    ? `<span class="pm-pill-count">${count}</span>`
    : "";
  return `
    <div class="pm-sync-pill">
      <span class="pm-pill-icon">${icon}</span>
      <span class="pm-pill-label">${label}</span>
      ${countBadge}
      ${badge}
    </div>`;
}

/* =========================================================
   BODY RENDER
========================================================= */

function _renderBody(client) {
  const container = document.getElementById("pointTabContent");
  if (!container) return;

  /* ABAS DE PLATAFORMA */
  const platformTabs = `
    <div class="platform-tabs">
      ${_platformTab("hub",     "HUB",      pmIcons.hub,     0)}
      ${_platformTab("glpi",    "GLPI",     pmIcons.glpi,    _countPlatformDivergences(client, "glpi"))}
      ${_platformTab("zabbix",  "ZABBIX",   pmIcons.zabbix,  0)}
      ${_platformTab("auvo",    "AUVO",     pmIcons.auvo,    _countPlatformDivergences(client, "auvo"))}
      ${_platformTab("history", "Histórico",pmIcons.history, 0)}
    </div>`;

  /* ABA HISTÓRICO */
  if (currentPlatformTab === "history") {
    container.innerHTML = platformTabs + _historyTab();
    return;
  }

  /* ABAS NORMAIS — sem sidebar lateral, coluna única */
  container.innerHTML = `
    ${platformTabs}

    <div class="pm-content-single">

      <!-- Linha: Sub-abas + botão Opções à direita -->
      <div class="pm-subtabs-row">
        <div class="point-tabs">
          ${_subTab("general",    "Informações Gerais")}
          ${_subTab("network",    "Informações de Rede")}
          ${_subTab("status",     "Estado do Ponto")}
          ${_subTab("attendance", "Atendimentos")}
        </div>
        <div class="pm-options-wrapper">
          <button id="pmSidebarToggleBtn" class="pm-options-btn" onclick="toggleSidebarPopover()" title="Opções do Ponto">
            ${pmIcons.sliders}
            <span>Opções</span>
          </button>
          <div id="pmSidebarPopover" class="pm-sidebar-popover">
            <div class="pm-popover-header">Painel de Controle</div>
            ${_sidebarDivergences()}
            ${_sidebarSync()}
            ${_sidebarActions()}
          </div>
        </div>
      </div>

      <!-- Card de conteúdo da sub-aba -->
      <div class="pm-info-card">
        <div class="pm-info-card-header">
          <div>
            <div class="pm-info-card-title">Informações consolidadas (${currentPlatformTab.toUpperCase()})</div>
            <div class="pm-info-card-subtitle">Valores considerados como fonte principal de verdade.</div>
          </div>
          <span class="pm-critical-badge">4 campos críticos definidos</span>
        </div>

        <div class="pm-info-card-body">
          ${_subTabContent(client)}
        </div>

        <div class="pm-info-card-footer">
          <div class="pm-status-row">
            <span>Status operacional</span>
            <span class="pm-dot-online"></span>
            <span style="color:#10b981;font-weight:700;">ONLINE</span>
          </div>
          <span class="pm-readonly-label">Modo de visualização (somente leitura)</span>
        </div>
      </div>

    </div>`;
}

function _platformTab(id, label, icon, divergences) {
  const active = currentPlatformTab === id ? "active" : "";
  const badge  = divergences > 0
    ? `<span class="platform-badge">${divergences}</span>`
    : "";
  return `
    <button class="platform-tab ${active}" onclick="changePlatformTab('${id}')">
      <span class="pm-tab-icon">${icon}</span>
      <span>${label}</span>
      ${badge}
    </button>`;
}

function _subTab(id, label) {
  const active = currentPointTab === id ? "active" : "";
  return `<button class="point-tab ${active}" onclick="changePointTab('${id}')">${label}</button>`;
}

/* =========================================================
   SUB-ABA: CONTEÚDO
========================================================= */

function _subTabContent(client) {
  /* ── INFORMAÇÕES GERAIS ── */
  if (currentPointTab === "general") {
    const nameBadge = currentPlatformTab === "glpi"
      ? { type: "warning", label: "Divergente do HUB" }
      : { type: "critical", label: "Campo Crítico" };
    const assetName = _getAssetName(client);
    const links = _getPlatformLinks(client);
    client.__renderedGeneralFieldKeys = new Set();
    const fieldValues = {
      name: _getPlatformGeneralValue(client, "name", assetName),
      id: currentPlatformTab === "hub" ? _formatHubId(client) : _getPlatformGeneralValue(client, "id", _formatHubId(client)),
      type: _getPlatformGeneralValue(client, "type", client.type),
      city: _getPlatformGeneralValue(client, "city", client.city),
      latitude: _getPlatformGeneralValue(client, "latitude", client.latitude),
      longitude: _getPlatformGeneralValue(client, "longitude", client.longitude),
      unit: _getPlatformGeneralValue(client, "unit", client.unit),
      region: _getPlatformGeneralValue(client, "region", client.region),
      responsible: _getPlatformGeneralValue(client, "responsible", "HUB")
    };

    return `
      <div class="pm-general-layout">
        <!-- Campos: 2/3 esquerda -->
        <div class="pm-fields-grid">
          <div>
            ${_field("Nome do ativo",    _shortText(fieldValues.name, 36), nameBadge, fieldValues.name, client, "name")}
            ${_field("ID do ativo", fieldValues.id, null, null, client, "id")}
            ${_platformField(client, "Tipo", "deviceType", client.type)}
            ${_platformField(client, "Status", "status")}
            ${_platformField(client, "Latitude", "latitude", client.latitude, { type:"critical", label:"Campo Critico" })}
            ${_field("Município",        fieldValues.city)}
          </div>
          <div>
            ${_platformField(client, "ID Auvo", "auvoCustomerId", links.auvo?.customerId, null, null, "id")}
            ${_platformField(client, "Localizacao", "locationName", client.address, null, null, "location")}
            ${_platformField(client, "Fabricante", "manufacturer")}
            ${_platformField(client, "Modelo", "model", "N/A", null, null, "model")}
            ${_platformField(client, "Projeto", "project")}
            ${_field("Longitude",        fieldValues.longitude, { type:"critical", label:"Campo Critico" }, null, client, "longitude")}
            ${_platformField(client, "Fonte de Atualizacao", "updateSource")}
            ${_platformField(client, "Tecnico encarregado", "hardwareTechnician")}
            ${_field("Região",           fieldValues.region)}
            ${_field("Longitude",        fieldValues.longitude, { type:"critical", label:"Campo Critico" }, null, client, "longitude")}
            ${_field("Responsável técnico", fieldValues.responsible)}
          </div>
        </div>

        <!-- Prévia do dispositivo à direita -->
        <div class="pm-device-preview">
          <div class="pm-device-preview-label">Dispositivo</div>
          <div class="pm-device-img-wrap">
            <svg class="pm-device-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Corpo da câmera -->
              <rect x="8" y="22" width="52" height="36" rx="6" fill="rgba(20,231,197,0.08)" stroke="rgba(20,231,197,0.35)" stroke-width="1.5"/>
              <!-- Lente -->
              <circle cx="34" cy="40" r="13" fill="rgba(20,231,197,0.05)" stroke="rgba(20,231,197,0.4)" stroke-width="1.5"/>
              <circle cx="34" cy="40" r="8" fill="rgba(20,231,197,0.08)" stroke="rgba(20,231,197,0.5)" stroke-width="1.5"/>
              <circle cx="34" cy="40" r="4" fill="rgba(20,231,197,0.25)"/>
              <circle cx="32" cy="38" r="1.2" fill="rgba(255,255,255,0.5)"/>
              <!-- Visor -->
              <rect x="18" y="26" width="12" height="7" rx="2" fill="rgba(20,231,197,0.12)" stroke="rgba(20,231,197,0.3)" stroke-width="1"/>
              <!-- Flash -->
              <circle cx="56" cy="28" r="3" fill="rgba(20,231,197,0.15)" stroke="rgba(20,231,197,0.4)" stroke-width="1"/>
              <!-- Botão disparador -->
              <rect x="34" y="16" width="10" height="6" rx="3" fill="rgba(20,231,197,0.2)" stroke="rgba(20,231,197,0.4)" stroke-width="1"/>
              <!-- Indicador LED -->
              <circle cx="58" cy="38" r="2.5" fill="#10b981" opacity="0.9"/>
              <circle cx="58" cy="38" r="2.5" fill="#10b981" style="filter:blur(3px);opacity:0.6;"/>
              <!-- Suporte/tripé -->
              <line x1="34" y1="58" x2="28" y2="72" stroke="rgba(20,231,197,0.3)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="34" y1="58" x2="34" y2="72" stroke="rgba(20,231,197,0.3)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="34" y1="58" x2="40" y2="72" stroke="rgba(20,231,197,0.3)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="24" y1="72" x2="44" y2="72" stroke="rgba(20,231,197,0.25)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <div class="pm-device-status-row">
              <span class="pm-device-dot online"></span>
              <span class="pm-device-status-label">Câmera Ativa</span>
            </div>
          </div>
          <div class="pm-device-info">
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">Codigo</span>
              <span class="pm-device-info-val">${_escapeHtml(links.hub?.deviceCode || client.pointId || "N/A")}</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">AUVO</span>
              <span class="pm-device-info-val">${_escapeHtml(links.auvo?.customerId || "N/A")}</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">GLPI</span>
              <span class="pm-device-info-val">${_escapeHtml(links.glpi?.deviceId || "N/A")}</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">Localizacao</span>
              <span class="pm-device-info-val">${_escapeHtml(links.glpi?.locationId || "N/A")}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── INFORMAÇÕES DE REDE ── */
  if (currentPointTab === "network") {
    return `
      <div class="pm-network-layout">
        <!-- Campos de rede: 2/3 esquerda -->
        <div class="pm-fields-grid">
          <div>
            ${_field("IP",                        client.network.ip)}
            ${_field("Máscara de Sub-Rede/CIDR",  client.network.subnet)}
            ${_field("Gateway",                   client.network.gateway)}
            ${_field("IP WAN",                    client.network.wanIp)}
          </div>
          <div>
            ${_field("Circuito",                  client.network.circuit)}
            ${_field("Data disponibilidade",      client.network.availabilityDate)}
            ${_field("Uptime do Link",            client.network.uptime)}
            ${_field("Estado do Link",            client.network.linkStatus)}
          </div>
        </div>
        <!-- CMD: 1/3 direita -->

        <div class="pm-cmd-terminal">
          <div class="pm-cmd-titlebar">
            <div class="pm-cmd-titlebar-dots">
              <span class="cmd-dot red"></span>
              <span class="cmd-dot yellow"></span>
              <span class="cmd-dot green"></span>
            </div>
            <span class="pm-cmd-title">${pmIcons.terminal} Terminal de Rede — ${client.network.ip}</span>
          </div>
          <div class="pm-cmd-output" id="pmCmdOutput"><span class="cmd-prompt">C:\\Windows\\System32&gt; </span><span class="cmd-text cmd-cursor">_</span></div>
          <div class="pm-cmd-actions">
            <button class="pm-cmd-btn ping" onclick="runNetworkCmd('ping')">
              ${pmIcons.ping}
              <span>Ping -t</span>
            </button>
            <button class="pm-cmd-btn tracert" onclick="runNetworkCmd('tracert')">
              ${pmIcons.route}
              <span>Tracert -d</span>
            </button>
            <button class="pm-cmd-btn clear" onclick="document.getElementById('pmCmdOutput').innerHTML='<span class=\\'cmd-prompt\\'>C:\\\\Windows\\\\System32&gt; </span><span class=\\'cmd-text cmd-cursor\\'>_</span>'">
              Limpar
            </button>
          </div>
        </div>
      </div>`;
  }

  /* ── ESTADO DO PONTO ── */
  if (currentPointTab === "status") {
    const tagDefinitions = client.operationalTagDefinitions || [];
    const definitionsHtml = tagDefinitions.length
      ? tagDefinitions.map(tag => `
          <span class="pm-op-tag">
            ${_escapeHtml(tag.label)}
            <button type="button" onclick="removeHubOperationalTag(${Number(tag.tagId)})" aria-label="Remover tag ${_escapeHtml(tag.label)}">x</button>
          </span>
        `).join("")
      : `<span class="pm-op-tag empty">Nenhuma tag cadastrada</span>`;

    return `
      <div class="pm-split-layout">
        <!-- Campos à esquerda — grade 2 colunas horizontal -->
        <div class="pm-fields-grid">
          <div>
            ${_field("Data da vistoria",       client.pointStatus.inspectionDate)}
            ${_field("Instalação da câmera",   client.pointStatus.cameraInstallation)}
            ${_field("Substatus Câmera",       client.pointStatus.cameraSubstitution)}
            ${_field("Data Desinstalação",     client.pointStatus.uninstallDate)}
            ${_field("Poste Dedicado",         client.pointStatus.dedicatedPole)}
          </div>
          <div>
            ${_field("Tipo de Caixa",          client.pointStatus.boxType)}
            ${_field("Instalação de caixa",    client.pointStatus.boxInstallation)}
            ${_field("Data Instalação Caixa",  client.pointStatus.boxInstallationDate)}
            ${_field("Instalação de Braço",    client.pointStatus.armInstallation)}
            ${_field("Estado do poste",        client.pointStatus.poleStatus)}
          </div>
        </div>

        <!-- Histórico à direita com fundo branco -->
        <div class="pm-split-history">
          <div class="pm-split-history-header">
            <span class="pm-split-history-title">Histórico de Status Físico</span>
            <span class="pm-split-history-count">${(client.operationalHistory || []).length} registros</span>
          </div>
          <div class="pm-split-history-list">
            ${(client.operationalHistory || []).map(item => `
              <div class="pm-split-history-item">
                <div class="pm-split-history-item-title">${item.title}</div>
                <div class="pm-split-history-item-row">
                  <div class="pm-split-history-kv">
                    <span class="pm-split-kv-key">DE</span>
                    <span class="pm-split-kv-val">${item.from}</span>
                  </div>
                  <div class="pm-split-history-arrow">→</div>
                  <div class="pm-split-history-kv">
                    <span class="pm-split-kv-key">PARA</span>
                    <span class="pm-split-kv-val">${item.to}</span>
                  </div>
                </div>
                <div class="pm-split-history-date">${item.date}</div>
              </div>`).join("")}
          </div>
          <div class="pm-op-tags-compact">
            <div class="pm-op-tags-compact-head">
              <span>Tags operacionais</span>
              <button type="button" onclick="addHubOperationalTag()">Adicionar</button>
            </div>
            <div class="pm-op-tags-form">
              <input id="pmOperationalTagInput" class="pm-op-tag-input" type="text" placeholder="Nova tag">
            </div>
            <div class="pm-op-tags-list">${definitionsHtml}</div>
          </div>
        </div>
      </div>`;
  }

  /* ── ATENDIMENTOS ── */
  if (currentPointTab === "attendance") {
    return `
      <div class="pm-split-layout">
        <!-- Campos à esquerda — grade 2 colunas horizontal -->
        <div class="pm-fields-grid">
          <div>
            ${_field("Atendimentos AUVO",    (client.attendances || []).length)}
            ${_field("Tarefas concluídas",   "12")}
            ${_field("Pendências em Campo",  "02")}
          </div>
          <div>
            ${_field("Chamados GLPI",        "04")}
            ${_field("Chamados críticos",    "01")}
            ${_field("Chamados encerrados",  "08")}
          </div>
        </div>

        <!-- Histórico de Tarefas à direita com fundo branco -->
        <div class="pm-split-history">
          <div class="pm-split-history-header">
            <span class="pm-split-history-title">Histórico de Tarefas em Campo</span>
            <span class="pm-split-history-count">${(client.attendances || []).length} tarefas</span>
          </div>
          <div class="pm-split-history-list">
            ${(client.attendances || []).map(task => `
              <div class="pm-split-task-item" onclick="openAuvoTaskModal(${task.taskId})">
                <div class="pm-split-task-icon ${task.status}"></div>
                <div class="pm-split-task-body">
                  <div class="pm-split-task-title">${task.title}</div>
                  <div class="pm-split-task-meta">${task.date || "—"}</div>
                </div>
                <div class="pm-split-task-arrow">›</div>
              </div>`).join("")}
          </div>
        </div>
      </div>`;
  }

  return "";
}

/* =========================================================
   SIDEBAR WIDGETS (usados no popover)
========================================================= */

function _sidebarDivergences() {
  return `
    <div class="pm-sidebar-card">
      <div class="pm-sidebar-title">Resumo de divergências</div>
      <div class="pm-donut-row">
        <div class="pm-donut-wrap">
          <div class="pm-donut">
            <div class="pm-donut-hole">
              <span class="pm-donut-num">3</span>
              <span class="pm-donut-label">diverg.</span>
            </div>
          </div>
        </div>
        <div class="pm-donut-legend">
          <div class="pm-legend-item">
            <div class="pm-legend-left"><span class="pm-legend-dot success"></span><span>Sincronizados</span></div>
            <span class="pm-legend-val">18</span>
          </div>
          <div class="pm-legend-item">
            <div class="pm-legend-left"><span class="pm-legend-dot warning"></span><span>Divergentes</span></div>
            <span class="pm-legend-val">3</span>
          </div>
          <div class="pm-legend-item">
            <div class="pm-legend-left"><span class="pm-legend-dot danger"></span><span>Ausentes</span></div>
            <span class="pm-legend-val">1</span>
          </div>
        </div>
      </div>
    </div>`;
}

function _sidebarSync() {
  return `
    <div class="pm-sidebar-card">
      <div class="pm-sidebar-title">Última sincronização</div>
      <div class="pm-sync-history">
        <div class="pm-sync-row">
          <div class="pm-sync-platform">${pmIcons.glpi} <span>GLPI</span></div>
          <span class="pm-sync-status warning">Campos divergentes</span>
          <span class="pm-sync-time">${pmIcons.clock} há 8 min</span>
        </div>
        <div class="pm-sync-row">
          <div class="pm-sync-platform">${pmIcons.zabbix} <span>ZABBIX</span></div>
          <span class="pm-sync-status success">Sincronizado</span>
          <span class="pm-sync-time">${pmIcons.clock} há 2 min</span>
        </div>
        <div class="pm-sync-row">
          <div class="pm-sync-platform">${pmIcons.auvo} <span>AUVO</span></div>
          <span class="pm-sync-status warning">Campos divergentes</span>
          <span class="pm-sync-time">${pmIcons.clock} há 5 min</span>
        </div>
      </div>
    </div>`;
}

function _sidebarHubSyncActions() {
  const client = _getCurrentClient() || {};
  const canSyncFromAuvo = Boolean(client.sources?.auvo?.customer);
  const canReviewGlpi = Boolean(client.entityId || client.hubId || client.clientId);

  return `
    <div class="pm-sidebar-card">
      <div class="pm-sidebar-title">Acoes rapidas</div>
      <div class="pm-actions">
        <button class="pm-action-btn cyan" onclick="requestHubSync('auvo')" ${canSyncFromAuvo ? "" : "disabled"}>${pmIcons.refresh} <span>Sincronizar HUB com AUVO</span></button>
        <button class="pm-action-btn cyan" onclick="openHubGlpiMatchModal('both')" ${canReviewGlpi ? "" : "disabled"}>${pmIcons.glpi} <span>Revisar associacao GLPI</span></button>
        <button class="pm-action-btn orange">${pmIcons.warn} <span>Resolver divergencias pendentes</span></button>
      </div>
    </div>`;
}

function _sidebarActions() {
  const dynamicActions = _sidebarHubSyncActions();
  if (dynamicActions) return dynamicActions;

  return `
    <div class="pm-sidebar-card">
      <div class="pm-sidebar-title">Ações rápidas</div>
      <div class="pm-actions">
        <button class="pm-action-btn cyan">${pmIcons.refresh} <span>Sincronizar todas plataformas</span></button>
        <button class="pm-action-btn orange">${pmIcons.warn} <span>Resolver divergências pendentes</span></button>
      </div>
    </div>`;
}

/* =========================================================
   ABA HISTÓRICO
========================================================= */

function _historyTab() {
  const client = _getCurrentClient() || {};
  const history = client.syncHistory || [];

  if (history.length > 0) {
    return `
      <div class="pm-history-wrap">
        <div class="history-timeline">
          ${history.map(item => `
            <div class="timeline-item">
              <div class="timeline-dot ${item.type === "warning" ? "warning" : "success"}"></div>
              <div class="timeline-content">
                <div class="timeline-title">${_escapeHtml(item.title || "Evento HUB")}</div>
                <div class="timeline-meta">${_escapeHtml(item.description || "")}</div>
                <div class="timeline-meta">${_escapeHtml(item.sourceSystem || "HUB")} - ${_escapeHtml(_formatDateTime(item.at))}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="pm-history-wrap">
      <div class="history-timeline">
        <div class="timeline-item">
          <div class="timeline-dot success"></div>
          <div class="timeline-content">
            <div class="timeline-title">Nome sincronizado via AUVO</div>
            <div class="timeline-meta">há 12 minutos</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot warning"></div>
          <div class="timeline-content">
            <div class="timeline-title">Divergência detectada no GLPI</div>
            <div class="timeline-meta">há 21 minutos</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot success"></div>
          <div class="timeline-content">
            <div class="timeline-title">Coordenadas atualizadas pelo HUB</div>
            <div class="timeline-meta">Hoje às 18:42</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* =========================================================
   INFO BLOCK GENERATOR
========================================================= */

function _field(label, value, badge = null, title = null, client = null, fieldKey = null) {
  if (value === undefined || value === null || value === "") return "";
  if (client?.__renderedGeneralFieldKeys && fieldKey) {
    const renderKey = `${label}|${fieldKey}`;
    if (client.__renderedGeneralFieldKeys.has(renderKey)) return "";
    client.__renderedGeneralFieldKeys.add(renderKey);
  }

  let badgeHTML = "";
  if (badge) {
    const cls = badge.type === "critical" ? "pm-badge-critical" : `divergence-badge ${badge.type}`;
    badgeHTML = `<span class="${cls}">${badge.label}</span>`;
  }
  const titleAttr = title ? ` title="${_escapeHtml(title)}"` : "";
  const relationHTML = client && fieldKey ? _relationHint(client, fieldKey) : "";
  return `
    <div class="info-block">
      <div class="info-label">${label}${relationHTML}</div>
      <div class="info-value-wrapper">
        <span class="info-value"${titleAttr}>${_escapeHtml(value || "N/A")}</span>
        ${badgeHTML}
      </div>
    </div>`;
}

/* Alias para compatibilidade com código legado */
function infoBlock(label, value, divergence = null) {
  return _field(label, value, divergence);
}
