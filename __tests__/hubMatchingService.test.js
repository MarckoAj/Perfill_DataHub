import { jest } from "@jest/globals";

const repositoryMock = {
  listHubAuvoEntities: jest.fn(),
  listGlpiDevices: jest.fn(),
  getGlpiDevice: jest.fn(),
  upsertGlpiLink: jest.fn(),
  insertLinkHistory: jest.fn()
};

jest.unstable_mockModule("../src/repositories/hubMatchingRepository.js", () => ({
  default: repositoryMock
}));

jest.unstable_mockModule("../src/services/hubOperationalTagService.js", () => ({
  default: {
    listTags: jest.fn().mockResolvedValue([
      { label: "Desinstalado", normalizedLabel: "DESINSTALADO" }
    ]),
    normalizeNameForComparison: jest.fn((value, tags = []) => {
      let text = String(value || "").trim();
      text = text.replace(/^([*_`~]{1,3})([^*_`~]{2,80})\1\s*/i, "");
      for (const tag of tags) {
        const label = tag.label || tag;
        text = text.replace(new RegExp(`^\\*\\*${label}\\*\\*\\s*`, "i"), "");
        text = text.replace(new RegExp(`^${label}\\s*[-_:|]*\\s*`, "i"), "");
      }
      return text.trim();
    })
  }
}));

const { default: hubMatchingService } = await import("../src/services/hubMatchingService.js");

