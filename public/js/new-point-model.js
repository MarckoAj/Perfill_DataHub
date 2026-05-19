/* =========================================================
   POINT MODAL — MULTI PLATFORM VERSION
========================================================= */

let currentPlatformTab = "hub";
let currentPointTab = "general";

/* =========================================================
   MODAL CONTROL
========================================================= */

function openPointModal(clientId = 1) {
    const overlay = document.getElementById("pointModalOverlay");

    if (!overlay) return;

    overlay.classList.add("active");

    document.body.style.overflow = "hidden";

    const client = clientsMock.find(
        (c) => c.clientId === clientId
    );

    if (!client) return;

    const searchInput =
        overlay.querySelector(".point-search");

    if (searchInput) {
        searchInput.value = client.address || "";
    }

    renderPointTab(client);
}

function closePointModal() {
    const overlay =
        document.getElementById("pointModalOverlay");

    if (!overlay) return;

    overlay.classList.remove("active");

    document.body.style.overflow = "auto";
}

/* =========================================================
   PLATFORM TABS
========================================================= */

function changePlatformTab(tab) {
    currentPlatformTab = tab;

    renderPointTab(clientsMock[0]);
}

function renderPlatformTabs() {
    const tabs = [
        {
            id: "hub",
            label: "HUB",
            status: "success",
        },
        {
            id: "glpi",
            label: "GLPI",
            status: "warning",
            divergences: 2,
        },
        {
            id: "zabbix",
            label: "ZABBIX",
            status: "success",
        },
        {
            id: "auvo",
            label: "AUVO",
            status: "warning",
            divergences: 1,
        },
        {
            id: "history",
            label: "Histórico",
        },
    ];

    return `
    <div class="platform-tabs">

      ${tabs
            .map(
                (tab) => `
        
        <button
          class="platform-tab ${currentPlatformTab === tab.id
                        ? "active"
                        : ""
                    }"
          onclick="changePlatformTab('${tab.id}')"
        >

          <span>${tab.label}</span>

          ${tab.divergences
                        ? `
            <span class="platform-badge">
              ${tab.divergences}
            </span>
          `
                        : ""
                    }

        </button>

      `
            )
            .join("")}

    </div>
  `;
}

/* =========================================================
   TECHNICAL TABS
========================================================= */

function changePointTab(tab) {
    currentPointTab = tab;

    renderPointTab(clientsMock[0]);
}

function renderTabs() {
    const tabs = [
        {
            id: "general",
            label: "Informações Gerais",
        },
        {
            id: "network",
            label: "Informações de Rede",
        },
        {
            id: "status",
            label: "Estado do Ponto",
        },
        {
            id: "attendance",
            label: "Atendimentos",
        },
    ];

    return `
    <div class="point-tabs">

      ${tabs
            .map(
                (tab) => `
        
        <button
          class="point-tab ${currentPointTab === tab.id
                        ? "active"
                        : ""
                    }"
          onclick="changePointTab('${tab.id}')"
        >
          ${tab.label}
        </button>

      `
            )
            .join("")}

    </div>
  `;
}

/* =========================================================
   MAIN RENDER
========================================================= */

