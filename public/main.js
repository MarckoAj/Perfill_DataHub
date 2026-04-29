const dashboardData = {
  header: {
    title: "Painel de Gestao de Chamados",
    subtitle: "Visao geral dos chamados, alertas e eventos do sistema",
    statusChips: [
      { label: "Criticos", count: 2, variant: "critical", icon: iconSvg("alert", 16) },
      { label: "Avisos", count: 4, variant: "warning", icon: iconSvg("warning", 16) },
      { label: "Informativos", count: 8, variant: "info", icon: iconSvg("info", 16) },
    ],
  },
  ticketAlertBanner: {
    title: "Chamado #1929 com SLA violado!",
    text: "O chamado nao foi resolvido a tempo e o SLA foi perdido.",
  },
  ticketDetailsCard: {
    badge: "#1",
    id: "#1929",
    pointId: "00:00",
    type: "INOPERANTE",
    title: "VDPCI-0000-PONTO INOPERANTE",
    description: "Conexao com a camera de seguranca perdida na loja principal.",
    slaStatus: "Fora do Prazo",
    slaText: "SLA Violado",
    team: "Equipe de Suporte",
    source: "Zabbix",
    assetCode: "VDPCI-0000",
    referenceCode: "13A5",
    channel: "ONLINE",
    extraSummary: "Conexao com a camera de seguranca perdida na loja principal",
  },
  metricsGrid: [
    { label: "Novos", count: "12", variant: "success", icon: iconSvg("check", 20) },
    { label: "Criados hoje", count: "38", variant: "blue", icon: iconSvg("plus", 20) },
    { label: "Fechados hoje", count: "18", variant: "purple", icon: iconSvg("checkCircle", 20) },
    { label: "Aberto SLA", count: "8", variant: "gray", icon: iconSvg("clock", 20) },
    { label: "Proativos", count: "6", variant: "danger", icon: iconSvg("spark", 20) },
    { label: "Pendentes", count: "27", variant: "neutral", icon: iconSvg("pause", 20) },
  ],
  recentEvents: [
    { time: "00:00", icon: "alert", text: "Chamado #1929 com SLA perdido", timeAgo: "ha 1 minuto" },
    { time: "00:04", icon: "warning", text: "Chamado #1871 SLA proximo de vencer", timeAgo: "ha 4 minutos" },
    { time: "00:16", icon: "message", text: "Chamado #1864 sem interacao", timeAgo: "ha 18 minutos" },
  ],
  criticalTickets: [
    { id: "#1929", description: "SLA Violado", duration: "ha 2m" },
    { id: "#1844", description: "Firewall sem resposta", duration: "ha 25m" },
  ],
  ticketsTable: [
    {
      id: "#1929",
      title: "VDPCI-0000 - PONTO INOPERANTE",
      sla: "Critico",
      tempo: "00:00",
      status: "Aberto",
      origem: "Zabbix",
    },
    {
      id: "#1871",
      title: "SLA proximo de vencer - Loja 02",
      sla: "Atencao",
      tempo: "00:04",
      status: "Aberto",
      origem: "GLPI",
    },
    {
      id: "#1864",
      title: "Sem interacao com o tecnico",
      sla: "Atencao",
      tempo: "00:18",
      status: "Aberto",
      origem: "Zabbix",
    },
  ],
};

const root = document.getElementById("root");

