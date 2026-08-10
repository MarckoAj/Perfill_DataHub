import hubOperationalTagService from "../src/services/hubOperationalTagService.js";

describe("HubOperationalTagService", () => {
  it("extrai tag em markdown no inicio do nome e retorna nome comparavel", () => {
    const result = hubOperationalTagService.extractTags("**Desinstalado** 4B-010 CAMERA", [
      { label: "Desinstalado", normalizedLabel: "DESINSTALADO" }
    ]);

    expect(result.cleanName).toBe("4B-010 CAMERA");
    expect(result.tags).toEqual([
      {
        label: "Desinstalado",
        normalizedLabel: "DESINSTALADO",
        source: "name_prefix"
      }
    ]);
  });

  it("remove tag configurada em texto simples no inicio do nome", () => {
    const result = hubOperationalTagService.extractTags("Desinstalado - 4B-010 CAMERA", [
      { label: "Desinstalado", normalizedLabel: "DESINSTALADO" }
    ]);

    expect(result.cleanName).toBe("4B-010 CAMERA");
    expect(result.tags[0]).toMatchObject({
      label: "Desinstalado",
      normalizedLabel: "DESINSTALADO"
    });
  });

  it("saneia tag markdown do AUVO mesmo sem cadastro previo", () => {
    const result = hubOperationalTagService.extractTags("**CAM-NÃO ENCONTRADA**15-075_PTZ", []);

    expect(result.cleanName).toBe("15-075_PTZ");
    expect(result.tags[0]).toMatchObject({
      label: "CAM-NÃO ENCONTRADA",
      normalizedLabel: "CAM NAO ENCONTRADA"
    });
  });
});
