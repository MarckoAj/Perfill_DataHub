/* =========================================================
   POINT MODAL — ENTERPRISE NOC v2
========================================================= */

let currentPlatformTab = "hub";
let currentPointTab = "general";
let currentClientId = null;

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
};

/* =========================================================
   MODAL CONTROL
========================================================= */

function openPointModal(clientId = 1) {
  currentClientId = clientId;

  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  const client = clientsMock.find(c => c.clientId === clientId);
  if (!client) return;

  _renderHeader(client, overlay);
  _renderBody(client);
}

function closePointModal() {
  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

/* =========================================================
   TAB SWITCHERS
========================================================= */

function changePlatformTab(tab) {
  currentPlatformTab = tab;
  const client = clientsMock.find(c => c.clientId === currentClientId);
  if (!client) return;
  _renderBody(client);
}

function changePointTab(tab) {
  currentPointTab = tab;
  const client = clientsMock.find(c => c.clientId === currentClientId);
  if (!client) return;
  _renderBody(client);
}

/* =========================================================
   HEADER RENDER — injeta no point-modal-header existente
========================================================= */

function _renderHeader(client, overlay) {
  const header = overlay.querySelector(".point-modal-header");
  if (!header) return;

  header.innerHTML = `
    <!-- Esquerda: Título + Metadados -->
    <div class="pm-header-left">
      <div class="pm-title-row">
        <h2 class="pm-title">${client.address || "Ponto"}</h2>
        <span class="pm-badge online">ONLINE</span>
      </div>
      <div class="pm-meta-row">
        <span class="pm-meta-item">${pmIcons.pin} ${client.city} / ${client.state || "BA"}</span>
        <span class="pm-meta-item">${pmIcons.shield} ${client.cicom || client.unit}</span>
        <span class="pm-meta-item">ID Hub: <strong style="color:var(--accent)">HUB-${String(client.clientId).padStart(6,"0")}</strong></span>
      </div>
    </div>

    <!-- Direita: Situação de sincronização + botões -->
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
        <button onclick="closePointModal()" class="ticket-modal-close">✕</button>
      </div>
    </div>
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
   BODY RENDER — injeta no pointTabContent
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

  /* ABAS NORMAIS (GRID 2 COLUNAS: main + sidebar) */
  container.innerHTML = `
    ${platformTabs}

    <div class="pm-content-grid">

      <!-- COLUNA PRINCIPAL -->
      <div class="pm-main">

        <!-- Sub-abas -->
        <div class="point-tabs">
          ${_subTab("general",    "Informações Gerais")}
          ${_subTab("network",    "Informações de Rede")}
          ${_subTab("status",     "Estado do Ponto")}
          ${_subTab("attendance", "Atendimentos")}
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

      </div>

      <!-- SIDEBAR -->
      <div class="pm-sidebar">
        ${_sidebarDivergences()}
        ${_sidebarSync()}
        ${_sidebarActions()}
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
  if (currentPointTab === "general") {
    const nameBadge = currentPlatformTab === "glpi"
      ? { type: "warning", label: "Divergente do HUB" }
      : { type: "critical", label: "Campo Crítico" };

    return `
      <div class="pm-fields-grid">
        <div>
          ${_field("Nome do ativo",    "RP-01 CAJAZEIRAS", nameBadge)}
          ${_field("ID do ativo (HUB)","HUB-" + String(client.clientId).padStart(6,"0"))}
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
      </div>`;
  }

  if (currentPointTab === "network") {
    return `
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
      </div>`;
  }

  if (currentPointTab === "status") {
    return `
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

      <div class="pm-history-section">
        <div class="pm-history-title">Histórico de Status Físico</div>
        <div class="pm-op-history">
          ${(client.operationalHistory || []).map(item => `
            <div class="pm-history-card">
              <div class="pm-history-grid">
                <div style="grid-column:span 3;font-weight:700;color:#fff;margin-bottom:4px;">${item.title}</div>
                <div><strong>DE</strong> <span>${item.from}</span></div>
                <div><strong>PARA</strong> <span>${item.to}</span></div>
                <div><strong>Data</strong> <span>${item.date}</span></div>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  if (currentPointTab === "attendance") {
    return `
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

      <div class="pm-history-section">
        <div class="pm-history-title">Histórico de Tarefas em Campo</div>
        <div class="attendance-list">
          ${(client.attendances || []).map(task => `
            <div class="attendance-item" onclick="openAuvoTaskModal(${task.taskId})">
              <div class="attendance-icon ${task.status}"></div>
              <div class="attendance-title">${task.title}</div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  return "";
}

/* =========================================================
   SIDEBAR WIDGETS
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

function _field(label, value, badge = null) {
  let badgeHTML = "";
  if (badge) {
    const cls = badge.type === "critical" ? "pm-badge-critical" : `divergence-badge ${badge.type}`;
    badgeHTML = `<span class="${cls}">${badge.label}</span>`;
  }
  return `
    <div class="info-block">
      <div class="info-label">${label}</div>
      <div class="info-value-wrapper">
        <span class="info-value">${value || "N/A"}</span>
        ${badgeHTML}
      </div>
    </div>`;
}

/* Alias para compatibilidade com código legado */
function infoBlock(label, value, divergence = null) {
  return _field(label, value, divergence);
}