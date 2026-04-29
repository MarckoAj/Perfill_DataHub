/**
 * Video Wall Dashboard v2
 * Versao Final do Frontend com Lista Geral Compacta
 */

let dashboardData = {
  header: {
    title: "Video Wall - Centro de Operacoes",
    subtitle: "Monitoramento em tempo real de alertas e SLA",
  },
  activeAlerts: [], // Será preenchido pela API
  metricsGrid: [], // Será carregado da API
  criticalTickets: [
    { id: "#1929", description: "Loja Principal sem conectividade", duration: "02:45h" },
    { id: "#1930", description: "Servidor de Banco de Dados OFFLINE", duration: "00:15h" }
  ],
  generalTickets: [], // Será carregado da API
};

let currentAlertIndex = 0;
const ALERTS_PER_PAGE = 10;
let alertListPage = 0;
let criticalListPage = 0;
const CRITICALS_PER_PAGE = 3;
let currentFilter = 'todos';

const root = document.getElementById("root");

function renderDashboard() {
  const counts = {
    total: dashboardData.activeAlerts.length,
    critico: dashboardData.activeAlerts.filter(a => a.severity === 'critico').length,
    atencao: dashboardData.activeAlerts.filter(a => a.severity === 'atencao').length,
    informativo: dashboardData.activeAlerts.filter(a => a.severity === 'informativo').length
  };

  const statusChips = [
    { label: "Total", count: counts.total, variant: "neutral", filter: "todos", icon: "list" },
    { label: "Criticos", count: counts.critico, variant: "critical", filter: "critico", icon: "alert" },
    { label: "Avisos", count: counts.atencao, variant: "warning", filter: "atencao", icon: "warning" },
    { label: "Informativos", count: counts.informativo, variant: "info", filter: "informativo", icon: "info" },
  ];

  const filteredAlerts = currentFilter === 'todos'
    ? dashboardData.activeAlerts
    : dashboardData.activeAlerts.filter(a => a.severity === currentFilter);

  const currentAlert = filteredAlerts[currentAlertIndex] || null;

  root.innerHTML = `
    <main class="app">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">${iconSvg("headset", 22)}</div>
          <div class="brand-copy">
            <h1 class="brand-title">${dashboardData.header.title}</h1>
            <p class="brand-subtitle">${dashboardData.header.subtitle}</p>
          </div>
        </div>
        <div class="status-row">
          ${statusChips.map(chip => `
            <div class="status-pill status-${chip.variant} ${currentFilter === chip.filter ? 'active-filter' : ''}" 
                 onclick="setFilter('${chip.filter}')" style="cursor: pointer;">
              <span class="status-pill-icon">${iconSvg(chip.icon, 18)}</span>
              <span class="status-pill-label">${chip.label}: ${chip.count}</span>
            </div>
          `).join("")}
        </div>
      </header>

      <section class="grid">
        <div class="stack stack-primary">
          ${currentAlert ? `
            <section class="alert-banner severity-${currentAlert.severity}">
              <div class="alert-copy">
                <div class="alert-icon">${iconSvg("alert", 30)}</div>
                <div><h2 class="alert-title">${currentAlert.Chamado}</h2><p class="alert-text">${currentAlert.description}</p></div>
              </div>
              <div class="signal-button">${iconSvg("bell", 22)}</div>
            </section>
          ` : `
            <section class="alert-banner severity-informativo">
              <div class="alert-copy"><h2 class="alert-title">${currentFilter === 'todos' ? 'Nenhum alerta ativo' : 'Nenhum alerta nesta categoria'}</h2></div>
            </section>
          `}

          <section class="card detail-shell">
            <div class="panel-header">
              <h3 class="panel-title">${iconSvg("note", 18)} Detalhes do Chamado</h3>
            </div>
            <section class="card light ticket-panel">
              ${currentAlert ? `
                <div class="ticket-main">
                  <div class="ticket-overview">
                    <div class="ticket-topline">
                      <span class="ticket-rank">${currentAlert.badge}</span>
                      <p class="ticket-number">#${currentAlert.Ticket}</p>
                      <div class="ticket-topline-meta">
                        <span>Ponto: ${currentAlert.pointId}</span>
                        <span>TIPO <strong class="type-pill">${currentAlert.Categoria || currentAlert.type || '—'}</strong></span>
                      </div>
                    </div>
                    <div class="description-grid">
                      <div class="description-block"><p class="detail-label">Titulo</p><p class="detail-value detail-title">${currentAlert.Chamado}</p></div>
                      <div class="description-block"><p class="detail-label">Regra do Alerta</p><p class="detail-value detail-copy-text" style="font-weight: 600;">${currentAlert.description}</p></div>
                      <div class="description-block"><p class="detail-label">Codigo da Regra</p><p class="detail-value detail-copy-text">${currentAlert.ruleId}</p></div>
                    </div>
                  </div>
                  <aside class="ticket-aside">
                    <div class="focus-stat focus-danger">
                      <div class="focus-stat-icon">${iconSvg("clock", 20)}</div>
                      <div><p class="focus-stat-title">${currentAlert.slaStatus}</p><p class="focus-stat-text">${currentAlert.slaText}</p></div>
                    </div>
                    <div class="focus-stat focus-purple">
                      <div class="focus-stat-icon">${iconSvg("users", 20)}</div>
                      <div><p class="focus-stat-title">Atribuido</p><p class="focus-stat-text">${currentAlert.tecnicalAtribuied}</p></div>
                    </div>
                    <div class="focus-stat focus-blue">
                      <div class="focus-stat-icon">${iconSvg("server", 20)}</div>
                      <div><p class="focus-stat-title">Origem</p><p class="focus-stat-text">${currentAlert.source}</p></div>
                    </div>
                    <div class="focus-stat ${currentAlert.statusPing === 'ONLINE' ? 'focus-success' : 'focus-danger'}">
                      <div class="focus-stat-icon">${iconSvg("wifi", 20)}</div>
                      <div><p class="focus-stat-title">Status Ping</p><p class="focus-stat-text">${currentAlert.statusPing}</p></div>
                    </div>
                  </aside>
                </div>
              ` : `<div style="padding: 40px; text-align: center;" class="muted">Nenhum chamado para exibir.</div>`}
            </section>
          </section>

          <section class="card metrics-shell">
            <div class="panel-header"><h3 class="panel-title">Resumo Operacional (GLPI)</h3></div>
            <section class="metrics metrics-large">
              ${dashboardData.metricsGrid.map(metric => `
                <article class="metric-card metric-${metric.variant}">
                  <div class="metric-card-top"><p class="count">${metric.count}</p><div class="icon">${iconSvg(metric.icon, 20)}</div></div>
                  <p class="label">${metric.label}</p>
                </article>
              `).join("")}
            </section>
          </section>
        </div>

        <div class="stack stack-secondary">
          <section class="card">
            <div class="panel-header panel-header-split">
              <h3 class="panel-title">${iconSvg("clock", 18)} Alertas: ${currentFilter.toUpperCase()}</h3>
              <div class="pagination-controls">
                <button onclick="changePage(-1)" class="ghost-button">${iconSvg("chevronLeft", 12)}</button>
                <button onclick="changePage(1)" class="ghost-button">${iconSvg("chevronRight", 12)}</button>
              </div>
            </div>
            <div class="list alert-feed-list">
              ${renderAlertList(filteredAlerts)}
            </div>
          </section>

          <section class="card">
            <div class="panel-header panel-header-split">
              <h3 class="panel-title">Criticos em Aberto</h3>
              <div class="pagination-controls">
                <button onclick="changeCriticalPage(-1)" class="ghost-button">${iconSvg("chevronLeft", 12)}</button>
                <button onclick="changeCriticalPage(1)" class="ghost-button">${iconSvg("chevronRight", 12)}</button>
              </div>
            </div>
            <div class="list critical-list" style="overflow-y: auto; max-height: 280px;">
              ${renderCriticalListHtml(counts.critico)}
            </div>
          </section>

          <section class="card table-card">
            <div class="panel-header"><h3 class="panel-title">${iconSvg("list", 16)} Lista Geral</h3></div>
            <div class="table-wrap">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>LOCAL</th>
                    <th>ATIVO</th>
                    <th>CAT.</th>
                    <th>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  ${dashboardData.generalTickets.map(t => `
                    <tr>
                      <td style="max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.point}">${t.point}</td>
                      <td style="max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.asset}">${t.asset}</td>
                      <td><span class="type-badge">${t.type}</span></td>
                      <td><span class="sla-badge sla-${t.slaStatus}">${t.sla}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  `;
}

function renderAlertList(alerts) {
  const start = alertListPage * ALERTS_PER_PAGE;
  const pageItems = alerts.slice(start, start + ALERTS_PER_PAGE);
  if (pageItems.length === 0) return '<p class="muted" style="padding: 20px;">Sem alertas ativos...</p>';

  return pageItems.map((alert, index) => {
    const globalIndex = start + index;
    return `
      <section class="mini-alert-card alert-banner severity-${alert.severity} ${globalIndex === currentAlertIndex ? 'active' : ''}" 
               onclick="selectAlert(${globalIndex})" style="min-height: auto; padding: 10px; margin-bottom: 8px;">
        <div class="alert-copy" style="gap: 12px;">
          <div class="alert-icon" style="width: 32px; height: 32px;">${iconSvg("alert", 16)}</div>
          <div style="min-width: 0;">
            <h2 class="alert-title" style="font-size: 0.8rem; margin: 0;">#${alert.Ticket} | ${alert.Chamado}</h2>
            <p class="alert-text" style="font-size: 0.65rem; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.9;">
              <strong>[${alert.source}]</strong> ${alert.description}
            </p>
          </div>
        </div>
        <div class="signal-button" style="width: 28px; height: 28px; border-radius: 6px;">${iconSvg("bell", 14)}</div>
      </section>
    `;
  }).join("");
}

function renderCriticalListHtml(totalCriticos) {
  if (totalCriticos === 0) return '<p class="muted" style="padding: 20px;">Nenhum ticket critico...</p>';
  const criticals = dashboardData.activeAlerts.filter(a => a.severity === 'critico');
  const start = criticalListPage * CRITICALS_PER_PAGE;
  const pageItems = criticals.slice(start, start + CRITICALS_PER_PAGE);

  if (pageItems.length === 0) {
    criticalListPage = 0;
    return renderCriticalListHtml(totalCriticos);
  }

  return pageItems.map(alert => renderCriticalTicket(alert)).join("");
}

function renderCriticalTicket(alert) {
  return `
    <section class="alert-banner severity-critico" style="min-height: auto; padding: 10px; margin-bottom: 8px; border-radius: 8px;">
      <div class="alert-copy" style="gap: 12px;">
        <div class="alert-icon" style="width: 28px; height: 28px;">${iconSvg("alert", 14)}</div>
        <div style="min-width: 0;">
          <h2 class="alert-title" style="font-size: 0.75rem; margin: 0;">#${alert.Ticket} | CRÍTICO</h2>
          <p class="alert-text" style="font-size: 0.65rem; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${alert.description}
          </p>
        </div>
      </div>
      <div style="font-size: 0.65rem; font-weight: 800; opacity: 0.8; white-space: nowrap; margin-left: 10px;">
        ${alert.slaText}
      </div>
    </section>
  `;
}

window.setFilter = (filter) => {
  currentFilter = filter;
  currentAlertIndex = 0;
  alertListPage = 0;
  renderDashboard();
};

window.selectAlert = (index) => {
  currentAlertIndex = index;
  renderDashboard();
};

window.changePage = (dir) => {
  const alerts = currentFilter === 'todos' ? dashboardData.activeAlerts : dashboardData.activeAlerts.filter(a => a.severity === currentFilter);
  const maxPages = Math.ceil(alerts.length / ALERTS_PER_PAGE);
  alertListPage = Math.max(0, Math.min(alertListPage + dir, maxPages - 1));
  renderDashboard();
};

window.changeCriticalPage = (dir) => {
  const criticals = dashboardData.activeAlerts.filter(a => a.severity === 'critico');
  const maxPages = Math.ceil(criticals.length / CRITICALS_PER_PAGE);
  criticalListPage = Math.max(0, Math.min(criticalListPage + dir, maxPages - 1));
  renderDashboard();
};

function iconSvg(name, size = 20, stroke = "currentColor") {
  const icons = {
    alert: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    bell: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.24 21a2 2 0 0 0 3.52 0"/><path d="M3.4 17a1 1 0 0 0 .9-1.45A8 8 0 0 1 4 12V9a8 8 0 0 1 16 0v3c0 1.54.35 3.06 1.1 4.45A1 1 0 0 0 22 17Z"/></svg>`,
    calendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    headset: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Z"/><path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/><path d="M10 19h4"/></svg>`,
    info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4"/></svg>`,
    list: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`,
    note: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>`,
    server: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01"/><path d="M7 17h.01"/></svg>`,
    users: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    checkCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`,
    spark: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/></svg>`,
    pause: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 9v6"/><path d="M14 9v6"/></svg>`,
    chevronLeft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    warning: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v2"/><path d="M12 15h.01"/></svg>`,
    wifi: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  };
  return icons[name] ?? icons.info;
}

