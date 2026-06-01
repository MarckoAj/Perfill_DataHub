import { jest } from "@jest/globals";

const queryMock = jest.fn();

jest.unstable_mockModule("../../src/database/connection.js", () => ({
  default: {
    query: queryMock
  }
}));

const auvoCustomerRepository = (await import("../../src/repositories/auvo/auvoCustomerRepository.js")).default;

describe("AuvoCustomerRepository", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([{ affectedRows: 1 }]);
  });

  test("persiste os grupos do cliente quando groupsId vem da API", async () => {
    await auvoCustomerRepository.upsertCustomers([
      {
        id: 123,
        externalId: "ID_EXTERNO_123",
        description: "Nome do Cliente",
        cpfCnpj: "00.000.000/0000-00",
        active: true,
        segmentId: [1],
        groupsId: [10, "20"]
      }
    ]);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers_auvo"),
      expect.arrayContaining([123])
    );
    expect(queryMock).toHaveBeenCalledWith("DELETE FROM customers_groups WHERE customerId = ?", [123]);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers_groups"),
      [123, 10, 123, 10]
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers_groups"),
      [123, 20, 123, 20]
    );
  });

  test("limpa relacoes antigas quando groupsId vem vazio", async () => {
    await auvoCustomerRepository.upsertCustomers([
      {
        id: 123,
        active: true,
        segmentId: 1,
        groupsId: []
      }
    ]);

    expect(queryMock).toHaveBeenCalledWith("DELETE FROM customers_groups WHERE customerId = ?", [123]);
    expect(queryMock).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers_groups"),
      expect.any(Array)
    );
  });

  test("nao altera relacoes quando groupsId nao veio na resposta", async () => {
    await auvoCustomerRepository.upsertCustomers([
      {
        id: 123,
        active: true,
        segmentId: 1
      }
    ]);

    expect(queryMock).not.toHaveBeenCalledWith("DELETE FROM customers_groups WHERE customerId = ?", [123]);
    expect(queryMock).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers_groups"),
      expect.any(Array)
    );
  });
});
