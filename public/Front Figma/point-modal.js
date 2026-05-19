let currentPointTab = "general";

function openPointModal(clientId = 1) {
  const overlay = document.getElementById("pointModalOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  const client = clientsMock.find((c) => c.clientId === clientId);
  if (!client) return;

  // Atualizar cabeçalho se necessário
  const searchInput = overlay.querySelector(".point-search");
  if (searchInput) searchInput.value = client.address || "";

  renderPointTab(client);
}

function closePointModal() {
  const overlay = document.getElementById("pointModalOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

function changePointTab(tab) {
  currentPointTab = tab;
  renderPointTab(clientsMock[0]);
}

function renderTabs() {
  const tabs = [
    { id: "general", label: "Informações Gerais" },
    { id: "network", label: "Informações de Rede" },
    { id: "status", label: "Estado do Ponto" },
    { id: "attendance", label: "Atendimentos" },
  ];

  return `
    <div class="point-tabs">
      ${tabs
        .map(
          (t) => `
        <button
          class="point-tab ${currentPointTab === t.id ? "active" : ""}"
          onclick="changePointTab('${t.id}')"
        >
          ${t.label}
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

function renderPointTab(client) {
  const container = document.getElementById("pointTabContent");
  if (!container) return;

  if (currentPointTab === "general") {
    container.innerHTML = `
      <div class="point-content-grid">
        <div class="point-left">
          ${renderTabs()}
          <div class="point-info-wrapper">
            <div class="point-info-grid">
              <div>
                ${infoBlock("ID / Endereço", client.address)}
                ${infoBlock("Tipo", client.type)}
                ${infoBlock("CICOM", client.cicom)}
                ${infoBlock("Latitude", client.latitude)}
                ${infoBlock("Município", client.city)}
              </div>
              <div>
                ${infoBlock("ID Antigo", "00-00 TP - ID ANTIGO")}
                ${infoBlock("Unidade", client.unit)}
                ${infoBlock("Região", client.region)}
                ${infoBlock("Longitude", client.longitude)}
              </div>
            </div>
          </div>
        </div>
        <div class="point-right">
          <div class="point-map">
            <iframe
              src="https://maps.google.com/maps?q=${client.latitude},${client.longitude}&z=15&output=embed">
            </iframe>
          </div>
        </div>
      </div>
    `;
  }

  if (currentPointTab === "network") {
    container.innerHTML = `
      <div class="point-content-grid">
        <div class="point-left">
          ${renderTabs()}
          <div class="point-info-wrapper">
            <div class="point-info-grid">
              <div>
                ${infoBlock("IP", client.network.ip)}
                ${infoBlock("Máscara de Sub-Rede/CIDR", client.network.subnet)}
                ${infoBlock("Gateway", client.network.gateway)}
                ${infoBlock("IP Wan", client.network.wanIp)}
              </div>
              <div>
                ${infoBlock("Circuito", client.network.circuit)}
                ${infoBlock("Data disponibilidade do link", client.network.availabilityDate)}
              </div>
            </div>
          </div>
        </div>
        <div class="point-right">
          <div class="fake-status-card">
            <div class="fake-status-title">${client.network.linkStatus}</div>
            <div class="fake-status-bar"></div>
            <div class="fake-status-uptime">${client.network.uptime}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (currentPointTab === "status") {
    container.innerHTML = `
      <div class="point-content-grid">
        <div class="point-left">
          ${renderTabs()}
          <div class="point-info-wrapper">
            <div class="point-info-grid">
              <div>
                ${infoBlock("Data da vistoria", client.pointStatus.inspectionDate)}
                ${infoBlock("Instalação da câmera", client.pointStatus.cameraInstallation)}
                ${infoBlock("Substatus Camera Fisica", client.pointStatus.cameraSubstitution)}
                ${infoBlock("Data Desinstalação", client.pointStatus.uninstallDate)}
                ${infoBlock("Poste Dedicado", client.pointStatus.dedicatedPole)}
              </div>
              <div>
                ${infoBlock("Tipo de Caixa", client.pointStatus.boxType)}
                ${infoBlock("Instalação de caixa", client.pointStatus.boxInstallation)}
                ${infoBlock("Data Instalação Caixa", client.pointStatus.boxInstallationDate)}
                ${infoBlock("Instalação de Braço", client.pointStatus.armInstallation)}
                ${infoBlock("Estado da instalação do poste", client.pointStatus.poleStatus)}
              </div>
            </div>
          </div>
        </div>
        <div class="point-right">
          <div class="operational-history">
            ${client.operationalHistory
              .map(
                (item) => `
              <div class="history-card">
                <div class="history-grid">
                  <div style="grid-column: span 3; color: white; margin-bottom: 4px;"><strong>${item.title}</strong></div>
                  <div><strong>DE</strong><span>${item.from}</span></div>
                  <div><strong>PARA</strong><span>${item.to}</span></div>
                  <div><strong>Data</strong><span>${item.date}</span></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  if (currentPointTab === "attendance") {
    container.innerHTML = `
      <div class="point-content-grid">
        <div class="point-left">
          ${renderTabs()}
          <div class="point-info-wrapper">
            <div class="point-info-grid">
              <div>
                ${infoBlock("Atendimentos AUVO", client.attendances.length)}
                ${infoBlock("Quantidade de tarefas feitas 1", "00")}
                ${infoBlock("Quantidade de tarefas feitas 2", "00")}
              </div>
              <div>
                ${infoBlock("Chamados GLPI", "00")}
                ${infoBlock("Quantidade de tarefas feitas 1", "00")}
                ${infoBlock("Quantidade de tarefas feitas 2", "00")}
              </div>
            </div>
          </div>
        </div>
        <div class="point-right">
          <div class="attendance-list">
            ${client.attendances
              .map(
                (task) => `
              <div class="attendance-item" onclick="openAuvoTaskModal(${task.taskId})">
                <div class="attendance-icon ${task.status}"></div>
                <div class="attendance-title">${task.title}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }
}

function infoBlock(label, value) {
  return `
    <div class="info-block">
      <div class="info-label">${label}</div>
      <div class="info-value">${value || "N/A"}</div>
    </div>
  `;
}
