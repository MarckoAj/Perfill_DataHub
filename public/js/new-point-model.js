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
          ${_syncPill("GLPI",   pmIcons.glpi,   "warning", 2)}
          ${_syncPill("ZABBIX", pmIcons.zabbix, "success", null)}
          ${_syncPill("AUVO",   pmIcons.auvo,   "warning", 1)}
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
      ${_platformTab("glpi",    "GLPI",     pmIcons.glpi,    2)}
      ${_platformTab("zabbix",  "ZABBIX",   pmIcons.zabbix,  0)}
      ${_platformTab("auvo",    "AUVO",     pmIcons.auvo,    1)}
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

    return `
      <div class="pm-general-layout">
        <!-- Campos: 2/3 esquerda -->
        <div class="pm-fields-grid">
          <div>
            ${_field("Nome do ativo",    _shortText(assetName, 36), nameBadge, assetName)}
            ${_field("ID do ativo (HUB)", _formatHubId(client))}
            ${_field("Tipo",             client.type)}
            ${_field("Cidade",           client.city)}
            ${_field("Latitude",         client.latitude, { type:"critical", label:"Campo Crítico" })}
            ${_field("Município",        client.city)}
          </div>
          <div>
            ${_field("ID Antigo",        "00-00 TP - ID ANTIGO")}
            ${_field("Unidade",          client.unit)}
            ${_field("Região",           client.region)}
            ${_field("Longitude",        client.longitude, { type:"critical", label:"Campo Crítico" })}
            ${_field("Responsável técnico","Adriano Santos")}
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
              <span class="pm-device-info-key">Modelo</span>
              <span class="pm-device-info-val">Hikvision DS-2CD</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">Serial</span>
              <span class="pm-device-info-val">HK-00${client.clientId}28X</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">Resolução</span>
              <span class="pm-device-info-val">4MP / 2K</span>
            </div>
            <div class="pm-device-info-row">
              <span class="pm-device-info-key">Firmware</span>
              <span class="pm-device-info-val">v5.7.15</span>
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

function _sidebarActions() {
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

function _field(label, value, badge = null, title = null) {
  let badgeHTML = "";
  if (badge) {
    const cls = badge.type === "critical" ? "pm-badge-critical" : `divergence-badge ${badge.type}`;
    badgeHTML = `<span class="${cls}">${badge.label}</span>`;
  }
  const titleAttr = title ? ` title="${_escapeHtml(title)}"` : "";
  return `
    <div class="info-block">
      <div class="info-label">${label}</div>
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