// Função para carregar métricas da API
async function loadMetrics() {
  try {
    const response = await fetch('/api/dashboard/metrics');
    const result = await response.json();

    if (result.success) {
      dashboardData.metricsGrid = result.data;
    } else {
      console.error('Erro ao carregar métricas:', result.error);
      // Dados fallback em caso de erro
      dashboardData.metricsGrid = [
        { label: "Novos", count: "0", variant: "success", icon: "plus" },
        { label: "Criados hoje", count: "0", variant: "blue", icon: "calendar" },
        { label: "Encerrados hoje", count: "0", variant: "purple", icon: "checkCircle" },
        { label: "Aberto SLA", count: "0", variant: "gray", icon: "clock" },
        { label: "Proativos", count: "0", variant: "danger", icon: "spark" },
        { label: "Pendentes", count: "0", variant: "neutral", icon: "pause" }
      ];
    }
  } catch (error) {
    console.error('Erro na requisição de métricas:', error);
    // Dados fallback em caso de erro de rede
    dashboardData.metricsGrid = [
      { label: "Novos", count: "0", variant: "success", icon: "plus" },
      { label: "Criados hoje", count: "0", variant: "blue", icon: "calendar" },
      { label: "Encerrados hoje", count: "0", variant: "purple", icon: "checkCircle" },
      { label: "Aberto SLA", count: "0", variant: "gray", icon: "clock" },
      { label: "Proativos", count: "0", variant: "danger", icon: "spark" },
      { label: "Pendentes", count: "0", variant: "neutral", icon: "pause" }
    ];
  }
}

