/**
 * NOC Command Center Modal v2.0
 * Enterprise Operational Intelligence — Perfill DataHub
 * Pure Vanilla JS — Zero Dependencies
 */

const NOCModal = (() => {

  // ─── ESTADO ──────────────────────────────────────────────────────────────────
  const state = {
    isOpen: false,
    currentData: null,
    collapsedSections: new Set(),
  };

  // ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
  const fmt = {
    dateTime: (d) => {
      if (!d) return '—';
      return new Date(d).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },
    elapsed: (d) => {
      if (!d) return { display: '—', raw: 0 };
      const mins = Math.floor((Date.now() - new Date(d)) / 60000);
      if (mins < 1)   return { display: 'Agora mesmo', raw: mins };
      if (mins < 60)  return { display: `${mins}m`, raw: mins };
      const h = Math.floor(mins / 60), m = mins % 60;
      if (h < 24)     return { display: `${h}h ${m}m`, raw: mins };
      return { display: `${Math.floor(h / 24)}d ${h % 24}h`, raw: mins };
    },
    truncate: (s, n = 120) => s && s.length > n ? s.slice(0, n) + '…' : (s || '—'),
    esc: (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  };

  const getSev = (severity) => {
    const map = {
      critico:     { label: 'CRÍTICO',     color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   icon: '●' },
      atencao:     { label: 'ATENÇÃO',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  icon: '●' },
      informativo: { label: 'INFORMATIVO', color: '#19c5ff', bg: 'rgba(25,197,255,0.10)',  icon: '●' },
    };
    return map[(severity || '').toLowerCase()] || map.informativo;
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (/aberto|novo|offline|sem tarefa/.test(s))     return { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  dot: '#ef4444' };
    if (/andamento|campo|atribuido/.test(s))          return { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', dot: '#f59e0b' };
    if (/solucionado|finalizada|online/.test(s))      return { color: '#10b981', bg: 'rgba(16,185,129,0.10)', dot: '#10b981' };
    return { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', dot: '#94a3b8' };
  };

  const getTaskStatus = (status) => {
    const map = {
      FINALIZADA:    { color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: '✓' },
      EM_ANDAMENTO:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: '↻' },
      PENDENTE:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', icon: '○' },
    };
    return map[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', icon: '○' };
  };

  // ─── SEÇÃO COLAPSÁVEL ─────────────────────────────────────────────────────────
  const section = (id, icon, title, inner) => {
    const collapsed = state.collapsedSections.has(id) ? 'collapsed' : '';
    const chevron   = collapsed ? '▶' : '▼';
    return `
      <div class="noc2-section ${collapsed}" id="noc2-sec-${id}">
        <div class="noc2-section-header" onclick="NOCModal.toggleSection('${id}')">
          <span class="noc2-section-icon">${icon}</span>
          <span class="noc2-section-title">${title}</span>
          <span class="noc2-section-chevron">${chevron}</span>
        </div>
        <div class="noc2-section-body">${inner}</div>
      </div>`;
  };

  // ─── SKELETON ─────────────────────────────────────────────────────────────────
  const renderSkeleton = () => `
    <div class="noc2-skeleton">
      <div class="noc2-skel noc2-skel-h"></div>
      <div class="noc2-skel noc2-skel-row"></div>
      <div class="noc2-skel noc2-skel-block"></div>
      <div class="noc2-skel noc2-skel-block"></div>
    </div>`;

  // ─── 1. HEADER ────────────────────────────────────────────────────────────────
  const renderHeader = (data) => {
    const { alert, ticket } = data;
    const sev     = getSev(alert.severity);
    const elapsed = fmt.elapsed(alert.first_detected_at);
    const title   = fmt.esc(ticket?.title || alert.ruleId || 'ALERTA OPERACIONAL');

    return `
      <header class="noc2-header" style="border-left:4px solid ${sev.color};">
        <div class="noc2-header-left">
          <div class="noc2-sev-badge" style="color:${sev.color};background:${sev.bg};border-color:${sev.color};">
            ${sev.icon} ${sev.label}
          </div>
          <h2 class="noc2-header-title">${title}</h2>
          <div class="noc2-header-meta">
            <span class="noc2-meta-chip noc2-chip-offline">
              <span class="noc2-pulse-dot"></span> EQUIPAMENTO OFFLINE
            </span>
            <span class="noc2-meta-sep">·</span>
            <span class="noc2-meta-item">Chamado <strong>#${ticket?.id || '—'}</strong></span>
            <span class="noc2-meta-sep">·</span>
            <span class="noc2-meta-item">Regra <strong>${fmt.esc(alert.ruleId || '—')}</strong></span>
            <span class="noc2-meta-sep">·</span>
            <span class="noc2-meta-item">Ativo há <strong>${elapsed.display}</strong></span>
          </div>
        </div>
        <button class="noc2-close-btn" onclick="NOCModal.close()" title="Fechar">✕</button>
      </header>`;
  };

  // ─── 2+3+4. PAINEL SUPERIOR (RESUMO + SISTEMAS + SLA) ────────────────────────
  const renderTopRow = (data) => {
    const { alert, ticket, technicians, tasks } = data;

    /* Resumo Executivo */
    const items = [
      { label: 'Chamado',        value: `#${ticket?.id || '—'}`,           hl: true },
      { label: 'Status GLPI',    value: ticket?.status || '—' },
      { label: 'Projeto',        value: ticket?.project || '—' },
      { label: 'Abertura',       value: fmt.dateTime(ticket?.createdAt) },
      { label: 'Técnico NOC',    value: technicians?.noc || 'Não atribuído' },
      { label: 'Técnico Campo',  value: technicians?.field || 'Não atribuído' },
    ];
    const resumoHtml = `
      <div class="noc2-sys-label">📊 Resumo Executivo</div>
      <div class="noc2-exec-grid">
        ${items.map(i => `
          <div class="noc2-data-item">
            <span class="noc2-data-label">${i.label}</span>
            <span class="noc2-data-value ${i.hl ? 'highlight' : ''}">${fmt.esc(i.value)}</span>
          </div>`).join('')}
      </div>
      <div class="noc2-location-box">
        <span class="noc2-location-label">📍 Localização</span>
        <span class="noc2-location-value">${fmt.esc(ticket?.address || 'Não informada')}</span>
        ${ticket?.title ? `<span class="noc2-location-asset">Ativo: <strong>${fmt.esc(ticket.title)}</strong></span>` : ''}
      </div>`;

    /* Status Integrado */
    const auvoStatus = tasks?.length > 0 ? tasks[0].status : 'SEM TAREFA';
    const systems = [
      { name: 'GLPI',   sysColor: '#3274d9', status: ticket?.status || 'Aberto',     desc: 'Service Desk' },
      { name: 'AUVO',   sysColor: '#ff9830', status: auvoStatus,                      desc: 'Gestão de Campo' },
      { name: 'ZABBIX', sysColor: '#cc2929', status: 'HOST OFFLINE',                  desc: 'Monitoramento' },
    ];
    const sistemasHtml = systems.map(sys => {
      const st = getStatusStyle(sys.status);
      return `
        <div class="noc2-sys-row" style="border-left-color:${sys.sysColor};">
          <div>
            <div class="noc2-sys-name" style="color:${sys.sysColor};">${sys.name}</div>
            <div style="font-size:10px;color:var(--noc-muted);">${sys.desc}</div>
          </div>
          <div class="noc2-sys-status-chip" style="color:${st.color};background:${st.bg};">
            <span class="noc2-status-dot" style="background:${st.dot};"></span>
            ${fmt.esc(sys.status)}
          </div>
        </div>`;
    }).join('');

    /* SLA */
    const created   = ticket?.createdAt ? new Date(ticket.createdAt) : null;
    const slaMins   = 480;
    let slaPercent  = 0, slaColor = '#10b981', slaLabel = 'NO PRAZO', slaCls = 'green';
    if (created) {
      slaPercent = Math.min(100, Math.round(((Date.now() - created) / 60000 / slaMins) * 100));
      if (slaPercent >= 90) { slaColor = '#ef4444'; slaLabel = 'SLA VIOLADO'; slaCls = 'red'; }
      else if (slaPercent >= 70) { slaColor = '#f59e0b'; slaLabel = 'ATENÇÃO'; slaCls = 'amber'; }
    }
    const sev = getSev(alert.severity);
    const slaHtml = `
      <div class="noc2-sla-box">
        <div class="noc2-sys-label" style="margin-bottom:10px;">⏱️ SLA & Severidade</div>
        <div class="noc2-sla-top">
          <div>
            <div class="noc2-sla-label">Vencimento</div>
            <div class="noc2-sla-value" style="color:${slaColor};">${fmt.esc(ticket?.sla || 'N/A')}</div>
          </div>
          <span class="noc2-sla-badge ${slaCls}">${slaLabel}</span>
        </div>
        <div class="noc2-sla-track">
          <div class="noc2-sla-fill" style="width:${slaPercent}%;background:${slaColor};"></div>
        </div>
        <div class="noc2-sla-foot">
          <span class="noc2-sla-pct" style="color:${slaColor};">${slaPercent}% consumido</span>
          <span style="font-size:10px;color:var(--noc-muted);">Limite: 8h</span>
        </div>
        <div class="noc2-sev-chips">
          <span class="noc2-sev-chip ${(alert.severity || 'informativo').toLowerCase()}">${sev.label}</span>
          <span class="noc2-rule-chip">${fmt.esc(alert.ruleId || '—')}</span>
        </div>
      </div>`;

    return `
      <div class="noc2-top-row">
        <div>${resumoHtml}</div>
        <div class="noc2-right-col">
          <div>
            <div class="noc2-sys-label">🔗 Status Integrado</div>
            <div class="noc2-systems-list">${sistemasHtml}</div>
          </div>
          ${slaHtml}
        </div>
      </div>`;
  };

  // ─── 5. TIMELINE ──────────────────────────────────────────────────────────────
  const renderTimeline = (data) => {
    const { alert, ticket, interactions, tasks } = data;
    const events = [];

    if (alert.first_detected_at) events.push({
      time: alert.first_detected_at, title: 'Alerta Detectado',
      desc: `Motor de regras DataHub identificou anomalia. Regra: ${alert.ruleId}`,
      sys: 'ZABBIX', sysColor: '#cc2929', active: true,
    });
    if (ticket?.createdAt) events.push({
      time: ticket.createdAt, title: 'Chamado Aberto',
      desc: `Ticket #${ticket.id} registrado no GLPI — ${ticket.status}`,
      sys: 'GLPI', sysColor: '#3274d9', active: true,
    });
    (tasks || []).slice(0, 2).forEach(t => events.push({
      time: null, title: `Tarefa #${t.taskId} — AUVO`,
      desc: `${t.title} · ${t.assignedTo || 'Não atribuído'}`,
      sys: 'AUVO', sysColor: '#ff9830', active: t.status === 'FINALIZADA',
    }));
    (interactions || []).slice(0, 4).forEach(i => events.push({
      time: i.date, title: 'Interação Técnica',
      desc: `${i.author}: ${fmt.truncate(i.description, 90)}`,
      sys: 'GLPI', sysColor: '#3274d9', active: false,
    }));

    events.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(a.time) - new Date(b.time);
    });

    const inner = events.length === 0
      ? '<div class="noc2-empty">Nenhum evento registrado.</div>'
      : events.map((ev, idx) => `
          <div class="noc2-tm-item">
            <div class="noc2-tm-connector">
              <div class="noc2-tm-dot" style="${ev.active ? `background:${ev.sysColor};box-shadow:0 0 6px ${ev.sysColor}66;` : ''}"></div>
              ${idx < events.length - 1 ? '<div class="noc2-tm-line"></div>' : ''}
            </div>
            <div class="noc2-tm-body">
              <div class="noc2-tm-head">
                <span class="noc2-tm-title">${ev.title}</span>
                <div class="noc2-tm-meta">
                  <span class="noc2-sys-chip" style="color:${ev.sysColor};border-color:${ev.sysColor};">${ev.sys}</span>
                  ${ev.time ? `<span class="noc2-tm-time">${fmt.dateTime(ev.time)}</span>` : ''}
                </div>
              </div>
              <div class="noc2-tm-desc">${fmt.esc(ev.desc)}</div>
            </div>
          </div>`).join('');

    return section('timeline', '🛤️', 'Timeline Operacional', inner);
  };

  // ─── 6. TAREFAS AUVO ──────────────────────────────────────────────────────────
  const renderTasks = (data) => {
    const { tasks } = data;
    const inner = tasks?.length > 0
      ? `<div class="noc2-tasks-list">${tasks.map(t => {
          const st = getTaskStatus(t.status);
          const date = t.scheduledDate ? fmt.dateTime(t.scheduledDate) : null;
          return `
            <div class="noc2-task-card">
              <div class="noc2-task-top">
                <span class="noc2-task-id">#${t.taskId}</span>
                <span class="noc2-task-status-badge" style="color:${st.color};background:${st.bg};">
                  ${st.icon} ${(t.status || '').replace(/_/g, ' ')}
                </span>
              </div>
              <div class="noc2-task-title">${fmt.esc(t.title || 'Sem título')}</div>
              <div class="noc2-task-meta">
                <span class="noc2-task-meta-item">👤 ${fmt.esc(t.assignedTo || 'Não atribuído')}</span>
                ${date ? `<span class="noc2-task-meta-item">📅 ${date}</span>` : ''}
              </div>
            </div>`;
        }).join('')}</div>`
      : '<div class="noc2-empty">Nenhuma tarefa AUVO vinculada a este alerta.</div>';

    return section('tarefas', '🔧', 'Tarefas AUVO', inner);
  };

  // ─── 7. INTERAÇÕES GLPI ────────────────────────────────────────────────────────
  const renderInteractions = (data) => {
    const { interactions } = data;
    const inner = interactions?.length > 0
      ? `<div class="noc2-interactions-list">${interactions.map(i => `
          <div class="noc2-interaction-item">
            <div class="noc2-int-header">
              <span class="noc2-int-author">${fmt.esc(i.author)}</span>
              <span class="noc2-int-time">${fmt.dateTime(i.date)}</span>
            </div>
            <div class="noc2-int-body">${fmt.esc(i.description)}</div>
          </div>`).join('')}</div>`
      : '<div class="noc2-empty">Nenhuma interação registrada no GLPI.</div>';

    return section('interacoes', '💬', 'Interações GLPI', inner);
  };

  // ─── 8. LOGS & EVENTOS ────────────────────────────────────────────────────────
  const renderLogs = (data) => {
    const { alert } = data;
    const now = new Date().toLocaleTimeString('pt-BR');
    const inner = `
      <div class="noc2-log-terminal">
        <div class="noc2-log-line">
          <span class="noc2-log-ts">[${now}]</span>
          <span class="noc2-log-sys-tag" style="color:#cc2929;">ZBX</span>
          <span class="noc2-log-msg">trigger fired — host unreachable</span>
        </div>
        <div class="noc2-log-line">
          <span class="noc2-log-ts">[${now}]</span>
          <span class="noc2-log-sys-tag" style="color:#19c5ff;">SYS</span>
          <span class="noc2-log-msg">alert engine matched rule: ${fmt.esc(alert.ruleId)}</span>
        </div>
        <div class="noc2-log-line">
          <span class="noc2-log-ts">[${now}]</span>
          <span class="noc2-log-sys-tag" style="color:#3274d9;">GLPI</span>
          <span class="noc2-log-msg">ticket data fetched — correlation complete</span>
        </div>
        <div class="noc2-log-line">
          <span class="noc2-log-ts">[${now}]</span>
          <span class="noc2-log-sys-tag" style="color:#ff9830;">AUVO</span>
          <span class="noc2-log-msg">task sync — ${data.tasks?.length || 0} record(s)</span>
        </div>
        <div class="noc2-log-line">
          <span class="noc2-log-ts">[${now}]</span>
          <span class="noc2-log-sys-tag" style="color:#6b7280;">INF</span>
          <span class="noc2-log-cursor">▌</span>
          <span class="noc2-log-msg"> awaiting operator input...</span>
        </div>
      </div>`;

    return section('logs', '📟', 'Eventos & Logs do Sistema', inner);
  };

  // ─── 9. FOOTER / AÇÕES ────────────────────────────────────────────────────────
  const renderFooter = (data) => {
    const { ticket, alert } = data;
    const alertId = alert.alertId;
    const glpiUrl = ticket?.glpiUrl || '#';

    return `
      <footer class="noc2-footer">
        <div class="noc2-footer-left">
          <button class="noc2-btn noc2-btn-ghost"
            onclick="window.open('${glpiUrl}', '_blank')">
            ↗ Abrir no GLPI
          </button>
          <button class="noc2-btn noc2-btn-ghost"
            onclick="NOCModal.triggerJustify(${alertId})">
            ✎ Atualizar Status
          </button>
        </div>
        <div class="noc2-footer-right">
          <button class="noc2-btn noc2-btn-ghost" onclick="NOCModal.close()">Fechar</button>
          <button class="noc2-btn noc2-btn-warn"
            onclick="NOCModal.triggerJustify(${alertId})">
            ⚑ Justificar Ocorrência
          </button>
        </div>
      </footer>`;
  };

  // ─── MONTAGEM ─────────────────────────────────────────────────────────────────
  const buildModal = (data) => `
    <div class="noc2-modal">
      ${renderHeader(data)}
      <div class="noc2-body">
        ${renderTopRow(data)}
        ${renderTimeline(data)}
        ${renderTasks(data)}
        ${renderInteractions(data)}
        ${renderLogs(data)}
      </div>
      ${renderFooter(data)}
    </div>`;

  const getOverlay = () => {
    let el = document.getElementById('noc-modal-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'noc-modal-overlay';
      el.className = 'noc-overlay';
      el.addEventListener('click', (e) => { if (e.target === el) NOCModal.close(); });
      document.body.appendChild(el);
    }
    return el;
  };

  // ─── API PÚBLICA ──────────────────────────────────────────────────────────────
  return {
    openLoading() {
      state.isOpen = true;
      const overlay = getOverlay();
      overlay.innerHTML = `
        <div class="noc2-modal">
          <header class="noc2-header" style="border-left:4px solid #373c43;">
            <div class="noc2-header-left">
              <div class="noc2-skel" style="height:20px;width:80px;border-radius:2px;"></div>
              <div class="noc2-skel" style="height:26px;width:55%;border-radius:2px;"></div>
              <div class="noc2-skel" style="height:16px;width:70%;border-radius:2px;"></div>
            </div>
            <button class="noc2-close-btn" onclick="NOCModal.close()">✕</button>
          </header>
          <div class="noc2-body" style="padding:28px;">${renderSkeleton()}</div>
          <footer class="noc2-footer">
            <div class="noc2-footer-left">
              <div class="noc2-skel" style="height:32px;width:130px;border-radius:4px;"></div>
            </div>
            <div class="noc2-footer-right">
              <div class="noc2-skel" style="height:32px;width:80px;border-radius:4px;"></div>
              <div class="noc2-skel" style="height:32px;width:160px;border-radius:4px;"></div>
            </div>
          </footer>
        </div>`;
      overlay.classList.add('active');
    },

    open(data) {
      state.currentData = data;
      state.isOpen = true;
      const overlay = getOverlay();
      overlay.innerHTML = buildModal(data);
      overlay.classList.add('active');
    },

    close() {
      const overlay = document.getElementById('noc-modal-overlay');
      if (overlay) overlay.classList.remove('active');
      state.isOpen = false;
    },

    toggleSection(id) {
      if (state.collapsedSections.has(id)) {
        state.collapsedSections.delete(id);
      } else {
        state.collapsedSections.add(id);
      }
      const sec = document.getElementById(`noc2-sec-${id}`);
      if (!sec) return;
      const isCollapsed = state.collapsedSections.has(id);
      sec.classList.toggle('collapsed', isCollapsed);
      const chevron = sec.querySelector('.noc2-section-chevron');
      if (chevron) chevron.textContent = isCollapsed ? '▶' : '▼';
    },

    triggerJustify(id) {
      const overlay = document.getElementById('noc-modal-overlay');
      if (overlay) overlay.classList.remove('active');
      setTimeout(() => {
        if (typeof window.openJustificationForm === 'function') {
          window.openJustificationForm(id);
        } else {
          console.error('[NOCModal] openJustificationForm não encontrada.');
        }
      }, 150);
    },
  };
})();

window.NOCModal = NOCModal;
