let hubTags = [];
let selectedTagId = null;

function tokenHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  return {
    ...extra,
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: tokenHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {})
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
  return payload;
}

async function loadTags() {
  const payload = await apiJson("/api/hub/tags");
  hubTags = Array.isArray(payload.data) ? payload.data : [];
  renderTags();
}

function renderTags() {
  const list = document.getElementById("tagList");
  const count = document.getElementById("tagCount");
  if (count) count.textContent = `${hubTags.length} tags`;
  if (!list) return;

  if (hubTags.length === 0) {
    list.innerHTML = '<div class="tag-empty">Nenhuma tag cadastrada</div>';
    return;
  }

  list.innerHTML = hubTags.map(tag => `
    <article class="tag-card">
      <div class="tag-card-main">
        <div class="tag-title-row">
          <span class="tag-color-dot" style="background:${escapeHtml(tag.color || "#14e7c5")}"></span>
          <strong>${escapeHtml(tag.label)}</strong>
          ${tag.hideByDefault ? '<span class="tag-status-chip warning">Oculta por padrao</span>' : ''}
        </div>
        <div class="tag-card-meta">${escapeHtml(tag.description || "Sem descricao")}</div>
        <div class="tag-alias-list">
          ${(tag.aliases || []).length
            ? tag.aliases.map(alias => `
                <span class="tag-alias-chip">
                  ${escapeHtml(alias.alias)}
                  <button type="button" onclick="removeAlias(${Number(alias.aliasId)})" aria-label="Remover tolerancia ${escapeHtml(alias.alias)}">x</button>
                </span>
              `).join("")
            : '<span class="tag-alias-chip">Sem tolerancias</span>'}
        </div>
      </div>
      <div class="tag-card-actions">
        <button type="button" class="tag-icon-btn" onclick="editTag(${Number(tag.tagId)})" title="Editar tag" aria-label="Editar tag">E</button>
        <button type="button" class="tag-icon-btn" onclick="promptAlias(${Number(tag.tagId)})" title="Adicionar tolerancia" aria-label="Adicionar tolerancia">+</button>
        <button type="button" class="tag-icon-btn" onclick="deleteTag(${Number(tag.tagId)})" title="Inativar tag" aria-label="Inativar tag">x</button>
      </div>
    </article>
  `).join("");
}

function clearTagForm() {
  selectedTagId = null;
  document.getElementById("tagFormTitle").textContent = "Nova tag";
  document.getElementById("tagId").value = "";
  document.getElementById("tagLabel").value = "";
  document.getElementById("tagDescription").value = "";
  document.getElementById("tagColor").value = "#14e7c5";
  document.getElementById("tagDisplayOrder").value = "0";
  document.getElementById("tagHideByDefault").checked = false;
  document.getElementById("tagAliases").value = "";
}

function editTag(tagId) {
  const tag = hubTags.find(item => Number(item.tagId) === Number(tagId));
  if (!tag) return;

  selectedTagId = tag.tagId;
  document.getElementById("tagFormTitle").textContent = `Editar ${tag.label}`;
  document.getElementById("tagId").value = tag.tagId;
  document.getElementById("tagLabel").value = tag.label || "";
  document.getElementById("tagDescription").value = tag.description || "";
  document.getElementById("tagColor").value = tag.color || "#14e7c5";
  document.getElementById("tagDisplayOrder").value = tag.displayOrder || 0;
  document.getElementById("tagHideByDefault").checked = Boolean(tag.hideByDefault);
  document.getElementById("tagAliases").value = (tag.aliases || []).map(alias => alias.alias).join("\n");
}

async function saveTag(event) {
  event.preventDefault();

  const tagId = document.getElementById("tagId").value;
  const body = {
    label: document.getElementById("tagLabel").value.trim(),
    description: document.getElementById("tagDescription").value.trim(),
    color: document.getElementById("tagColor").value,
    displayOrder: Number(document.getElementById("tagDisplayOrder").value || 0),
    hideByDefault: document.getElementById("tagHideByDefault").checked,
    aliases: document.getElementById("tagAliases").value
  };

  if (!body.label) return;

  if (tagId) {
    await apiJson(`/api/hub/tags/${encodeURIComponent(tagId)}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  } else {
    await apiJson("/api/hub/tags", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  clearTagForm();
  await loadTags();
}

async function deleteTag(tagId) {
  const tag = hubTags.find(item => Number(item.tagId) === Number(tagId));
  if (!tag || !confirm(`Inativar a tag "${tag.label}"?`)) return;
  await apiJson(`/api/hub/tags/${encodeURIComponent(tagId)}`, { method: "DELETE" });
  if (Number(selectedTagId) === Number(tagId)) clearTagForm();
  await loadTags();
}

async function promptAlias(tagId) {
  const tag = hubTags.find(item => Number(item.tagId) === Number(tagId));
  if (!tag) return;
  const alias = prompt(`Nova tolerancia para "${tag.label}"`);
  if (!alias?.trim()) return;

  await apiJson(`/api/hub/tags/${encodeURIComponent(tagId)}/aliases`, {
    method: "POST",
    body: JSON.stringify({ alias: alias.trim() })
  });
  await loadTags();
}

async function removeAlias(aliasId) {
  if (!confirm("Remover esta tolerancia?")) return;
  await apiJson(`/api/hub/tag-aliases/${encodeURIComponent(aliasId)}`, {
    method: "DELETE"
  });
  await loadTags();
}

async function previewName(event) {
  event.preventDefault();
  const name = document.getElementById("previewName").value.trim();
  const result = document.getElementById("previewResult");
  if (!name || !result) return;

  try {
    const payload = await apiJson("/api/hub/tags/preview", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    const data = payload.data || {};
    const tags = Array.isArray(data.tags) ? data.tags : [];
    result.innerHTML = `
      <div><strong>Nome limpo:</strong> ${escapeHtml(data.cleanName || "N/A")}</div>
      <div><strong>Tags:</strong> ${
        tags.length
          ? tags.map(tag => `<span class="tag-alias-chip">${escapeHtml(tag.label)}</span>`).join(" ")
          : "Nenhuma tag aplicada"
      }</div>
    `;
  } catch (error) {
    result.innerHTML = `<span>Falha ao testar regras: ${escapeHtml(error.message)}</span>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tagForm")?.addEventListener("submit", saveTag);
  document.getElementById("previewForm")?.addEventListener("submit", previewName);
  document.getElementById("clearFormBtn")?.addEventListener("click", clearTagForm);
  loadTags().catch(error => {
    const list = document.getElementById("tagList");
    if (list) list.innerHTML = `<div class="tag-empty">Falha ao carregar tags: ${escapeHtml(error.message)}</div>`;
  });
});
