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
});
