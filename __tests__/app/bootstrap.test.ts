import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests, getDb } from '@/data/db';
import { categoriesRepo } from '@/data/categoriesRepo';
import * as permissions from '@/sms/permissions';
import * as inbox from '@/sms/inbox';

jest.mock('@/sms/permissions', () => ({
  hasSmsPermissions: jest.fn(),
  requestSmsPermissions: jest.fn(),
}));
jest.mock('@/sms/inbox', () => ({
  backfill: jest.fn(),
}));
jest.mock('@/sms/liveBridge', () => ({
  registerSmsHeadlessTask: jest.fn(),
}));

import { bootstrap } from '@/app/bootstrap';

const mockHasPerms = jest.mocked(permissions.hasSmsPermissions);
const mockRequestPerms = jest.mocked(permissions.requestSmsPermissions);
const mockBackfill = jest.mocked(inbox.backfill);

let db: any;
beforeEach(() => {
  db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db);
  jest.clearAllMocks();
});
afterEach(() => { _setDbForTests(null); db.close(); });

test('bootstrap runs migrations and seeds defaults', async () => {
  mockHasPerms.mockResolvedValue(false);
  mockRequestPerms.mockResolvedValue(false);
  mockBackfill.mockResolvedValue({ scanned: 0, inserted: 0 });
  const result = await bootstrap();
  expect(result.firstRun).toBe(true);
  const cats = categoriesRepo.listCategories(db);
  expect(cats.length).toBeGreaterThan(0);
});

test('deny on first run, grant on second cold start triggers backfill', async () => {
  mockHasPerms.mockResolvedValue(false);
  mockRequestPerms.mockResolvedValue(false);
  mockBackfill.mockResolvedValue({ scanned: 0, inserted: 0 });
  await bootstrap();
  expect(mockBackfill).not.toHaveBeenCalled();

  // Simulate user granted SMS via system settings before next cold start
  mockHasPerms.mockResolvedValue(true);
  const result = await bootstrap();
  expect(result.firstRun).toBe(false);
  expect(mockBackfill).toHaveBeenCalledTimes(1);
});

test('backfill runs on a later cold start once SMS permission is granted via settings', async () => {
  mockHasPerms.mockResolvedValue(false);
  mockRequestPerms.mockResolvedValue(false);
  const first = await bootstrap();
  expect(first.firstRun).toBe(true);
  expect(mockBackfill).not.toHaveBeenCalled();

  // User has granted SMS via system settings since last cold start
  mockHasPerms.mockResolvedValue(true);
  const second = await bootstrap();
  expect(second.firstRun).toBe(false);
  expect(mockBackfill).toHaveBeenCalledTimes(1);
  expect(second.backfill).toBeDefined();
});

test('backfill error does not crash bootstrap', async () => {
  mockHasPerms.mockResolvedValue(true);
  mockBackfill.mockRejectedValue(new Error('permission revoked'));
  await expect(bootstrap()).resolves.toBeDefined();
});

test('backfill runs at most once after success', async () => {
  mockHasPerms.mockResolvedValue(true);
  mockBackfill.mockResolvedValue({ scanned: 5, inserted: 3 });
  await bootstrap();
  expect(mockBackfill).toHaveBeenCalledTimes(1);

  await bootstrap();
  expect(mockBackfill).toHaveBeenCalledTimes(1);
});
