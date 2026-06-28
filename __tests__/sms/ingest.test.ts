import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { ingestRaw } from '@/sms/ingest';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('ingestRaw inserts a pending sms transaction', () => {
  const res = ingestRaw({ sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 });
  expect(res.inserted).toBe(true);
  expect(repo.listByStatus('pending')).toHaveLength(1);
});

test('ingestRaw skips duplicates by hash', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 };
  ingestRaw(raw);
  const res2 = ingestRaw(raw);
  expect(res2.inserted).toBe(false);
  expect(res2.reason).toBe('duplicate');
  expect(repo.listByStatus('pending')).toHaveLength(1);
});

test('ingestRaw skips non-transaction sms', () => {
  const res = ingestRaw({ sender: 'PROMO', body: 'Get 50% off!', date: 1 });
  expect(res.inserted).toBe(false);
  expect(res.reason).toBe('not-a-transaction');
});
