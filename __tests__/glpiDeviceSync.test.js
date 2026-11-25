import { jest } from '@jest/globals';
const request = jest.fn();
const query = jest.fn().mockResolvedValue([[]]);
jest.unstable_mockModule('../src/integrations/glpi/glpiClient.js', () => ({ default: { glpiRequestData: request } }));
jest.unstable_mockModule('../src/database/connection.js', () => ({ default: { query } }));
const { default: service } = await import('../src/services/glpiDeviceSyncService.js');
const { default: repo } = await import('../src/repositories/hubEntityRepository.js');
beforeEach(() => { request.mockReset(); query.mockClear(); });
test('coleta Location e catálogo, mantendo os dois CICOM separados e coordenada zero', async () => {
  request.mockImplementation(async (type, method, body, id) => ({ data: {
    Peripheral: { id: 4412, name: 'Ponto', locations_id: 12341, peripheraltypes_id: 2, groups_id_tech: 20 },
    PeripheralType: { id: 2, name: 'CAMERA FIXA' },
    Group: { id: 20, completename: 'CICOM dispositivo' },
    Location: { id: 12341, town: 'OLINDINA', state: 'CICOM localização', latitude: 0, longitude: '-38.328445' }
  }[type] }));
  const device = await service.syncDeviceDetails(4412);
  expect(device).toMatchObject({ locationId: 12341, deviceType: 'CAMERA FIXA', cicom: 'CICOM dispositivo', latitude: 0, longitude: -38.328445 });
  expect(device.rawJson.location.state).toBe('CICOM localização');
  expect(device.rawJson.location.town).toBe('OLINDINA');
});
test('falha na localização não grava snapshot incompleto', async () => {
  request.mockResolvedValueOnce({ data: { id: 4412, locations_id: 12341 } }).mockResolvedValueOnce(null);
  await expect(service.syncDeviceDetails(4412)).rejects.toThrow('Location/12341');
  expect(query).not.toHaveBeenCalled();
});
test('consulta parcial não apaga localização ou outros campos ausentes', async () => {
  const partial = service.mapPeripheral({ 2: 4412, 1: 'Nome', 8: '8561713', 3: 'Local' });
  await repo.upsertGlpiDevice(partial);
  const [sql, values] = query.mock.calls[0];
  expect(sql).not.toContain('locationId =');
  expect(sql).not.toContain('latitude =');
  expect(sql).not.toContain('cicom =');
  expect(sql).not.toContain('updateSource =');
  expect(sql).toContain('JSON_MERGE_PATCH');
  expect(values[0]).toBe(4412);
});
test('nulo explícito limpa o campo e zero permanece válido', async () => {
  await repo.upsertGlpiDevice({ deviceId: 4412, cicom: null, latitude: 0 });
  expect(query.mock.calls[0][0]).toContain('cicom = VALUES(cicom)');
  expect(query.mock.calls[0][1]).toEqual([4412, null, 0]);
});
