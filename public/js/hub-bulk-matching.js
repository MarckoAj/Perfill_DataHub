(() => {
  const button = document.getElementById('hubBulkStart');
  const status = document.getElementById('hubBulkStatus');
  const fill = document.getElementById('hubBulkFill');
  const track = document.getElementById('hubBulkTrack');
  const panel = status.closest('.hub-bulk-progress');
  let requesting = false;
  let lastFinished = null;
  let timer;

  function render(state) {
    button.disabled = state.active;
    panel.dataset.status = state.status;
    const labels = { IDLE: 'Pronto', PREPARING: 'Analisando candidatos...', RUNNING: 'Vinculando',
      COMPLETED: 'Concluído', PARTIAL: 'Concluído com falhas', FAILED: 'Falha na preparação' };
    const icon = { COMPLETED: '✓ ', PARTIAL: '⚠ ', FAILED: '✕ ' }[state.status] || '';
    status.textContent = `${icon}${labels[state.status] || state.status} · Processados: ${state.processed}/${state.total}`;
    const finished = ['COMPLETED', 'PARTIAL'].includes(state.status);
    const percent = finished ? 100 : state.total ? Math.min(100, Math.round(state.processed / state.total * 100)) : 0;
    fill.style.width = `${percent}%`;
    fill.classList.toggle('active', state.active);
    track.setAttribute('aria-valuenow', String(percent));
    track.setAttribute('aria-valuetext', `${labels[state.status] || state.status}: ${percent}%`);
    document.getElementById('hubBulkCounts').textContent = `${state.confirmed} vinculados · ${state.skipped} ignorados · ${state.failed} falhas · ${state.conflictsExcluded} excluídos por disputa entre HUBs`;
    const errors = document.getElementById('hubBulkErrors');
    errors.replaceChildren();
    for (const entry of state.errors || []) {
      const li = document.createElement('li');
      li.textContent = `${entry.entityId ? `HUB ${entry.entityId} / GLPI ${entry.glpiDeviceId}: ` : ''}${entry.message}`;
      errors.appendChild(li);
    }
    document.getElementById('hubBulkDetails').hidden = !errors.childElementCount;
    if (!state.active && state.runId && lastFinished !== state.runId) {
      lastFinished = state.runId;
      if (document.getElementById('hubMatchingApp').style.display !== 'none') loadHubMatchingPreview(1);
    }
  }

  async function request(start = false) {
    if (requesting) return;
    clearTimeout(timer);
    requesting = true;
    button.disabled = true;
    try {
      const response = await fetch(`/api/hub/matching/glpi/bulk${start ? '' : '/status'}`, {
        method: start ? 'POST' : 'GET', headers: getHubMatchTokenHeaders()
      });
      if (!response.ok && response.status !== 409) throw new Error(`HTTP ${response.status}`);
      const state = await response.json();
      render(state);
      timer = setTimeout(() => request(), state.active ? 1000 : 5000);
    } catch (error) {
      status.textContent = 'Não foi possível consultar o lote. Reconectando...';
      // A failed response may still have started a job. Query before enabling another start.
      timer = setTimeout(() => request(), 5000);
    } finally {
      requesting = false;
    }
  }

  button.addEventListener('click', () => {
    if (confirm('Vincular todos os cadastros com 100% em ID + Nome e sem ambiguidade? A operação inclui todas as páginas, independentemente dos filtros, e registra os vínculos no histórico do HUB.')) request(true);
  });
  request();
})();