describe("HubMatchingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gera preview de match por ID + nome com score 100", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 14446,
        hubName: "64-097_PTZ_AV IGUATEMI",
        auvoCustomerId: "14988457",
        auvoName: "64-097_PTZ_AV IGUATEMI",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      {
        deviceId: "10301",
        name: "64-097_PTZ_AV IGUATEMI",
        auvoCustomerId: "14988457"
      }
    ]);

    const result = await hubMatchingService.previewGlpiMatching({ mode: "both" });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      entityId: 14446,
      glpiDeviceId: "10301",
      status: "match_ambos",
      score: 100,
      canAutoConfirm: true,
      propagationBlocked: true
    });
  });

  it("ordena preview por maior score", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 1,
        hubName: "ALFA",
        auvoCustomerId: "1",
        auvoName: "ALFA",
        alreadyLinked: false
      },
      {
        entityId: 2,
        hubName: "64-097 CAMERA",
        auvoCustomerId: "2",
        auvoName: "64-097 CAMERA",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "10", name: "SEM RELACAO", auvoCustomerId: "1" },
      { deviceId: "11", name: "64-097 CAMERA", auvoCustomerId: "2" }
    ]);

    const result = await hubMatchingService.previewGlpiMatching({
      mode: "both",
      sort: "score_desc",
      includeLowScore: true
    });

    expect(result.meta.sort).toBe("score_desc");
    expect(result.data.map(item => item.entityId)).toEqual([2, 1]);
    expect(result.data[0].score).toBeGreaterThan(result.data[1].score);
  });

  it("marca vinculo existente como ja_vinculado", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 14446,
        hubName: "64-097_PTZ_AV IGUATEMI",
        auvoCustomerId: "14988457",
        auvoName: "64-097_PTZ_AV IGUATEMI",
        alreadyLinked: true,
        linkedGlpiDeviceId: "10301",
        linkedConfidenceScore: 100,
        linkedMatchStrategy: "manual_pilot"
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      {
        deviceId: "10301",
        name: "64-097_PTZ_AV IGUATEMI",
        auvoCustomerId: "14988457"
      }
    ]);

    const result = await hubMatchingService.confirmSingleGlpiMatch({
      entityId: 14446,
      glpiDeviceId: "10301",
      matchMode: "both"
    });

    expect(result).toMatchObject({
      success: true,
      status: "already_linked",
      propagationBlocked: true
    });
    expect(repositoryMock.upsertGlpiLink).not.toHaveBeenCalled();
  });

  it("resume fila operacional sem contar itens ja vinculados como pendencia", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 1,
        hubName: "CAMERA TESTE",
        auvoCustomerId: "999",
        auvoName: "CAMERA TESTE",
        alreadyLinked: false
      },
      {
        entityId: 2,
        hubName: "CAMERA JA VINCULADA",
        auvoCustomerId: "888",
        auvoName: "CAMERA JA VINCULADA",
        alreadyLinked: true,
        linkedGlpiDeviceId: "20",
        linkedConfidenceScore: 100,
        linkedMatchStrategy: "manual"
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "10", name: "CAMERA TESTE A", auvoCustomerId: "999" },
      { deviceId: "11", name: "CAMERA TESTE B", auvoCustomerId: "999" },
      { deviceId: "20", name: "CAMERA JA VINCULADA", auvoCustomerId: "888" }
    ]);

    const result = await hubMatchingService.previewGlpiMatching({
      mode: "id",
      includeLinked: true
    });

    expect(result.meta.statusCounts).toMatchObject({
      total: 2,
      ja_vinculado: 1,
      ambiguo: 1,
      reviewQueue: 1,
      pending: 1,
      pendingAmbiguo: 1,
      pendingReviewQueue: 1,
      pendingBaixoScore: 0
    });
  });

  it("bloqueia confirmacao em lote para caso ambiguo de revisao manual", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 1,
        hubName: "CAMERA TESTE",
        auvoCustomerId: "999",
        auvoName: "CAMERA TESTE",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "10", name: "CAMERA TESTE A", auvoCustomerId: "999" },
      { deviceId: "11", name: "CAMERA TESTE B", auvoCustomerId: "999" }
    ]);

    const result = await hubMatchingService.confirmGlpiMatches({
      items: [{ entityId: 1, glpiDeviceId: "10", matchMode: "id", score: 100 }]
    });

    expect(result).toMatchObject({
      success: false,
      confirmed: 0,
      failed: 1,
      propagationBlocked: true
    });
    expect(result.results[0].status).toBe("not_confirmable");
    expect(repositoryMock.upsertGlpiLink).not.toHaveBeenCalled();
  });

  it("permite confirmacao individual de candidato revisado manualmente", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 1,
        hubName: "CAMERA TESTE",
        auvoCustomerId: "999",
        auvoName: "CAMERA TESTE",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "10", name: "CAMERA TESTE A", auvoCustomerId: "999" },
      { deviceId: "11", name: "CAMERA TESTE B", auvoCustomerId: "999" }
    ]);
    repositoryMock.getGlpiDevice.mockResolvedValue({
      deviceId: "10",
      name: "CAMERA TESTE A",
      auvoCustomerId: "999"
    });

    const result = await hubMatchingService.confirmSingleGlpiMatch({
      entityId: 1,
      glpiDeviceId: "10",
      matchMode: "id",
      score: 100,
      confirmedBy: "test"
    });

    expect(result).toMatchObject({
      success: true,
      status: "confirmed",
      entityId: 1,
      glpiDeviceId: "10",
      propagationBlocked: true
    });
    expect(repositoryMock.upsertGlpiLink).toHaveBeenCalledTimes(1);
    expect(repositoryMock.insertLinkHistory).toHaveBeenCalledTimes(1);
  });

  it("permite confirmacao individual explicita de baixo score", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 2,
        hubName: "CAMERA NORTE",
        auvoCustomerId: "222",
        auvoName: "CAMERA NORTE",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "20", name: "PONTO DIVERGENTE", auvoCustomerId: "222" }
    ]);
    repositoryMock.getGlpiDevice.mockResolvedValue({
      deviceId: "20",
      name: "PONTO DIVERGENTE",
      auvoCustomerId: "222"
    });

    const result = await hubMatchingService.confirmSingleGlpiMatch({
      entityId: 2,
      glpiDeviceId: "20",
      matchMode: "both",
      score: 50,
      confirmedBy: "test",
      allowLowScoreManual: true
    });

    expect(result).toMatchObject({
      success: true,
      status: "confirmed",
      entityId: 2,
      glpiDeviceId: "20",
      propagationBlocked: true
    });
    expect(repositoryMock.upsertGlpiLink).toHaveBeenCalledTimes(1);
    expect(repositoryMock.insertLinkHistory).toHaveBeenCalledTimes(1);
  });

  it("ignora tag operacional no inicio do nome ao calcular score", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 3,
        hubName: "**Desinstalado** 64-097 CAMERA",
        auvoCustomerId: "333",
        auvoName: "**Desinstalado** 64-097 CAMERA",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      { deviceId: "30", name: "64-097 CAMERA", auvoCustomerId: "333" }
    ]);

    const result = await hubMatchingService.previewGlpiMatching({ mode: "both" });

    expect(result.data[0]).toMatchObject({
      entityId: 3,
      glpiDeviceId: "30",
      status: "match_ambos",
      score: 100
    });
  });

  it("usa fallback por nome no modo ambos quando GLPI nao tem ID AUVO", async () => {
    repositoryMock.listHubAuvoEntities.mockResolvedValue([
      {
        entityId: 14544,
        hubName: "*CÂMERA-DESINSTALADA*41-064_RF_TP_IV_RUA PEDRO GAMA",
        auvoCustomerId: "15279269",
        auvoName: "*CÂMERA-DESINSTALADA*41-064_RF_TP_IV_RUA PEDRO GAMA",
        alreadyLinked: false
      }
    ]);
    repositoryMock.listGlpiDevices.mockResolvedValue([
      {
        deviceId: "10345",
        name: "41-064_RF_TP_IV_RUA PEDRO GAMA",
        auvoCustomerId: null
      }
    ]);

    const result = await hubMatchingService.previewGlpiMatching({ mode: "both" });

    expect(result.data[0]).toMatchObject({
      entityId: 14544,
      glpiDeviceId: "10345",
      status: "match_nome",
      matchOrigin: "name_fallback_no_glpi_auvo_id",
      score: 100,
      canAutoConfirm: true
    });
  });
});
