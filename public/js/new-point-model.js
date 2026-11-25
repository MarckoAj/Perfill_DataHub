/* =========================================================
   POINT MODAL — ENTERPRISE NOC v2
========================================================= */

let currentPlatformTab = "hub";
let currentPointTab = "general";
let currentClientId = null;
let _sidebarOpen = false;
let currentAttendanceSource = 'auvo';
let pointAttendancePages = {};
let pointAttendanceFilters = {};
const pointPlatformSections = {
  hub: ['general', 'network', 'status', 'attendance'],
  glpi: ['general', 'network', 'status', 'attendance'],
  auvo: ['general', 'attendance'],
  zabbix: ['general', 'network'],
  spreadsheet: ['general', 'network', 'status']
};
const pointPlatformLabels = { hub: 'HUB', glpi: 'GLPI', auvo: 'AUVO', zabbix: 'ZABBIX', spreadsheet: 'Planilha base' };

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

  resetPointOperation();
  currentClientId = client.clientId;
  window.__currentPointModalClient = client;
  currentPlatformTab = "hub";
  currentPointTab = "general";
  currentAttendanceSource = 'auvo';
  pointAttendancePages = {};
  pointAttendanceFilters = {};
  if (typeof resetPointGlpiHistory === 'function') resetPointGlpiHistory();
  _sidebarOpen = false;

  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  _renderHeader(client, overlay);
  _renderBody(client);
}

function closePointModal() {
  if (!leavePointOperation()) return;
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
  if (tab !== 'history' && !pointPlatformSections[tab]) return;
  if (tab !== currentPlatformTab && !leavePointOperation()) return;
  currentPlatformTab = tab;
  if (tab !== 'history' && !pointPlatformSections[tab].includes(currentPointTab)) currentPointTab = 'general';
  const client = _getCurrentClient();
  if (!client) return;
  _renderBody(client);
}

function changePointTab(tab) {
  if (!pointPlatformSections[currentPlatformTab]?.includes(tab)) return;
  if (tab !== currentPointTab && !leavePointOperation()) return;
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
  if (client.divergences?.enabled) return client.divergences.platforms?.[platform]?.count || 0;
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

function _normalizedTagSet(tags = []) {
  return new Set((tags || []).map(tag => tag.normalizedLabel || tag.label).filter(Boolean));
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
  const client = _getCurrentClient();
  const entityId = client?.entityId || client?.hubId || client?.clientId;
  if (!entityId) return;

  const related = _normalizedTagSet(client.operationalTags || []);
  const availableTags = (client.operationalTagDefinitions || [])
    .filter(tag => !related.has(tag.normalizedLabel || tag.label));

  if (availableTags.length === 0) {
    alert("Nao ha tags operacionais disponiveis para vincular.");
    return;
  }

  const dialog = await openHubOperationalTagSelectDialog(availableTags);
  if (!dialog.confirmed || !dialog.tagId) return;

  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`/api/hub/entities/${encodeURIComponent(entityId)}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        tagId: dialog.tagId,
        addToHistory: true,
        comment: dialog.comment
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);

    await refreshCurrentHubClientAfterTagChange();
  } catch (error) {
    alert(`Falha ao vincular tag operacional: ${error.message}`);
  }
}

async function addManualPhysicalStatusChange() {
  const client = _getCurrentClient();
  const entityId = client?.entityId || client?.hubId || client?.clientId;
  if (!entityId) return;

  const dialog = await openManualPhysicalStatusDialog(client.pointStatus?.currentStatus || "N/A");
  if (!dialog.confirmed || !dialog.toStatus) return;

  const { toStatus, referenceUrl, comment } = dialog;

  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`/api/hub/entities/${encodeURIComponent(entityId)}/physical-status/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        fromStatus: client.pointStatus?.currentStatus || "N/A",
        toStatus,
        referenceUrl,
        comment
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);

    await refreshCurrentHubClientAfterTagChange();
  } catch (error) {
    alert(`Falha ao registrar status manual: ${error.message}`);
  }
}

function openHubOperationalTagSelectDialog(tags = []) {
  return new Promise(resolve => {
    const existing = document.getElementById("pmOperationalTagDialog");
    existing?.remove();

    const overlay = document.createElement("div");
    overlay.id = "pmOperationalTagDialog";
    overlay.className = "pm-tag-dialog-overlay active";
    overlay.innerHTML = `
      <div class="pm-tag-dialog">
        <div class="pm-tag-dialog-head">
          <strong>Vincular tag operacional</strong>
          <button type="button" onclick="closeHubOperationalTagSelectDialog(false)">x</button>
        </div>
        <div class="pm-tag-dialog-body">
          <select id="pmTagSelect" class="pm-op-tag-input">
            ${tags.map(tag => `<option value="${Number(tag.tagId)}">${_escapeHtml(tag.label)}</option>`).join("")}
          </select>
          <textarea id="pmTagDialogComment" class="pm-tag-dialog-comment" placeholder="Observacao"></textarea>
        </div>
        <div class="pm-tag-dialog-foot">
          <button type="button" class="pm-match-secondary" onclick="closeHubOperationalTagSelectDialog(false)">Cancelar</button>
          <button type="button" class="pm-match-primary" onclick="closeHubOperationalTagSelectDialog(true)">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    window.__pmTagDialogResolve = resolve;
  });
}

function closeHubOperationalTagSelectDialog(confirmed) {
  const overlay = document.getElementById("pmOperationalTagDialog");
  const resolve = window.__pmTagDialogResolve;
  const result = confirmed ? {
    confirmed: true,
    tagId: Number(document.getElementById("pmTagSelect")?.value || 0),
    comment: document.getElementById("pmTagDialogComment")?.value?.trim() || ""
  } : { confirmed: false };
  overlay?.remove();
  window.__pmTagDialogResolve = null;
  resolve?.(result);
}

function openManualPhysicalStatusDialog(currentStatus = "N/A") {
  return new Promise(resolve => {
    const existing = document.getElementById("pmManualPhysicalStatusDialog");
    existing?.remove();

    const overlay = document.createElement("div");
    overlay.id = "pmManualPhysicalStatusDialog";
    overlay.className = "pm-tag-dialog-overlay active";
    overlay.innerHTML = `
      <div class="pm-tag-dialog">
        <div class="pm-tag-dialog-head">
          <strong>Alteracao manual de status</strong>
          <button type="button" onclick="closeManualPhysicalStatusDialog(false)">x</button>
        </div>
        <div class="pm-tag-dialog-body">
          <div class="pm-tag-dialog-label">Status atual: ${_escapeHtml(currentStatus)}</div>
          <select id="pmManualPhysicalStatus" class="pm-op-tag-input">
            <option value="">Selecionar status</option>
            <option value="NOVO">NOVO</option>
            <option value="VISTORIADO">VISTORIADO</option>
            <option value="INSTALADO">INSTALADO</option>
            <option value="REINSTALADO">REINSTALADO</option>
            <option value="REMANEJADO">REMANEJADO</option>
            <option value="DESINSTALADO">DESINSTALADO</option>
          </select>
          <input id="pmManualPhysicalLink" class="pm-op-tag-input" type="url" placeholder="Link relacionado">
          <textarea id="pmManualPhysicalComment" class="pm-tag-dialog-comment" placeholder="Observacao"></textarea>
        </div>
        <div class="pm-tag-dialog-foot">
          <button type="button" class="pm-match-secondary" onclick="closeManualPhysicalStatusDialog(false)">Cancelar</button>
          <button type="button" class="pm-match-primary" onclick="closeManualPhysicalStatusDialog(true)">Salvar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    window.__pmManualStatusDialogResolve = resolve;
  });
}

