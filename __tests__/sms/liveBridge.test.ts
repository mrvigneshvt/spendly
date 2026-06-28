import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { handleHeadlessSms } from '@/sms/liveBridge';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('headless handler ingests an incoming sms', async () => {
  await handleHeadlessSms({ sender: 'HDFCBK', body: 'Rs.10.00 debited at CAFE', date: 1719500000000 });
  expect(repo.listByStatus('pending')).toHaveLength(1);
});
