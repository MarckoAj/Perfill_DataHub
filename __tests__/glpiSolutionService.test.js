import { jest } from "@jest/globals";

const glpiRequestDataMock = jest.fn();
const upsertBatchMock = jest.fn();

jest.unstable_mockModule("../src/integrations/glpi/glpiClient.js", () => ({
  default: {
    glpiRequestData: glpiRequestDataMock,
  },
}));

jest.unstable_mockModule("../src/repositories/glpi/glpiSolutionRepository.js", () => ({
  default: {
    upsertBatch: upsertBatchMock,
  },
}));

const glpiSolutionService = (await import("../src/services/glpiSolutionService.js")).default;

describe("GlpiSolutionService", () => {
  beforeEach(() => {
    glpiRequestDataMock.mockReset();
    upsertBatchMock.mockReset();
    glpiSolutionService.solutionTypeCache.clear();
    glpiSolutionService.userCache.clear();
  });

  it("ignora solutiontypes_id zero ou vazio sem consultar o GLPI", async () => {
    await expect(glpiSolutionService.getSolutionTypeName(0)).resolves.toBeNull();
    await expect(glpiSolutionService.getSolutionTypeName("0")).resolves.toBeNull();
    await expect(glpiSolutionService.getSolutionTypeName(null)).resolves.toBeNull();

    expect(glpiRequestDataMock).not.toHaveBeenCalled();
  });

  it("consulta SolutionType como enriquecimento silencioso e cacheia falhas", async () => {
    glpiRequestDataMock.mockResolvedValueOnce(null);

    await expect(glpiSolutionService.getSolutionTypeName(4)).resolves.toBeNull();
    await expect(glpiSolutionService.getSolutionTypeName(4)).resolves.toBeNull();

    expect(glpiRequestDataMock).toHaveBeenCalledTimes(1);
    expect(glpiRequestDataMock).toHaveBeenCalledWith(
      "SolutionType",
      "GET",
      null,
      4,
      { suppressErrorLog: true }
    );
  });
});