function renderPointTab(client) {
    const container =
        document.getElementById(
            "pointTabContent"
        );

    if (!container) return;

    /* ======================================================
       HISTORY TAB
    ====================================================== */

    if (currentPlatformTab === "history") {
        container.innerHTML = `
    
      ${renderPlatformTabs()}

      <div class="history-timeline">

        <div class="timeline-item">

          <div class="timeline-dot success"></div>

          <div class="timeline-content">
            <div class="timeline-title">
              Nome sincronizado via AUVO
            </div>

            <div class="timeline-meta">
              há 12 minutos
            </div>
          </div>

        </div>

        <div class="timeline-item">

          <div class="timeline-dot warning"></div>

          <div class="timeline-content">
            <div class="timeline-title">
              Divergência detectada no GLPI
            </div>

            <div class="timeline-meta">
              há 21 minutos
            </div>
          </div>

        </div>

        <div class="timeline-item">

          <div class="timeline-dot success"></div>

          <div class="timeline-content">
            <div class="timeline-title">
              Coordenadas atualizadas pelo HUB
            </div>

            <div class="timeline-meta">
              Hoje às 18:42
            </div>
          </div>

        </div>

      </div>
    `;

        return;
    }

    /* ======================================================
       GENERAL TAB
    ====================================================== */

    if (currentPointTab === "general") {
        container.innerHTML = `
    
      ${renderPlatformTabs()}

      <div class="point-content-grid">

        <div class="point-left">

          ${renderTabs()}

          <div class="point-info-wrapper">

            <div class="point-info-grid">

              <div>

                ${infoBlock(
            "ID / Endereço",
            client.address
        )}

                ${infoBlock(
            "Nome do ativo",
            "RP01-CJ",
            {
                type:
                    currentPlatformTab ===
                        "glpi"
                        ? "warning"
                        : "success",

                label:
                    currentPlatformTab ===
                        "glpi"
                        ? "Divergente do HUB"
                        : "Sincronizado",
            }
        )}

                ${infoBlock(
            "Tipo",
            client.type
        )}

                ${infoBlock(
            "CICOM",
            client.cicom
        )}

                ${infoBlock(
            "Latitude",
            client.latitude
        )}

                ${infoBlock(
            "Município",
            client.city
        )}

              </div>

              <div>

                ${infoBlock(
            "ID Antigo",
            "00-00 TP - ID ANTIGO"
        )}

                ${infoBlock(
            "Unidade",
            client.unit
        )}

                ${infoBlock(
            "Região",
            client.region
        )}

                ${infoBlock(
            "Longitude",
            client.longitude
        )}

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

    /* ======================================================
       NETWORK TAB
    ====================================================== */

    if (currentPointTab === "network") {
        container.innerHTML = `
    
      ${renderPlatformTabs()}

      <div class="point-content-grid">

        <div class="point-left">

          ${renderTabs()}

          <div class="point-info-wrapper">

            <div class="point-info-grid">

              <div>

                ${infoBlock(
            "IP",
            client.network.ip
        )}

                ${infoBlock(
            "Máscara de Sub-Rede/CIDR",
            client.network.subnet
        )}

                ${infoBlock(
            "Gateway",
            client.network.gateway
        )}

                ${infoBlock(
            "IP WAN",
            client.network.wanIp
        )}

              </div>

              <div>

                ${infoBlock(
            "Circuito",
            client.network.circuit
        )}

                ${infoBlock(
            "Data disponibilidade do link",
            client.network
                .availabilityDate
        )}

              </div>

            </div>

          </div>

        </div>

        <div class="point-right">

          <div class="fake-status-card">

            <div class="fake-status-title">
              ${client.network.linkStatus}
            </div>

            <div class="fake-status-bar"></div>

            <div class="fake-status-uptime">
              ${client.network.uptime}
            </div>

          </div>

        </div>

      </div>
    `;
    }

    /* ======================================================
       STATUS TAB
    ====================================================== */

    if (currentPointTab === "status") {
        container.innerHTML = `
    
      ${renderPlatformTabs()}

      <div class="point-content-grid">

        <div class="point-left">

          ${renderTabs()}

          <div class="point-info-wrapper">

            <div class="point-info-grid">

              <div>

                ${infoBlock(
            "Data da vistoria",
            client.pointStatus
                .inspectionDate
        )}

                ${infoBlock(
            "Instalação da câmera",
            client.pointStatus
                .cameraInstallation
        )}

                ${infoBlock(
            "Substatus Camera Física",
            client.pointStatus
                .cameraSubstitution
        )}

                ${infoBlock(
            "Data Desinstalação",
            client.pointStatus
                .uninstallDate
        )}

                ${infoBlock(
            "Poste Dedicado",
            client.pointStatus
                .dedicatedPole
        )}

              </div>

              <div>

                ${infoBlock(
            "Tipo de Caixa",
            client.pointStatus.boxType
        )}

                ${infoBlock(
            "Instalação de caixa",
            client.pointStatus
                .boxInstallation
        )}

                ${infoBlock(
            "Data Instalação Caixa",
            client.pointStatus
                .boxInstallationDate
        )}

                ${infoBlock(
            "Instalação de Braço",
            client.pointStatus
                .armInstallation
        )}

                ${infoBlock(
            "Estado da instalação do poste",
            client.pointStatus
                .poleStatus
        )}

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

                  <div style="grid-column: span 3;">
                    <strong>
                      ${item.title}
                    </strong>
                  </div>

                  <div>
                    <strong>DE</strong>
                    <span>${item.from}</span>
                  </div>

                  <div>
                    <strong>PARA</strong>
                    <span>${item.to}</span>
                  </div>

                  <div>
                    <strong>Data</strong>
                    <span>${item.date}</span>
                  </div>

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

    /* ======================================================
       ATTENDANCE TAB
    ====================================================== */

    if (currentPointTab === "attendance") {
        container.innerHTML = `
    
      ${renderPlatformTabs()}

      <div class="point-content-grid">

        <div class="point-left">

          ${renderTabs()}

          <div class="point-info-wrapper">

            <div class="point-info-grid">

              <div>

                ${infoBlock(
            "Atendimentos AUVO",
            client.attendances.length
        )}

                ${infoBlock(
            "Tarefas concluídas",
            "12"
        )}

                ${infoBlock(
            "Pendências",
            "02"
        )}

              </div>

              <div>

                ${infoBlock(
            "Chamados GLPI",
            "04"
        )}

                ${infoBlock(
            "Chamados críticos",
            "01"
        )}

                ${infoBlock(
            "Chamados encerrados",
            "08"
        )}

              </div>

            </div>

          </div>

        </div>

        <div class="point-right">

          <div class="attendance-list">

            ${client.attendances
                .map(
                    (task) => `
              
              <div
                class="attendance-item"
                onclick="openAuvoTaskModal(${task.taskId})"
              >

                <div class="attendance-icon ${task.status}">
                </div>

                <div class="attendance-title">
                  ${task.title}
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
}

/* =========================================================
   INFO BLOCK
========================================================= */

function infoBlock(
    label,
    value,
    divergence = null
) {
    return `
  
    <div class="info-block">

      <div class="info-label">
        ${label}
      </div>

      <div class="info-value-wrapper">

        <div class="info-value">
          ${value || "N/A"}
        </div>

        ${divergence
            ? `
          
          <div class="divergence-badge ${divergence.type}">
            ${divergence.label}
          </div>

        `
            : ""
        }

      </div>

    </div>

  `;
}