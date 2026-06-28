import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests, getDb } from '@/data/db';
import { categoriesRepo } from '@/data/categoriesRepo';

jest.mock('@/sms/permissions', () => ({
  hasSmsPermissions: jest.fn().mockResolvedValue(false),
  requestSmsPermissions: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/sms/inbox', () => ({
  backfill: jest.fn().mockResolvedValue({ scanned: 0, inserted: 0 }),
}));
jest.mock('@/sms/liveBridge', () => ({
  registerSmsHeadlessTask: jest.fn(),
}));

import { bootstrap } from '@/app/bootstrap';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('bootstrap runs migrations and seeds defaults', async () => {
  const result = await bootstrap();
  expect(result.firstRun).toBe(true);
  const cats = categoriesRepo.listCategories(db);
  expect(cats.length).toBeGreaterThan(0);
});