// Função para carregar alertas da API
async function loadAlerts() {
  try {
    const response = await fetch('/api/dashboard/alerts');
    const result = await response.json();

    if (result.success) {
      dashboardData.activeAlerts = result.data || [];
      
      // Ajusta o índice selecionado se o array diminuir
      if (currentAlertIndex >= dashboardData.activeAlerts.length) {
        currentAlertIndex = 0;
      }
    } else {
      console.error('Erro ao carregar alertas:', result.error);
    }
  } catch (error) {
    console.error('Erro na requisição de alertas:', error);
  }
}

// Função para carregar chamados gerais da API
async function loadTickets() {
  try {
    const response = await fetch('/api/dashboard/glpi');
    const result = await response.json();

    if (result.success && result.data) {
      // Filtrar finalizados (solucionado/fechado) para a lista ativa resumida
      const activeTickets = result.data.filter(t => {
        const s = (t['Status do Chamado'] || '').toLowerCase();
        return s !== 'fechado' && s !== 'solucionado';
      });

      dashboardData.generalTickets = activeTickets.map(t => {
        // Mapear SLA
        let slaStatus = 'ok';
        if (t['Status do SLA'] === 'Vencido') slaStatus = 'danger';
        else if (t['Status do SLA'] === 'Atenção') slaStatus = 'warning';

        // Limpar Localização para exibir só a primeira palavra / trecho importante
        const fullLocal = t['Cliente Local'] || 'N/A';
        const point = fullLocal.split(' ')[0];

        return {
          Ticket: t['Ticket'],
          point: point,
          asset: t['Projeto'] || `#${t['Ticket']}`,
          type: t['Categoria'] || t['TIPO'] || 'Geral',
          sla: t['Tempo para Resolver'] || 'OK',
          slaStatus: slaStatus
        };
      });
    }
  } catch (error) {
    console.error('Erro na requisição de chamados gerais:', error);
  }
}

// Inicialização
async function initDashboard() {
  await Promise.all([loadMetrics(), loadAlerts(), loadTickets()]);
  renderDashboard();

  // Atualizar métricas, alertas e tickets a cada 30 segundos
  setInterval(async () => {
    await Promise.all([loadMetrics(), loadAlerts(), loadTickets()]);
    renderDashboard();
  }, 30000);
}

// Iniciar o dashboard
initDashboard();