root.innerHTML = `
  <main class="app">
    <!-- COMPONENT: AppHeader -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">${iconSvg("headset", 22)}</div>
        <div class="brand-copy">
          <h1 class="brand-title">${dashboardData.header.title}</h1>
          <p class="brand-subtitle">${dashboardData.header.subtitle}</p>
        </div>
      </div>
      <div class="status-row" aria-label="Resumo rapido">
        ${dashboardData.header.statusChips.map((chip) => `
          <div class="status-pill status-${chip.variant}">
            <span class="status-pill-icon" aria-hidden="true">${chip.icon}</span>
            <span class="status-pill-label">${chip.label}: ${chip.count}</span>
          </div>
        `).join("")}
      </div>
    </header>

    <!-- COMPONENT: DashboardGrid -->
    <section class="grid">
      <div class="stack stack-primary">
        <!-- COMPONENT: TicketAlertBanner -->
        <section class="alert-banner" aria-label="Alerta do ticket">
          <div class="alert-copy">
            <div class="alert-icon">${iconSvg("alert", 30)}</div>
            <div>
              <h2 class="alert-title">${dashboardData.ticketAlertBanner.title}</h2>
              <p class="alert-text">${dashboardData.ticketAlertBanner.text}</p>
            </div>
          </div>
          <div class="signal-button" aria-hidden="true">${iconSvg("bell", 22)}</div>
        </section>

        <!-- COMPONENT: TicketDetailsShell -->
        <section class="card detail-shell" aria-label="Detalhes do chamado">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="panel-title-icon" aria-hidden="true">${iconSvg("note", 18)}</span>
              Detalhes do Chamado
            </h3>
          </div>

          <!-- COMPONENT: TicketDetailsCard -->
          <section class="card light ticket-panel" aria-label="Resumo do ticket">
            <!-- COMPONENT: TicketMainContent -->
            <div class="ticket-main">
              <!-- COMPONENT: TicketOverview -->
              <div class="ticket-overview">
                <!-- COMPONENT: TicketTopline -->
                <div class="ticket-topline">
                  <span class="ticket-rank">${dashboardData.ticketDetailsCard.badge}</span>
                  <p class="ticket-number">${dashboardData.ticketDetailsCard.id}</p>
                  <div class="ticket-topline-meta">
                    <span>ID do Ponto: ${dashboardData.ticketDetailsCard.pointId}</span>
                    <span>TIPO <strong class="type-pill">${dashboardData.ticketDetailsCard.type}</strong></span>
                  </div>
                </div>

                <!-- COMPONENT: TicketDescriptionGrid -->
                <div class="description-grid">
                  <!-- COMPONENT: TicketTitleBlock -->
                  <div class="description-block">
                    <p class="detail-label">Titulo</p>
                    <p class="detail-value detail-title">${dashboardData.ticketDetailsCard.title}</p>
                  </div>

                  <!-- COMPONENT: TicketDescriptionBlock -->
                  <div class="description-block">
                    <p class="detail-label">Descricao</p>
                    <p class="detail-value detail-copy-text">${dashboardData.ticketDetailsCard.description}</p>
                  </div>
                </div>
              </div>

              <!-- COMPONENT: TicketAsideStats -->
              <aside class="ticket-aside">
                <!-- COMPONENT: TicketSlaStat -->
                <div class="focus-stat focus-danger">
                  <div class="focus-stat-icon">${iconSvg("clock", 20)}</div>
                  <div>
                    <p class="focus-stat-title">${dashboardData.ticketDetailsCard.slaStatus}</p>
                    <p class="focus-stat-text">${dashboardData.ticketDetailsCard.slaText}</p>
                  </div>
                </div>

                <!-- COMPONENT: TicketAssignedTeamStat -->
                <div class="focus-stat focus-purple">
                  <div class="focus-stat-icon">${iconSvg("users", 20)}</div>
                  <div>
                    <p class="focus-stat-title">Atribuido</p>
                    <p class="focus-stat-text">${dashboardData.ticketDetailsCard.team}</p>
                  </div>
                </div>

                <!-- COMPONENT: TicketSourceStat -->
                <div class="focus-stat focus-red">
                  <div class="focus-stat-icon">${iconSvg("server", 20)}</div>
                  <div>
                    <p class="focus-stat-title">Origem</p>
                    <p class="focus-stat-text">${dashboardData.ticketDetailsCard.source}</p>
                  </div>
                </div>
              </aside>
            </div>

            <!-- COMPONENT: TicketAdditionalInfo -->
            <div class="ticket-extra">
              <div class="ticket-extra-header">
                <span class="panel-title-icon subtle" aria-hidden="true">${iconSvg("info", 16)}</span>
                <span>Informacoes Adicionais</span>
              </div>

              <div class="ticket-extra-meta">
                <strong>${dashboardData.ticketDetailsCard.id}</strong>
                <span>${dashboardData.ticketDetailsCard.assetCode}</span>
                <span>${dashboardData.ticketDetailsCard.referenceCode}</span>
                <span class="channel-chip">${dashboardData.ticketDetailsCard.channel}</span>
              </div>

              <p class="ticket-extra-title">
                <strong>Titulo</strong>
                <span>${dashboardData.ticketDetailsCard.extraSummary}</span>
              </p>
            </div>
          </section>
        </section>

        <!-- COMPONENT: MetricsShell -->
        <section class="card metrics-shell" aria-label="Resumo consolidado">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="panel-title-icon" aria-hidden="true">${iconSvg("list", 18)}</span>
              Lista de Chamados
            </h3>
          </div>

          <!-- COMPONENT: MetricsGrid -->
          <section class="metrics metrics-large" aria-label="Resumo de tickets">
            ${dashboardData.metricsGrid.map((metric) => `
              <!-- COMPONENT: MetricCard -->
              <article class="metric-card metric-${metric.variant}">
                <div class="metric-card-top">
                  <p class="count">${metric.count}</p>
                  <div class="icon">${metric.icon}</div>
                </div>
                <p class="label">${metric.label}</p>
              </article>
            `).join("")}
          </section>
        </section>
      </div>

      <div class="stack stack-secondary">
        <!-- COMPONENT: RecentEventsCard -->
        <section class="card" aria-label="Eventos recentes">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="panel-title-icon" aria-hidden="true">${iconSvg("clock", 18)}</span>
              Eventos Recentes
            </h3>
          </div>
          <!-- COMPONENT: RecentEventsList -->
          <div class="list recent-list">
            ${dashboardData.recentEvents.map((event) => `
              <!-- COMPONENT: RecentEventItem -->
              <div class="event">
                <div class="signal-icon event-${event.icon}">${iconForEvent(event.icon)}</div>
                <div class="event-main">
                  <div class="event-row">
                    <p class="event-time">${event.time}</p>
                    <p class="event-text">${event.text}</p>
                  </div>
                  <p class="event-ago">${event.timeAgo}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- COMPONENT: CriticalTicketsCard -->
        <section class="card" aria-label="Tickets criticos ativos">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="panel-title-icon" aria-hidden="true">${iconSvg("alert", 18)}</span>
              Tickets Criticos Ativos
            </h3>
          </div>
          <!-- COMPONENT: CriticalTicketsList -->
          <div class="list critical-list">
            ${dashboardData.criticalTickets.map((ticket) => `
              <!-- COMPONENT: CriticalTicketItem -->
              <div class="ticket-mini">
                <div class="ticket-mini-head">
                  <div class="ticket-mini-icon">${iconSvg("alert", 16)}</div>
                  <strong>${ticket.id}</strong>
                  <p class="ticket-mini-text">${ticket.description}</p>
                  <span class="ticket-mini-duration">${ticket.duration}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- COMPONENT: TicketsTableCard -->
        <section class="card table-card" aria-label="Lista de chamados">
          <div class="panel-header panel-header-split">
            <h3 class="panel-title">
              <span class="panel-title-icon" aria-hidden="true">${iconSvg("list", 18)}</span>
              Lista de Chamados
            </h3>
            <button class="ghost-button" type="button">Ver todos</button>
          </div>
          <!-- COMPONENT: TicketsTable -->
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titulo</th>
                  <th>SLA</th>
                  <th>Tempo</th>
                  <th>Status</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                ${dashboardData.ticketsTable.map((ticket) => `
                  <tr>
                    <td class="mono">${ticket.id}</td>
                    <td>
                      <div class="ticket-title">
                        <strong>${ticket.title}</strong>
                      </div>
                    </td>
                    <td><span class="chip chip-sla ${slaClass(ticket.sla)}">${ticket.sla}</span></td>
                    <td class="mono muted">${ticket.tempo}</td>
                    <td class="status-text ${statusTextClass(ticket.status)}">${ticket.status}</td>
                    <td class="muted">${ticket.origem}</td>
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

function slaClass(status) {
  switch (status) {
    case "Critico":
      return "critical";
    case "Atencao":
      return "warning";
    default:
      return "default";
  }
}

function statusTextClass(status) {
  switch (status) {
    case "Aberto":
      return "open";
    case "Critico":
      return "critical";
    default:
      return "default";
  }
}

function iconSvg(name, size = 20, stroke = "currentColor") {
  const icons = {
    alert: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    bell: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.24 21a2 2 0 0 0 3.52 0"/><path d="M3.4 17a1 1 0 0 0 .9-1.45A8 8 0 0 1 4 12V9a8 8 0 0 1 16 0v3c0 1.54.35 3.06 1.1 4.45A1 1 0 0 0 22 17Z"/></svg>`,
    chart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
    check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>`,
    checkCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`,
    clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    headset: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Z"/><path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/><path d="M10 19h4"/></svg>`,
    info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4"/></svg>`,
    list: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`,
    message: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>`,
    note: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>`,
    pause: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 9v6"/><path d="M14 9v6"/></svg>`,
    plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
    server: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01"/><path d="M7 17h.01"/></svg>`,
    spark: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/></svg>`,
    users: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    warning: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v2"/><path d="M12 15h.01"/></svg>`,
    x: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  };

  return icons[name] ?? icons.info;
}

function iconForEvent(name) {
  if (name === "message") return iconSvg("message", 18);
  if (name === "warning") return iconSvg("warning", 18);
  return iconSvg("alert", 18);
}
