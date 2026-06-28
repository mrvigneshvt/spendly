import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

const draft = (over = {}) => ({
  amount: 5000, type: 'debit' as const, date: 1719500000000, categoryId: null, subcategoryId: null,
  note: null, payee: 'SWIGGY', source: 'HDFCBK', status: 'pending' as const, origin: 'sms' as const,
  rawSmsBody: 'debited 50.00', rawSmsSender: 'HDFCBK', dedupeHash: 'h1', ...over,
});

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('confirm requires category + subcategory', () => {
  const tid = repo.insertDraft(draft() as any);
  expect(() => repo.confirm(tid, { categoryId: '', subcategoryId: '' } as any)).toThrow();
});

test('confirm moves status to confirmed', () => {
  const tid = repo.insertDraft(draft() as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  expect(repo.listByStatus('confirmed')).toHaveLength(1);
  expect(repo.listByStatus('pending')).toHaveLength(0);
});

test('confirm preserves existing payee and note when not supplied', () => {
  const tid = repo.insertDraft(draft({ note: 'lunch' }) as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  const rows = repo.listByStatus('confirmed');
  expect(rows[0].payee).toBe('SWIGGY');
  expect(rows[0].note).toBe('lunch');
});

test('dedupe: existsByHash detects duplicate', () => {
  repo.insertDraft(draft() as any);
  expect(repo.existsByHash('h1')).toBe(true);
  expect(repo.existsByHash('nope')).toBe(false);
});

test('sumByType aggregates confirmed only', () => {
  const a = repo.insertDraft(draft({ dedupeHash: 'a' }) as any);
  repo.confirm(a, { categoryId: 'c1', subcategoryId: 's1' });
  const b = repo.insertDraft(draft({ type: 'credit', amount: 9000, dedupeHash: 'b' }) as any);
  repo.confirm(b, { categoryId: 'c2', subcategoryId: 's2' });
  const s = repo.sumByType(0, 2_000_000_000_000);
  expect(s.debit).toBe(5000);
  expect(s.credit).toBe(9000);
});

test('breakdownByCategory returns totals per category', () => {
  const t1 = repo.insertDraft(draft({ dedupeHash: 'a', categoryId: 'cat1' }) as any);
  repo.confirm(t1, { categoryId: 'cat1', subcategoryId: 's1' });
  const t2 = repo.insertDraft(draft({ dedupeHash: 'b', categoryId: 'cat1', amount: 3000 }) as any);
  repo.confirm(t2, { categoryId: 'cat1', subcategoryId: 's2' });
  const t3 = repo.insertDraft(draft({ dedupeHash: 'c', categoryId: 'cat2', amount: 2000 }) as any);
  repo.confirm(t3, { categoryId: 'cat2', subcategoryId: 's3' });
  const breakdown = repo.breakdownByCategory(0, 2_000_000_000_000, 'debit');
  expect(breakdown.find(b => b.categoryId === 'cat1')?.total).toBe(8000);
  expect(breakdown.find(b => b.categoryId === 'cat2')?.total).toBe(2000);
});

test('confirm persists type override when provided', () => {
  const tid = repo.insertDraft(draft({ type: 'debit' }) as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1', type: 'credit' });
  const rows = repo.listByStatus('confirmed');
  expect(rows[0].type).toBe('credit');
});

test('confirm preserves existing type when type not supplied', () => {
  const tid = repo.insertDraft(draft({ type: 'credit' }) as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  const rows = repo.listByStatus('confirmed');
  expect(rows[0].type).toBe('credit');
});

test('created_at stores insertion time not transaction date', () => {
  const tid = repo.insertDraft(draft({ date: 100 }) as any, undefined, 999);
  const rows = db.execute('SELECT created_at FROM transactions WHERE id=?', [tid]).rows._array;
  expect(rows[0].created_at).toBe(999);
});

test('listInRange returns confirmed transactions in date range', () => {
  const tid = repo.insertDraft(draft({ date: 100 }) as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  expect(repo.listInRange(0, 200)).toHaveLength(1);
  expect(repo.listInRange(200, 300)).toHaveLength(0);
});