function closeManualPhysicalStatusDialog(confirmed) {
  const overlay = document.getElementById("pmManualPhysicalStatusDialog");
  const resolve = window.__pmManualStatusDialogResolve;
  const result = confirmed ? {
    confirmed: true,
    toStatus: document.getElementById("pmManualPhysicalStatus")?.value || "",
    referenceUrl: document.getElementById("pmManualPhysicalLink")?.value?.trim() || "",
    comment: document.getElementById("pmManualPhysicalComment")?.value?.trim() || ""
  } : { confirmed: false };
  overlay?.remove();
  window.__pmManualStatusDialogResolve = null;
  resolve?.(result);
}

async function openRelatedHubEntity(entityId) {
  if (!entityId || typeof fetchHubEntityDetails !== "function" || typeof mapHubEntityDetailsToModalClient !== "function") return;

  try {
    const currentClient = _getCurrentClient();
    const details = await fetchHubEntityDetails(entityId);
    const nextClient = mapHubEntityDetailsToModalClient(details, currentClient);
    window.__currentPointModalClient = nextClient;
    currentPlatformTab = "hub";
    currentPointTab = "status";
    _renderHeader(nextClient, document.getElementById("pointModalOverlay"));
    _renderBody(nextClient);
  } catch (error) {
    alert(`Falha ao abrir ponto novo: ${error.message}`);
  }
}

async function removeHubOperationalTag(tagId) {
  const currentClient = _getCurrentClient();
  const entityId = currentClient?.entityId || currentClient?.hubId || currentClient?.clientId;
  const label = (currentClient?.operationalTags || []).find(tag => Number(tag.tagId) === Number(tagId))?.label || `Tag ${tagId}`;
  if (!entityId) return;
  const dialog = await openHubOperationalTagDialog("remove", label);
  if (!dialog.confirmed) return;

  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`/api/hub/entities/${encodeURIComponent(entityId)}/tags/${encodeURIComponent(tagId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        addToHistory: true,
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
    <div class="pm-header-left">
      <div class="pm-breadcrumb">Clientes / Pontos &nbsp; / &nbsp; Ficha do ponto</div>
      <div class="pm-title-row"><h2 class="pm-title" title="${_escapeHtml(fullName)}">${_escapeHtml(fullName)}</h2></div>
      <div class="pm-meta-row"><span class="pm-meta-item">${_escapeHtml(client.city || 'Município não informado')} / ${_escapeHtml(client.state || 'N/A')}</span><span class="pm-meta-item">${_escapeHtml(client.cicom || client.unit || 'Unidade não informada')}</span></div>
      <div class="pm-source-ids" aria-label="Identificadores por plataforma">
        <span>HUB <strong>${_escapeHtml(hubId)}</strong></span>
        <span>AUVO <strong>${_escapeHtml(client.platformLinks?.auvo?.customerId ?? 'Não vinculado')}</strong></span>
        <span>GLPI <strong>${_escapeHtml(client.platformLinks?.glpi?.deviceId ?? 'Não vinculado')}</strong></span>
      </div>
    </div>
    <div class="pm-header-right"><button type="button" class="point-btn-auvo" disabled>+ Nova tarefa AUVO · Em breve</button></div>
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
      ${_platformTab("spreadsheet", "Planilha base", pmIcons.glpi, 0)}
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

            <p class="pm-attendance-message">Consulte as fontes e os vínculos do ponto. Monitoramento Zabbix ainda não disponível.</p>
            ${_sidebarActions()}
          </div>
        </div>
      </div>

      <!-- Card de conteúdo da sub-aba -->
      <div class="pm-info-card">
        <div class="pm-info-card-header">
          <div>
            <div class="pm-info-card-title">${pointPlatformLabels[currentPlatformTab]}</div>
            ${renderPlatformSyncTime(client)}
            <div class="pm-info-card-subtitle">${currentPlatformTab === 'hub' ? 'Informações consolidadas do ponto.' : currentPlatformTab === 'spreadsheet' ? (client.platformFields?.spreadsheet?.importedSections ? 'Dados importados da planilha base. Campos vazios permanecem N/A.' : 'Dados da planilha ainda não importados para este ponto.') : currentPlatformTab === 'zabbix' ? 'Integração ainda não disponível. Campos sem dados exibem N/A.' : 'Dados disponíveis nesta fonte. Campos sem dados exibem N/A.'}</div>
          </div>
        </div>

        <div class="pm-info-card-body">
          ${renderPointOperationBar(client)}
          ${_subTabContent(client)}
        </div>

        <div class="pm-info-card-footer">
          <div class="pm-status-row">
            <span>Status operacional</span>
            <span>N/A</span>
          </div>
          <span class="pm-readonly-label">${pointOperation.mode === "view" ? "Modo de visualização (somente leitura)" : "Alterações aplicadas somente após confirmação"}</span>
        </div>
      </div>

    </div>`;
  if (currentPointTab === 'attendance') loadPointAttendances();
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
  const disabled = !pointPlatformSections[currentPlatformTab]?.includes(id);
  return `<button type="button" class="point-tab ${active}" ${disabled ? 'disabled aria-disabled="true" title="Indisponível nesta fonte"' : `onclick="changePointTab('${id}')"`}>${label}${disabled ? ' <span aria-hidden="true">🔒</span>' : ''}</button>`;
}

/* =========================================================
   SUB-ABA: CONTEÚDO
========================================================= */

function pointClientForSource(client) {
  const fields = client.platformFields?.[currentPlatformTab] || {};
  const networkKeys = ['ip', 'subnet', 'gateway', 'wanIp', 'circuit', 'availabilityDate', 'uptime', 'linkStatus'];
  const statusKeys = ['currentStatus', 'originatedFrom', 'changedTo', 'inspectionDate', 'cameraInstallation',
    'cameraSubstitution', 'uninstallDate', 'remanejadoDate', 'dedicatedPole', 'boxType',
    'boxInstallation', 'boxInstallationDate', 'armInstallation', 'poleStatus'];
  const isHub = currentPlatformTab === 'hub';
  return { ...client, __renderedGeneralFieldKeys: new Set(),
    network: Object.fromEntries(networkKeys.map(key => [key, (isHub ? fields.network?.[key] ?? client.network?.[key] : fields.network?.[key]) ?? 'N/A'])),
    pointStatus: Object.fromEntries(statusKeys.map(key => [key,
      (isHub ? fields.physicalStatus?.[key] ?? client.pointStatus?.[key] : fields.physicalStatus?.[key] ?? (key === 'currentStatus' && currentPlatformTab === 'glpi' ? fields.status : null)) ?? 'N/A'])),
    operationalHistory: isHub ? client.operationalHistory || [] : [],
    operationalTags: isHub ? client.operationalTags || [] : []
  };
}

function pointAttendanceSource() {
  return currentPlatformTab === 'hub' ? currentAttendanceSource : currentPlatformTab;
}

function changeAttendanceSource(source) {
  if (currentPlatformTab !== 'hub' || !['auvo', 'glpi'].includes(source)) return;
  currentAttendanceSource = source;
  _renderBody(_getCurrentClient());
}

function attendanceKey(client, source) {
  return `${_getHubId(client)}:${source}`;
}

function filterPointAttendances(type = '') {
  const client = _getCurrentClient();
  const source = pointAttendanceSource();
  if (!client || !['auvo', 'glpi'].includes(source)) return;
  const key = attendanceKey(client, source);
  pointAttendanceFilters[key] = pointAttendanceFilters[key] === type ? '' : type;
  delete pointAttendancePages[key];
  loadPointAttendances(0);
}

