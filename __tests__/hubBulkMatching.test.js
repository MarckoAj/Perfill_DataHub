import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/repositories/hubMatchingRepository.js', () => ({ default: {} }));
jest.unstable_mockModule('../src/services/hubOperationalTagService.js', () => ({ default: {} }));
const { HubBulkMatchingService } = await import('../src/services/hubBulkMatchingService.js');

function setup(rows, outcomes = []) {
  const matching = {
    extractDeviceCode: value => value,
    resolvePreview: ({ entity }) => entity.preview,
    confirmSingleGlpiMatch: jest.fn(async () => {
      const result = outcomes.shift();
      if (result instanceof Error) throw result;
      return result || { status: 'confirmed' };
    })
  };
  const service = new HubBulkMatchingService({ matching,
    repository: { listHubAuvoEntities: jest.fn().mockResolvedValue(rows), listGlpiDevices: jest.fn().mockResolvedValue([]) },
    tags: { listTags: jest.fn().mockResolvedValue([]) } });
  return { service, matching };
}
function row(id, device = id, overrides = {}) {
  return { entityId: id, preview: { score: 100, canAutoConfirm: true, requiresManualReview: false,
    glpiDeviceId: String(device), candidates: [{ glpiDeviceId: String(device) }], ...overrides } };
}

test('processes more than one page, rejects a simultaneous start and revalidates exact scores', async () => {
  const { service, matching } = setup(Array.from({ length: 151 }, (_, i) => row(i + 1)));
  expect(service.start().started).toBe(true);
  expect(service.start().started).toBe(false);
  await service.completion;
  expect(service.getStatus()).toMatchObject({ status: 'COMPLETED', total: 151, processed: 151, confirmed: 151, active: false });
  expect(matching.confirmSingleGlpiMatch).toHaveBeenCalledWith(expect.objectContaining({ requireExactMatch: true, allowManualReview: false, matchMode: 'both' }));
});

test('excludes linked, lower scores, ambiguities and shared devices including manual claimants', async () => {
  const { service, matching } = setup([
    row(1), { ...row(2), alreadyLinked: true }, row(3, 3, { score: 99 }),
    row(4, 4, { requiresManualReview: true, canAutoConfirm: false }),
    row(5, 50), row(6, 50), row(7, 70), row(8, 70, { score: 88, canAutoConfirm: false }),
    row(9, 9, { candidates: [{ glpiDeviceId: '9' }, { glpiDeviceId: '10' }] })
  ]);
  service.start(); await service.completion;
  expect(service.getStatus()).toMatchObject({ total: 1, confirmed: 1, conflictsExcluded: 3 });
  expect(matching.confirmSingleGlpiMatch).toHaveBeenCalledTimes(1);
});

test('continues after a changed candidate or a write failure, with observable progress', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { service } = setup([row(1), row(2), row(3)], [
    { status: 'not_confirmable', message: 'Alterado' }, new Error('write failed'), { status: 'confirmed' }
  ]);
  service.start(); await service.completion;
  expect(service.getStatus()).toMatchObject({ status: 'PARTIAL', processed: 3, confirmed: 1, skipped: 1, failed: 1 });
  expect(service.getStatus().errors).toHaveLength(2);
  log.mockRestore();
});

test('empty jobs finish and status is an independent snapshot', async () => {
  const { service } = setup([]);
  service.start(); await service.completion;
  expect(service.getStatus()).toMatchObject({ status: 'COMPLETED', total: 0, active: false });
  service.getStatus().errors.push({ message: 'external mutation' });
  expect(service.getStatus().errors).toEqual([]);
});

test('preparation failure releases the job for retry', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { service } = setup([]);
  service.repository.listGlpiDevices.mockRejectedValueOnce(new Error('unavailable'));
  service.start(); await service.completion;
  expect(service.getStatus().status).toBe('FAILED');
  expect(service.start().started).toBe(true);
  await service.completion;
  expect(service.getStatus().status).toBe('COMPLETED');
  log.mockRestore();
});
