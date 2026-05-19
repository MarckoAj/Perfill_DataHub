const clientsMock = [
  {
    clientId: 1,
    ticketId: "00000",
    pointId: "00-000",
    address:
      "00-000 - TP - RUA NOME DA RUA BAIRRO REFERENCIA",
    type: "TIP",
    cicom: "CICOM - Salvador",
    city: "Salvador",
    unit: "00 CIPM",
    region: "Salvador-RMS",

    latitude: -13.008158,
    longitude: -38.52627,

    network: {
      ip: "10.10.10.10",
      gateway: "10.10.10.1",
      subnet: "255.255.0.0/16",
      wanIp: "10.10.10.20",
      circuit: "ABC0000000",
      linkStatus: "UP",
      uptime: "31 dias, 22:22:49",
      availabilityDate: "10/10/2010",
    },

    pointStatus: {
      inspectionDate: "12/12/2012",
      cameraInstallation: "12/12/2012",
      cameraSubstitution: "PI - Desinstalado",
      uninstallDate: "12/12/2012",
      dedicatedPole: "Não",
      installationDate: "N/A",

      boxType: "Caixa hermética",
      boxInstallation: "Concluída",
      boxInstallationDate: "12/12/2012",

      armInstallation: "Não se aplica",
      poleStatus: "N/A",
    },

    operationalHistory: [
      {
        title: "Atualização Instalação da câmera",
        from: "Concluída",
        to: "Ponto vandalizado",
        date: "20/10/2021",
      },
      {
        title: "Atualização Instalação da câmera",
        from: "Sem rede elétrica Coelba",
        to: "Concluída",
        date: "20/10/2021",
      },
      {
        title: "Atualização Instalação da câmera",
        from: "Apoio PM",
        to: "Sem rede elétrica Coelba",
        date: "20/10/2021",
      },
    ],

    attendances: [
      {
        taskId: 1,
        status: "warning",
        title:
          "00-00 TIPO Nome do ponto - tipo da tarefa",
        technician: "Carlos",
        date: "12/12/2025",
      },
      {
        taskId: 2,
        status: "moving",
        title:
          "00-00 TIPO Nome do ponto - tipo da tarefa",
        technician: "Marcos",
        date: "12/12/2025",
      },
      {
        taskId: 3,
        status: "done",
        title:
          "00-00 TIPO Nome do ponto - tipo da tarefa",
        technician: "João",
        date: "12/12/2025",
      },
    ],
  },
];