async function loadPointAttendances(offset = null) {
  const client = _getCurrentClient();
  const source = pointAttendanceSource();
  if (!client || currentPointTab !== 'attendance' || !['auvo', 'glpi'].includes(source)) return;
  const key = attendanceKey(client, source);
  if (offset === null && pointAttendancePages[key]) return;
  const state = { loading: true, offset: offset ?? 0, items: [], pagination: { total: 0, limit: 20 } };
  pointAttendancePages[key] = state;
  _renderBody(client);
  try {
    const params = new URLSearchParams({ source, limit: '20', offset: String(state.offset) });
    const selectedType = pointAttendanceFilters[key] || '';
    if (selectedType) params.set('type', selectedType);
    if (source === 'glpi' && typeof fetchPointGlpiHistory === 'function') {
      const history = await fetchPointGlpiHistory(_getHubId(client), state.offset);
      if (history.enabled) {
        Object.assign(state, history, { historyMode: true });
        if (history.refreshNeeded || history.syncing) {
          // Let the cached page render first; refresh continues without blocking it.
          setTimeout(() => refreshPointGlpiHistory(false, client, state), 0);
        }
        return;
      }
    }
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/hub/entities/${encodeURIComponent(_getHubId(client))}/attendances?${params}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {}
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`);
    Object.assign(state, result.data);
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    if (pointAttendancePages[key] === state && _getCurrentClient() === client && currentPointTab === 'attendance' && pointAttendanceSource() === source) _renderBody(client);
  }
}

function safeAttendanceUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? _escapeHtml(url.href) : '';
  } catch { return ''; }
}

function renderPointAttendances(client) {
  const source = pointAttendanceSource();
  const state = pointAttendancePages[attendanceKey(client, source)];
  if (source === 'glpi' && state?.historyMode && typeof renderPointGlpiHistory === 'function') {
    return renderPointGlpiHistory(client, state);
  }
  const tabs = currentPlatformTab === 'hub' ? `<div class="pm-attendance-tabs" role="group" aria-label="Fonte dos atendimentos">
    ${['auvo', 'glpi'].map(id => `<button type="button" class="point-tab ${source === id ? 'active' : ''}" aria-pressed="${source === id}" onclick="changeAttendanceSource('${id}')">${id.toUpperCase()}</button>`).join('')}
  </div>` : '';
  let content;
  if (!state || state.loading) content = '<p class="pm-attendance-message" role="status">Carregando atendimentos...</p>';
  else if (state.error) content = `<p class="pm-attendance-message" role="alert">Não foi possível carregar os atendimentos: ${_escapeHtml(state.error)}</p><button type="button" class="pm-match-secondary" onclick="loadPointAttendances(${state.offset})">Tentar novamente</button>`;
  else {
    const { total, limit, hasMore } = state.pagination;
    const sourceLabel = state.sourceId ? (source === 'auvo' ? `Cliente AUVO ${state.sourceId}` : `Localização GLPI ${state.sourceId} do dispositivo vinculado`) : state.unavailableReason || 'Nenhum vínculo disponível para consultar esta fonte.';
    const summary = state.summary || { total, byType: [] };
    const counts = state.sourceId ? `<div class="pm-attendance-counts" aria-label="Contagem geral de atendimentos ${source.toUpperCase()}">
      <button type="button" class="pm-attendance-count pm-attendance-count-total ${state.selectedType ? '' : 'active'}" onclick="filterPointAttendances('')" aria-pressed="${!state.selectedType}"><span>Total de ${source === 'auvo' ? 'tarefas AUVO' : 'chamados GLPI'}</span><strong>${_escapeHtml(summary.total)}</strong></button>
      ${(summary.byType || []).map(group => `<button type="button" class="pm-attendance-count ${state.selectedType === group.type ? 'active' : ''}" data-attendance-type="${_escapeHtml(group.type)}" aria-pressed="${state.selectedType === group.type}"><span>${_escapeHtml(group.type)}</span><strong>${_escapeHtml(group.total)}</strong></button>`).join('')}
    </div>` : '';
    content = `${counts}<p class="pm-attendance-message">${_escapeHtml(sourceLabel)} · Histórico sincronizado no HUB.</p>
      <div class="pm-attendance-list">
        ${state.items.length ? state.items.map(item => {
          const url = safeAttendanceUrl(item.url);
          return `<details class="pm-attendance-item">
            <summary><span class="pm-attendance-id">#${_escapeHtml(item.id)}</span><span class="pm-attendance-title">${_escapeHtml(item.title || 'N/A')}</span><span class="pm-attendance-status">${_escapeHtml(item.status || 'N/A')}</span><time>${_escapeHtml(_formatDateTime(item.date))}</time></summary>
            <div class="pm-attendance-detail">
              ${_field('Responsável', item.responsible || 'N/A')}
              ${source === 'auvo' ? _field('Orientação', item.orientation || 'N/A') + _field('Relatório', item.report || 'N/A') : _field('Tipo', item.type || 'N/A') + _field('Descrição', item.description || 'N/A')}
              ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Abrir ${source === 'auvo' ? 'tarefa no AUVO' : 'chamado no GLPI'}</a>` : ''}
            </div>
          </details>`;
        }).join('') : state.sourceId ? '<p class="pm-attendance-message">Nenhum atendimento encontrado para este cadastro.</p>' : ''}
      </div>
      <div class="pm-attendance-pagination">
        <span>${state.selectedType ? `${_escapeHtml(state.selectedType)} · ` : ''}${total ? state.offset + 1 : 0}–${Math.min(state.offset + state.items.length, total)} de ${total} ${source === 'auvo' ? 'tarefas' : 'chamados'}</span>
        <div><button type="button" class="pm-match-secondary" onclick="loadPointAttendances(${Math.max(0, state.offset - limit)})" ${state.offset === 0 ? 'disabled' : ''}>Anterior</button>
        <button type="button" class="pm-match-secondary" onclick="loadPointAttendances(${state.offset + limit})" ${hasMore ? '' : 'disabled'}>Próxima</button></div>
      </div>`;
  }
  setTimeout(() => document.querySelectorAll('.pm-attendance-count[data-attendance-type]').forEach(button => {
    button.addEventListener('click', () => filterPointAttendances(button.dataset.attendanceType || ''));
  }), 0);
  return `<section class="pm-attendances"><h3>Atendimentos</h3>${tabs}${content}</section>`;
}

function _subTabContent(client) {
  const imported = client.platformFields?.[currentPlatformTab]?.importedSections?.[currentPointTab];
  if (currentPlatformTab === 'spreadsheet' && imported) {
    return '<section class="pm-fields-grid">'+imported.map(item => _field(item.label, item.value ?? 'N/A')).join('')+'</section>';
  }

  // Keep every field in its own source; unavailable values remain visible as N/A.
  client = pointClientForSource(client);
  /* ── INFORMAÇÕES GERAIS ── */
  if (currentPointTab === "general") {
    const fields = client.platformFields?.[currentPlatformTab] || {};
    const value = key => fields[key] ?? 'N/A';
    const id = currentPlatformTab === 'hub' ? _formatHubId(client) : value('id');
    const latitude = Number(fields.latitude);
    const longitude = Number(fields.longitude);
    const hasCoordinates = fields.latitude !== null && fields.latitude !== undefined && String(fields.latitude).trim() !== '' && fields.longitude !== null && fields.longitude !== undefined && String(fields.longitude).trim() !== '' && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    const optionalFields = [['Endereço', 'address'], ['Tipo', 'deviceType'], ['Localização', 'locationName'], ['Município', 'city'], ['CICOM', 'cicom'], ['Unidade', 'unit'], ['Técnico de campo', 'fieldTechnician'], ['Técnico NOC', 'nocTechnician'], ['Projeto', 'project']].filter(([, key]) => !(currentPlatformTab === 'glpi' && ['deviceType','cicom'].includes(key))).filter(([, key]) => (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') || pilotFieldDifferences(client,key).length);
    return `
      <div class="pm-general-layout">
        <section><h3 class="pm-section-heading">Identificação e localização</h3>
          <div class="pm-fields-grid pm-general-fields"><div>
            ${_field('Nome do ativo', value('name'), null, value('name'), client, 'name')}
            ${_field('ID do ativo', id, null, null, client, 'id')}
            ${optionalFields.map(([label, key]) => _field(label, value(key), null, null, client, key)).join('')}
            ${importedHubExtras(client,'general',['name','latitude','longitude','city','cicom','unit','deviceType'])}
          </div><div>
            ${_field('Latitude', value('latitude'), null, null, client, 'latitude')}
            ${_field('Longitude', value('longitude'), null, null, client, 'longitude')}
          </div></div>
        </section>
        <section class="pm-location-section"><h3 class="pm-section-heading">Localização do ponto</h3>
          <div class="pm-location-preview"><div>${pmIcons.pin}<strong>${hasCoordinates ? 'Coordenadas disponíveis' : 'Localização não informada'}</strong><span>${hasCoordinates ? `${_escapeHtml(fields.latitude)}, ${_escapeHtml(fields.longitude)}` : 'Esta fonte não possui coordenadas válidas.'}</span>${hasCoordinates ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(latitude + ',' + longitude)}" target="_blank" rel="noopener noreferrer">Abrir no mapa ↗</a>` : ''}</div></div>
          <p class="pm-location-note">Fonte selecionada: ${pointPlatformLabels[currentPlatformTab]}. O mapa é aberto somente ao clicar.</p>
        </section>
      </div>`;
  }
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
            ${importedHubExtras(client,"network",["ip","subnet","gateway","circuit","availabilityDate"])}
          </div>
        </div>
        <!-- CMD: 1/3 direita -->

        <div class="pm-network-unavailable">
          ${pmIcons.ping}
          <strong>Sem monitoramento</strong>
          <div class="pm-network-track"></div>
          <span>Integração Zabbix · Em breve</span>
          <small>Disponibilidade e uptime ainda não medidos.</small>
          <div class="pm-future-actions"><button type="button" disabled>Ping · Em breve</button><button type="button" disabled>Tracert · Em breve</button></div>
        </div>      </div>`;
  }

  /* ── ESTADO DO PONTO ── */
  if (currentPointTab === "status") {
    const relatedTags = client.operationalTags || [];
    const relatedTagsHtml = relatedTags.length
      ? relatedTags.map(tag => `
          <span class="pm-op-tag ${tag.source === "manual" ? "" : "muted"}">
            ${_escapeHtml(tag.label)}
            ${tag.source === "manual" && tag.tagId ? `<button type="button" onclick="removeHubOperationalTag(${Number(tag.tagId)})" aria-label="Remover tag ${_escapeHtml(tag.label)}">x</button>` : ""}
          </span>
        `).join("")
      : `<span class="pm-op-tag empty">Sem tags relacionadas</span>`;

    return `
      <div class="pm-split-layout">
        <div class="pm-fields-grid">
          <div>
            ${_field("Status fisico atual",    client.pointStatus.currentStatus)}
            ${_field("Originado de",           client.pointStatus.originatedFrom)}
            ${_field("Alterado para",          client.pointStatus.changedTo)}
            ${_field("Data da vistoria",       client.pointStatus.inspectionDate)}
            ${_field("Instalacao da camera",   client.pointStatus.cameraInstallation)}
            ${_field("Substatus Camera",       client.pointStatus.cameraSubstitution)}
            ${_field("Data Desinstalacao",     client.pointStatus.uninstallDate)}
            ${_field("Data Remanejamento",     client.pointStatus.remanejadoDate)}
            ${_field("Poste Dedicado",         client.pointStatus.dedicatedPole)}
          </div>
          <div>
            ${_field("Tipo de Caixa",          client.pointStatus.boxType)}
            ${_field("Instalacao de caixa",    client.pointStatus.boxInstallation)}
            ${_field("Data Instalacao Caixa",  client.pointStatus.boxInstallationDate)}
            ${_field("Instalacao de Braco",    client.pointStatus.armInstallation)}
            ${_field("Estado do poste",        client.pointStatus.poleStatus)}
            ${importedHubExtras(client,"status",["inspectionDate","cameraInstallation","cameraSubstitution","uninstallDate","dedicatedPole","boxType","boxInstallation","boxInstallationDate","armInstallation","poleStatus"])}
          </div>
        </div>

        <div class="pm-split-history">
          <div class="pm-split-history-header">
            <span class="pm-split-history-title">Historico de Status Fisico</span>
            <div class="pm-split-history-actions">
              <span class="pm-split-history-count">${(client.operationalHistory || []).length} registros</span>
              ${currentPlatformTab === 'hub' ? '<button type="button" class="pm-icon-action" onclick="addManualPhysicalStatusChange()" title="Adicionar alteracao manual de status" aria-label="Adicionar alteracao manual de status">+</button>' : ''}
            </div>
          </div>
          <div class="pm-split-history-list">
            ${!(client.operationalHistory || []).length ? '<p class="pm-attendance-message">Nenhum histórico físico disponível nesta fonte.</p>' : ''}
            ${(client.operationalHistory || []).map(item => `
              <div class="pm-split-history-item">
                <div class="pm-split-history-item-title">${_escapeHtml(item.title || "Evento fisico")}</div>
                <div class="pm-split-history-item-row">
                  <div class="pm-split-history-kv">
                    <span class="pm-split-kv-key">DE</span>
                    <span class="pm-split-kv-val">${_escapeHtml(item.from || "N/A")}</span>
                  </div>
                  <div class="pm-split-history-arrow">-&gt;</div>
                  <div class="pm-split-history-kv">
                    <span class="pm-split-kv-key">PARA</span>
                    <span class="pm-split-kv-val">${_escapeHtml(item.to || "N/A")}</span>
                  </div>
                </div>
                <div class="pm-split-history-date">
                  ${_escapeHtml(_formatDateTime(item.date || item.at))}
                  ${item.linkUrl ? `<a href="${_escapeHtml(item.linkUrl)}" target="_blank" rel="noopener noreferrer">Abrir tarefa AUVO</a>` : ""}
                  ${item.relatedEntityId ? `<button type="button" onclick="openRelatedHubEntity(${Number(item.relatedEntityId)})">${item.relationType === "originated_from" ? "Abrir ponto de origem" : "Abrir ponto novo"}</button>` : ""}
                </div>
              </div>`).join("")}
          </div>
          <div class="pm-op-tags-compact" ${currentPlatformTab !== 'hub' ? 'hidden' : ''}>
            <div class="pm-op-tags-compact-head">
              <span>Tags operacionais</span>
              <button type="button" class="pm-icon-action" onclick="addHubOperationalTag()" title="Vincular tag operacional" aria-label="Vincular tag operacional">+</button>
            </div>
            <div class="pm-op-tags-list">${relatedTagsHtml}</div>
          </div>
        </div>
      </div>`;
  }
  if (currentPointTab === "attendance") {
    return renderPointAttendances(client);
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
        ${renderPointOperationMenu(client)}
        <button class="pm-action-btn cyan" onclick="requestHubSync('auvo')" ${canSyncFromAuvo && !client.divergences?.enabled ? "" : "disabled"}>${pmIcons.refresh} <span>${client.divergences?.enabled ? "Aplicar valores ao HUB · Em breve" : "Sincronizar HUB com AUVO"}</span></button>
        <button class="pm-action-btn cyan" onclick="openHubGlpiMatchModal('both')" ${canReviewGlpi ? "" : "disabled"}>${pmIcons.glpi} <span>Revisar associacao GLPI</span></button>
        <button class="pm-action-btn orange" disabled>${pmIcons.warn} <span>Resolver divergências · Em breve</span></button>
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
  if (value === undefined || value === null || value === "") value = 'N/A';
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
  const fullValueTitle = title || (fieldKey === "address" ? value : null);
  const titleAttr = fullValueTitle ? ` title="${_escapeHtml(fullValueTitle)}"` : "";
  const relationHTML = client && fieldKey ? _relationHint(client, fieldKey) : "";
  const operation = pointOperationField(client, fieldKey, label, value);
  return `
    <div class="info-block${operation.className ? " " + operation.className : ""}"${operation.attribute ? " " + operation.attribute : ""}>
      <div class="info-label">${operation.checkbox}${label}${relationHTML}</div>
      <div class="info-value-wrapper">
        ${operation.input || `<span class="info-value"${titleAttr}>${_escapeHtml(value ?? "N/A")}</span>`}
        ${badgeHTML}${pointOperation.mode === "edit" ? "" : renderFieldDivergence(client, fieldKey)}${operation.comparison}
      </div>
    </div>`;
}

/* Alias para compatibilidade com código legado */
function infoBlock(label, value, divergence = null) {
  return _field(label, value, divergence);
}

function importedHubExtras(client, section, displayed) {
 if(currentPlatformTab !== 'hub') return '';
 const entries=client.platformFields?.hub?.importedSections?.[section] || [];
 return entries.filter(item=>item.value!==null && item.value!==undefined && !displayed.includes(item.key)).map(item=>_field(item.label,item.value)).join('');
}

function pilotFieldDifferences(client, fieldKey) {
 if (!client?.divergences?.enabled || !fieldKey) return [];
 const keys = ['auvo','glpi'].includes(currentPlatformTab) ? [currentPlatformTab] : [];
 return keys.flatMap(platform => (client.divergences.platforms?.[platform]?.items || [])
  .filter(item => item.fieldKey === fieldKey).map(item => ({...item,platform})));
}
function renderFieldDivergence(client, fieldKey) {
 const differences=pilotFieldDifferences(client,fieldKey);
 if (!differences.length) return '';
 const description=differences.map(item=>'HUB: '+(item.hubValue ?? 'N/A')+' | '+item.platform.toUpperCase()+': '+(item.sourceValue ?? 'N/A')).join('\n');
 return '<span class="pm-field-difference" role="button" onclick="startPointOperation(\'sync\',\''+fieldKey+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();startPointOperation(\'sync\',\''+fieldKey+'\')}" tabindex="0" aria-label="'+_escapeHtml('Divergência. '+description)+'"><span aria-hidden="true">!</span><span class="pm-field-difference-tooltip" role="tooltip">'+_escapeHtml(description)+'</span></span>';
}
function renderPlatformSyncTime(client) {
 const source=client.divergences?.platforms?.[currentPlatformTab];
 const record=currentPlatformTab==='auvo' ? client.sources?.auvo?.customer : currentPlatformTab==='glpi' ? client.sources?.glpi?.device : null;
 if (!['auvo','glpi'].includes(currentPlatformTab)) return '';
 const time=source?.lastSyncAt || record?.lastSyncAt;
 return '<div class="pm-platform-sync-time">Última sincronização: '+_escapeHtml(time ? _formatDateTime(time) : 'Não informada')+'</div>';
}

// Stage 1: local presentation only. These drafts never update source records.
let pointOperation = {mode:'view',direction:'out',draft:{},selected:new Set(),destinations:new Set()};
const pointEditableFields = new Set(['address','name','latitude','longitude','city','cicom','unit','fieldTechnician','nocTechnician','deviceType','locationName','project']);
function resetPointOperation() { closePointReview(); pointOperation={mode:'view',direction:'out',draft:{},selected:new Set(),destinations:new Set()}; }
function canPreviewPointOperation(client) {
 return Number(_getHubId(client || {}))===12130 && !!localStorage.getItem('authToken');
}
function leavePointOperation() {
 if(pointOperation.mode!=='view' && !confirm('Descartar a edição ou seleção atual?')) return false;
 resetPointOperation();return true;
}
function startPointOperation(mode,fieldKey=null) {
 const client=_getCurrentClient();
 if(!canPreviewPointOperation(client))return;
 if(mode==='edit' && currentPlatformTab!=='hub')return;
 if(mode==='sync' && !['auvo','glpi'].includes(currentPlatformTab))return;
 if(pointOperation.mode!==mode) {
  resetPointOperation();pointOperation.mode=mode;
  pointOperation.draft={...(client.platformFields?.hub || {})};
 }
 currentPointTab='general';_sidebarOpen=false;
 if(fieldKey && eligiblePointFields(client).includes(fieldKey))pointOperation.selected.add(fieldKey);
 _renderBody(client);
}
function cancelPointOperation() {resetPointOperation();const client=_getCurrentClient();if(client)_renderBody(client);}
function pointSyncEndpoints() {
 const external=currentPlatformTab;
 return pointOperation.direction==='out' ? {origin:'hub',target:external} : {origin:external,target:'hub'};
}
function pointFieldEligibility(client,item) {
 if(!canPreviewPointOperation(client)||!['auvo','glpi'].includes(currentPlatformTab))return {eligible:false,reason:'Operação indisponível'};
 const {origin,target}=pointSyncEndpoints();
 if(!client.platformFields?.[currentPlatformTab]?.id)return {eligible:false,reason:'Plataforma sem cadastro correlacionado'};
 const key=item.fieldKey,value=origin==='hub'?item.hubValue:item.sourceValue;
 if(target!=='hub')return pointOutgoingCompatibility(client,key,value,target);
 if(!pointEditableFields.has(key))return {eligible:false,reason:'Identificador ou campo somente leitura'};
 if(value==null||['','N/A','NA','NÃO INFORMADO','NAO INFORMADO'].includes(String(value).trim().toUpperCase()))return {eligible:false,reason:'Origem sem valor válido'};
 if(['latitude','longitude'].includes(key)) {
  const number=Number(String(value).trim().replace(',', '.'));
  if(!Number.isFinite(number)||Math.abs(number)>(key==='latitude'?90:180))return {eligible:false,reason:'Coordenada inválida na origem'};
 }
 // Only semantically established mappings are offered in this preview.
 const incoming=['name','latitude','longitude','address'];
 const outgoing=currentPlatformTab==='auvo' ? ['name','latitude','longitude','address'] : ['name','address'];
 if(!(target==='hub'?incoming:outgoing).includes(key))return {eligible:false,reason:currentPlatformTab==='glpi'&&['latitude','longitude'].includes(key)?'Coordenadas pertencem à localização GLPI; escrita depende de validação própria':'Campo sem mapeamento de escrita compatível no destino'};
 if(client.previewWriteFields?.[target] && !client.previewWriteFields[target].includes(key))return {eligible:false,reason:'Campo indisponível para o destino'};
 return {eligible:true,reason:''};
}
function eligiblePointFields(client) {
 return (client?.divergences?.platforms?.[currentPlatformTab]?.items || [])
  .filter(item=>pointFieldEligibility(client,item).eligible).map(item=>item.fieldKey);
}
function flipPointSyncDirection() {
 const client=_getCurrentClient();
 if(pointOperation.mode!=='sync'||!canPreviewPointOperation(client))return;
 pointOperation.direction=pointOperation.direction==='in'?'out':'in';
 const valid=new Set(eligiblePointFields(client));
 pointOperation.selected=new Set([...pointOperation.selected].filter(key=>valid.has(key)));
 _renderBody(client);
}

function togglePointField(key) {
 const client=_getCurrentClient();if(pointOperation.mode!=='sync'||!eligiblePointFields(client).includes(key))return;
 if(pointOperation.selected.has(key))pointOperation.selected.delete(key);else pointOperation.selected.add(key);
 _renderBody(client);
}
function toggleAllPointFields() {
 const keys=eligiblePointFields(_getCurrentClient());
 pointOperation.selected=new Set(keys.every(key=>pointOperation.selected.has(key)) ? [] : keys);
 _renderBody(_getCurrentClient());
}
function pointChangedFields() {
 const base=_getCurrentClient()?.platformFields?.hub || {};
 return Object.keys(pointOperation.draft).filter(key=>pointEditableFields.has(key) && !pointValuesEqual(key,pointOperation.draft[key],base[key]));
}
function updatePointDraft(key,value) {
 if(pointOperation.mode!=='edit'||!pointEditableFields.has(key))return;
 pointOperation.draft[key]=value;
 reconcilePointPropagation(_getCurrentClient());
 document.getElementById('pm-operation-field-'+key)?.classList.toggle('pm-operation-selected',pointChangedFields().includes(key));
 const count=document.getElementById('pm-operation-count');if(count)count.textContent=pointChangedFields().length+' campos modificados';
 const propagation=document.getElementById('pm-point-propagation');if(propagation)propagation.innerHTML=pointPropagationContent(_getCurrentClient());
 const reviewButton=document.getElementById('pm-operation-review-button');if(reviewButton)reviewButton.disabled=!canReviewPointOperation(_getCurrentClient());
}
function renderPointOperationMenu(client) {
 if(Number(_getHubId(client || {}))!==12130)return '';
 const unavailable=canPreviewPointOperation(client)?'':'disabled title="Entre novamente no Data Hub para editar informações" ';
 if(currentPlatformTab==='hub')return '<button type="button" class="pm-action-btn cyan" '+unavailable+'onclick="startPointOperation(\'edit\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 16-1 5 5-1L20 8l-4-4Z"/><path d="m14 6 4 4"/></svg><span>Editar informações</span></button>';
 if(['auvo','glpi'].includes(currentPlatformTab))return '<button type="button" class="pm-action-btn cyan" '+unavailable+'onclick="startPointOperation(\'sync\')"><span aria-hidden="true">⇄</span><span>Sincronizar campos</span></button>';
 return '';
}

function renderPointOperationBar(client) {
 if(pointOperation.mode==='view')return '';
 let controls='<small>Edite os campos diretamente na ficha. Identificadores permanecem somente leitura.</small>';
 if(pointOperation.mode==='sync') {
  const keys=eligiblePointFields(client),route=pointSyncEndpoints();
  controls='<div class="pm-sync-direction"><div class="pm-sync-endpoint"><small>Origem</small><strong>'+pointPlatformLabels[route.origin]+'</strong></div><button type="button" class="pm-sync-flip" onclick="flipPointSyncDirection()" aria-label="Inverter origem e destino" title="Inverter direção"><span aria-hidden="true">⇄</span></button><div class="pm-sync-endpoint"><small>Destino</small><strong>'+pointPlatformLabels[route.target]+'</strong></div><small>Selecione os campos diretamente na ficha.</small><label class="pm-sync-all"><input type="checkbox" '+(keys.length&&keys.every(key=>pointOperation.selected.has(key))?'checked ':'')+(!keys.length?'disabled ':'')+'onchange="toggleAllPointFields()"> Todos divergentes</label></div>';
 }
 return '<div class="pm-operation-bar"><div class="pm-operation-bar-title"><strong>'+(pointOperation.mode==='edit'?'Edição de informações':'Sincronização de informações')+'</strong></div><p>Revise as alterações antes de confirmar.</p>'+controls+(pointOperation.mode==='edit'?renderPointPropagation(client):'')+renderPointOperationFooter()+'</div>';
}

function renderPointOperationFooter() {
 if(pointOperation.mode==='view')return '';
 const edit=pointOperation.mode==='edit';
 const canReview=canReviewPointOperation(_getCurrentClient());
 return '<div class="pm-operation-footer"><span id="pm-operation-count">'+(edit?pointChangedFields().length+' campos modificados':pointOperation.selected.size+' campos selecionados')+'</span><div><button type="button" class="pm-match-secondary" onclick="cancelPointOperation()">Cancelar</button><button type="button" id="pm-operation-review-button" class="pm-match-primary" '+(!canReview?'disabled ':'')+'onclick="openPointReview()" title="Revisar valores antes da confirmação">'+(edit?'Salvar alterações':'Sincronizar')+'</button></div></div>';
}
function pointOperationField(client,key,label,value) {
 const result={className:'',attribute:'',checkbox:'',input:'',comparison:''};
 if(!canPreviewPointOperation(client)||!key||pointOperation.mode==='view')return result;
 if(pointOperation.mode==='edit'&&currentPlatformTab==='hub'&&pointEditableFields.has(key)) {
  result.attribute='id="pm-operation-field-'+key+'"';
  result.className=pointChangedFields().includes(key)?'pm-operation-selected':'';
  const coordinate=['latitude','longitude'].includes(key);
  result.input='<input class="pm-operation-input" aria-label="'+_escapeHtml(label)+'" type="'+(coordinate?'number':'text')+'" '+(coordinate?'step="any" min="'+(key==='latitude'?-90:-180)+'" max="'+(key==='latitude'?90:180)+'" ':'')+'value="'+_escapeHtml(pointOperation.draft[key] ?? '')+'" oninput="updatePointDraft(\''+key+'\',this.value)">';
 }
 if(pointOperation.mode==='sync') {
  const item=pilotFieldDifferences(client,key)[0];
  result.className='pm-operation-discreet';
  if(item) {
   const eligibility=pointFieldEligibility(client,item);
   const eligible=eligibility.eligible;
   result.className=pointOperation.selected.has(key)?'pm-operation-selected':'pm-operation-discreet';
   result.checkbox='<input class="pm-operation-check" type="checkbox" aria-label="Selecionar '+_escapeHtml(label)+'" '+(pointOperation.selected.has(key)?'checked ':'')+(!eligible?'disabled title="'+_escapeHtml(eligibility.reason)+'" ':'')+'onchange="togglePointField(\''+key+'\')">';
   const route=pointSyncEndpoints();
   const next=route.origin==='hub'?item.hubValue:item.sourceValue;
   result.comparison='<div class="pm-operation-comparison">HUB: '+_escapeHtml(item.hubValue ?? 'N/A')+'<br>Novo valor em '+pointPlatformLabels[route.target]+': '+_escapeHtml(next ?? 'N/A')+(!eligible?'<br><span class="pm-sync-unavailable">'+_escapeHtml(eligibility.reason)+'</span>':'')+'</div>';
  }
 }
 return result;
}

function pointDraftValidation(key,value) {
 if(!pointEditableFields.has(key))return 'Identificador ou campo somente leitura';
 if(value==null||['','N/A','NA','NÃO INFORMADO','NAO INFORMADO'].includes(String(value).trim().toUpperCase()))return 'Informe um valor válido';
 if(['latitude','longitude'].includes(key)) {
  const number=Number(String(value).trim().replace(',', '.'));
  if(!Number.isFinite(number)||Math.abs(number)>(key==='latitude'?90:180))return 'Coordenada fora do intervalo válido';
 }
 return '';
}
function pointOutgoingCompatibility(client,key,value,target) {
 if(!['auvo','glpi'].includes(target)||!client?.platformFields?.[target]?.id)return {eligible:false,reason:'Plataforma sem cadastro correlacionado'};
 const invalid=pointDraftValidation(key,value);if(invalid)return {eligible:false,reason:invalid};
 const mapping=target==='auvo'?{name:'description',latitude:'latitude',longitude:'longitude',address:'address'}:{name:'name',address:'Location.address'};
 if(!mapping[key])return {eligible:false,reason:target==='glpi'&&['latitude','longitude'].includes(key)?'Coordenadas pertencem à localização GLPI; escrita depende de validação própria':'Campo sem mapeamento de escrita compatível no destino'};
 if(client.previewWriteFields?.[target]&&!client.previewWriteFields[target].includes(key))return {eligible:false,reason:'Campo indisponível para o destino'};
 return {eligible:true,reason:'',nativeField:mapping[key]};
}
function pointEditProposal(client) {
 if(pointOperation.mode!=='edit'||!canPreviewPointOperation(client))return [];
 reconcilePointPropagation(client);
 const proposals=[];
 for(const key of pointChangedFields()) {
  const value=pointOperation.draft[key],reason=pointDraftValidation(key,value);
  proposals.push({target:'hub',fieldKey:key,oldValue:client.platformFields?.hub?.[key]??null,newValue:value,eligible:!reason,reason});
  for(const target of pointOperation.destinations) {
   const current=client.platformFields?.[target]?.[key]??null;
   if(pointValuesEqual(key,current,value))continue;
   const rule=pointOutgoingCompatibility(client,key,value,target);
   proposals.push({target,fieldKey:key,oldValue:current,newValue:value,...rule});
  }
 }
 return proposals;
}
function pointPropagationFields(client,target) {
 if(pointOperation.mode!=='edit'||!canPreviewPointOperation(client))return [];
 return pointChangedFields().filter(key=>{
  const value=pointOperation.draft[key];
  return pointOutgoingCompatibility(client,key,value,target).eligible &&
   !pointValuesEqual(key,client.platformFields?.[target]?.[key],value);
 });
}
function reconcilePointPropagation(client) {
 for(const target of pointOperation.destinations) {
  if(!pointPropagationFields(client,target).length)pointOperation.destinations.delete(target);
 }
}
function setPointPropagation(target,checked) {
 const client=_getCurrentClient();
 if(pointOperation.mode!=='edit'||!canPreviewPointOperation(client)||!['auvo','glpi'].includes(target))return;
 if(checked&&pointPropagationFields(client,target).length)pointOperation.destinations.add(target);
 else pointOperation.destinations.delete(target);
 reconcilePointPropagation(client);
 _renderBody(client);
}
function pointPropagationContent(client) {
 reconcilePointPropagation(client);
 const proposals=pointEditProposal(client);
 return '<h3>Propagar alterações para</h3><div class="pm-propagation-targets">'+['auvo','glpi'].map(target=>{
  const linked=!!client.platformFields?.[target]?.id;
  const fields=pointPropagationFields(client,target),available=fields.length>0;
  const description=!linked?'Sem cadastro correlacionado':!available?'Nenhum campo compatível alterado':fields.length+' campo(s) compatível(is)';
  return '<label><input type="checkbox" '+(pointOperation.destinations.has(target)?'checked ':'')+(!available?'disabled ':'')+'title="'+_escapeHtml(description)+'" onchange="setPointPropagation(\''+target+'\',this.checked)"> '+pointPlatformLabels[target]+' <small>'+_escapeHtml(description)+'</small></label>';
 }).join('')+'</div><p>'+(pointOperation.destinations.size?'Somente os campos modificados e compatíveis serão propostos para cada plataforma.':'Sem seleção, as alterações serão destinadas somente ao HUB.')+'</p>'+proposals.filter(item=>!item.eligible).map(item=>'<p class="pm-sync-unavailable">'+pointPlatformLabels[item.target]+' · '+_escapeHtml(pointEditFieldLabel(item.fieldKey))+': '+_escapeHtml(item.reason)+'</p>').join('');
}

function pointEditFieldLabel(key) {
 return {address:'Endereço',name:'Nome',latitude:'Latitude',longitude:'Longitude',city:'Município',cicom:'CICOM',unit:'Unidade',fieldTechnician:'Técnico de campo',nocTechnician:'Técnico NOC',deviceType:'Tipo',locationName:'Localização',project:'Projeto'}[key]||key;
}
function renderPointPropagation(client) {
 if(pointOperation.mode!=='edit'||currentPlatformTab!=='hub'||!canPreviewPointOperation(client))return '';
 return '<section class="pm-point-propagation" id="pm-point-propagation">'+pointPropagationContent(client)+'</section>';
}

function pointValuesEqual(key,left,right) {
 if(['latitude','longitude'].includes(key)&&left!=null&&right!=null&&String(left).trim()!==''&&String(right).trim()!=='') {
  const a=Number(String(left).trim().replace(',','.')),b=Number(String(right).trim().replace(',','.'));
  if(Number.isFinite(a)&&Number.isFinite(b))return a===b;
 }
 return String(left??'').trim()===String(right??'').trim();
}

// Stage 4: confirmation review. Execution remains disabled until backend integration.
let pointReviewFocus = null;
function pointReviewPlan(client) {
 if(!canPreviewPointOperation(client)||pointOperation.mode==='view')return {items:[],warnings:[],invalid:true};
 if(pointOperation.mode==='edit') {
  const proposals=pointEditProposal(client);
  return {mode:'edit',entityId:_getHubId(client),origin:'Edição manual do HUB',
   items:proposals.filter(item=>item.eligible),warnings:proposals.filter(item=>!item.eligible),
   invalid:proposals.some(item=>item.target==='hub'&&!item.eligible)};
 }
 const route=pointSyncEndpoints(),all=client.divergences?.platforms?.[currentPlatformTab]?.items||[];
 const items=[],warnings=[];
 for(const key of pointOperation.selected) {
  const item=all.find(candidate=>candidate.fieldKey===key);
  if(!item){warnings.push({target:route.target,fieldKey:key,reason:'Campo não está mais divergente'});continue;}
  const eligibility=pointFieldEligibility(client,item);
  if(!eligibility.eligible){warnings.push({target:route.target,fieldKey:key,reason:eligibility.reason});continue;}
  items.push({target:route.target,fieldKey:key,oldValue:route.target==='hub'?item.hubValue:item.sourceValue,newValue:route.origin==='hub'?item.hubValue:item.sourceValue});
 }
 return {mode:'sync',entityId:_getHubId(client),origin:pointPlatformLabels[route.origin],items,warnings,invalid:warnings.length>0};
}
function canReviewPointOperation(client) {
 const plan=pointReviewPlan(client);
 return !plan.invalid && plan.items.length>0;
}
function renderPointReviewMarkup(plan) {
 const edit=plan.mode==='edit',title=edit?'Confirmar alterações':'Confirmar sincronização';
 const targets=[...new Set(plan.items.map(item=>pointPlatformLabels[item.target]))].join(' + ');
 const warnings=plan.warnings.length?'<div class="pm-review-warning" role="note">Não serão enviados:<ul>'+plan.warnings.map(item=>'<li>'+_escapeHtml(pointPlatformLabels[item.target]+' · '+pointEditFieldLabel(item.fieldKey)+': '+item.reason)+'</li>').join('')+'</ul></div>':'';
 return '<header class="pm-review-head"><h2 id="pm-point-review-title"><span aria-hidden="true">'+(edit?'✎':'⇄')+'</span> '+title+'</h2></header><p>'+plan.items.length+' alteração(ões) de campos serão aplicadas após confirmação.</p><div class="pm-review-route">'+_escapeHtml(plan.origin)+' → '+_escapeHtml(targets)+'</div><div class="pm-review-scroll"><table><thead><tr><th>Campo / destino</th><th>Valor atual</th><th>Novo valor</th></tr></thead><tbody>'+plan.items.map(item=>'<tr><td>'+_escapeHtml(pointEditFieldLabel(item.fieldKey))+'<br><small>'+_escapeHtml(pointPlatformLabels[item.target])+'</small></td><td class="pm-review-old">'+_escapeHtml(item.oldValue??'N/A')+'</td><td class="pm-review-new">'+_escapeHtml(item.newValue??'N/A')+'</td></tr>').join('')+'</tbody></table>'+warnings+'</div><p class="pm-review-history">Esta operação será registrada no histórico de alterações, permitindo consultar e restaurar os valores anteriores, quando permitido.</p><p class="pm-review-warning" id="pm-review-state">Validando a operação antes da confirmação…</p><footer class="pm-review-actions"><button type="button" class="pm-match-secondary" onclick="closePointReview()">Cancelar</button><button type="button" id="pm-review-confirm" class="pm-match-primary" disabled onclick="executePointReview()" title="Confirmar a operação revisada">'+title+'</button></footer>';
}
function openPointReview() {
 const client=_getCurrentClient();
 if(!canReviewPointOperation(client))return;
 const plan=pointReviewPlan(client);
 // A detached display snapshot; it is never treated as authorization or a write payload.
 const snapshot=JSON.parse(JSON.stringify(plan));
 closePointReview();pointReviewFocus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.id='pmPointOperationReview';dialog.className='pm-operation-review';
 dialog.setAttribute('aria-labelledby','pm-point-review-title');dialog.innerHTML=renderPointReviewMarkup(snapshot);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closePointReview();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closePointReview();}});
 document.body.appendChild(dialog);dialog.showModal();
 dialog.querySelector('button:not([disabled])')?.focus();
 pointReviewBackend={dialog,snapshot,client,prepared:null,busy:false};
 preparePointReview(pointReviewBackend);
}
function closePointReview() {
 if(pointReviewBackend?.busy)return;
 pointReviewBackend=null;
 const dialog=document.getElementById('pmPointOperationReview');
 if(dialog){dialog.close();dialog.remove();pointReviewFocus?.focus?.();}
 pointReviewFocus=null;
}

let pointReviewBackend=null;
async function pointOperationApi(entityId,path,body) {
 const response=await fetch('/api/hub/entities/'+entityId+'/operations/'+path,{
  method:body?'POST':'GET',headers:{'Content-Type':'application/json',authorization:'Bearer '+localStorage.getItem('authToken'),'X-Hub-Session':localStorage.getItem('hubOperationSession')||''},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.message||'Operação indisponível.'),{status:response.status});return data;
}
function pointBackendRequest(state) {
 return {mode:state.snapshot.mode,origin:state.snapshot.mode==='edit'?'hub':pointSyncEndpoints().origin,items:state.snapshot.items.map(item=>{
  const old= item.target==='hub' ? state.client.fieldValues?.find(row=>row.sourceSystem==='HUB'&&row.isCanonical&&row.fieldKey===item.fieldKey) : null;
  return {target:item.target,fieldKey:item.fieldKey,oldValue:old?(old.valueNumber??old.valueText??null):item.oldValue??null,newValue:item.newValue};
 })};
}
function pointReviewMessage(state,message) {const node=state.dialog.querySelector('#pm-review-state');if(node)node.textContent=message;}
async function preparePointReview(state) {
 const session=localStorage.getItem('hubOperationSession');
 if(!session||!/^[a-f0-9]{64}$/.test(session)){pointReviewMessage(state,'Entre novamente no Data Hub para identificar o operador e habilitar a confirmação.');return;}
 try {
  const pending=localStorage.getItem('hubPendingPointOperation');
  if(pending){state.prepared={operationId:pending};await checkPointOperationStatus();return;}
  const prepared=await pointOperationApi(state.snapshot.entityId,'prepare',pointBackendRequest(state));
  if(pointReviewBackend!==state)return;
  state.prepared=prepared;
  state.dialog.innerHTML=renderPointReviewMarkup({...state.snapshot,items:prepared.plan.items});
  pointReviewMessage(state,'Valores conferidos no servidor. Confirme para gravar e registrar no histórico.');
  const button=state.dialog.querySelector('#pm-review-confirm');if(button)button.disabled=false;
  state.dialog.querySelector('button:not([disabled])')?.focus();
 }catch(error){if(pointReviewBackend===state){if(error.status===404)localStorage.removeItem('hubPendingPointOperation');pointReviewMessage(state,error.message);}}
}
async function executePointReview() {
 const state=pointReviewBackend;if(!state?.prepared||state.busy)return;
 state.busy=true;state.dialog.querySelectorAll('button').forEach(button=>button.disabled=true);
 pointReviewMessage(state,'Aplicando a operação. Aguarde a confirmação de cada destino.');
 try {localStorage.setItem('hubPendingPointOperation',state.prepared.operationId);const result=await pointOperationApi(state.snapshot.entityId,'confirm',{operationId:state.prepared.operationId,confirmed:true});await showPointOperationResult(state,result);}
 catch(error){state.busy=false;if([400,401,403,404,409,410,503].includes(error.status)){localStorage.removeItem('hubPendingPointOperation');state.prepared=null;pointReviewMessage(state,error.message);const cancel=state.dialog.querySelector('button.pm-match-secondary');if(cancel)cancel.disabled=false;}else{pointReviewMessage(state,'Não foi possível confirmar o resultado. Consulte o andamento antes de tentar outra operação.');pointStatusButton(state);}}
}
function pointStatusButton(state) {
 const button=state.dialog.querySelector('#pm-review-confirm');if(button){button.disabled=false;button.textContent='Consultar resultado';button.onclick=checkPointOperationStatus;}
 const cancel=state.dialog.querySelector('button.pm-match-secondary');if(cancel)cancel.disabled=false;
}
async function checkPointOperationStatus() {
 const state=pointReviewBackend;if(!state?.prepared||state.busy)return;
 try{state.busy=true;const result=await pointOperationApi(state.snapshot.entityId,'status/'+state.prepared.operationId);await showPointOperationResult(state,result);}
 catch(error){state.busy=false;pointReviewMessage(state,error.message);if(error.status===404){localStorage.removeItem('hubPendingPointOperation');state.prepared=null;const cancel=state.dialog.querySelector('button.pm-match-secondary');if(cancel)cancel.disabled=false;}else pointStatusButton(state);}
}
async function showPointOperationResult(state,result) {
 state.busy=false;if(pointReviewBackend!==state)return;
 if(['RUNNING','PREPARED'].includes(result.state)){
  if(result.state==='PREPARED'){
   if(result.plan){state.snapshot={...state.snapshot,mode:result.plan.mode,origin:result.plan.mode==='edit'?'Edição manual do HUB':pointPlatformLabels[result.plan.origin],items:result.plan.items,warnings:[]};state.dialog.innerHTML=renderPointReviewMarkup(state.snapshot);}
   if(result.expiresAt&&new Date(result.expiresAt).getTime()<Date.now()){localStorage.removeItem('hubPendingPointOperation');state.prepared=null;pointReviewMessage(state,'Revisão expirada. Feche esta revisão e prepare novamente.');return;}
   pointReviewMessage(state,'A operação ainda não iniciou. Você pode confirmar a mesma revisão, sem criar outra operação.');
   const button=state.dialog.querySelector('#pm-review-confirm');if(button){button.disabled=false;button.textContent='Confirmar operação';button.onclick=executePointReview;}
   const cancel=state.dialog.querySelector('button.pm-match-secondary');if(cancel)cancel.disabled=false;
  }else{const content=state.dialog.querySelector('.pm-review-scroll');if(content)content.textContent='Operação '+result.operationId+' · aguardando resultado confirmado.';pointReviewMessage(state,'Operação em andamento ou interrompida. Consulte o resultado; não inicie outra tentativa.');pointStatusButton(state);}return;
 }
 localStorage.removeItem('hubPendingPointOperation');
 const labels={succeeded:'Concluído',failed:'Falhou',conflict:'Conflito: valor ou vínculo alterado',uncertain:'Resultado incerto: confira a plataforma antes de tentar novamente'};
 state.dialog.innerHTML='<header class="pm-review-head"><h2>Resultado da operação</h2></header><div class="pm-review-scroll"><p>'+_escapeHtml(result.state==='COMPLETED'?'Operação concluída.':'A operação não foi concluída integralmente.')+'</p><ul>'+result.results.map(item=>'<li>'+_escapeHtml(pointPlatformLabels[item.target]+': '+(labels[item.status]||item.status))+'</li>').join('')+'</ul></div><footer class="pm-review-actions"><button type="button" class="pm-match-secondary" onclick="closePointReview()">Fechar</button></footer>';
 pointOperation={mode:'view',direction:'out',draft:{},selected:new Set(),destinations:new Set()};
 try{
  const details=await fetchHubEntityDetails(state.snapshot.entityId);
  if(pointReviewBackend!==state)return;
  window.__currentPointModalClient=mapHubEntityDetailsToModalClient(details,state.client);
  _renderBody(window.__currentPointModalClient);
  const overlay=document.getElementById('pointModalOverlay');if(overlay)_renderHeader(window.__currentPointModalClient,overlay);
 }catch(error){const note=document.createElement('p');note.textContent='Resultado registrado. Reabra a ficha para atualizar os dados exibidos.';state.dialog.querySelector('.pm-review-scroll')?.appendChild(note);}
 state.dialog.querySelector('button')?.focus();
}
