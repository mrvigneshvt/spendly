import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { transactionsRepo as repo } from '@/data/transactionsRepo';
import { usePendingStore } from '@/features/pending/pendingStore';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('refresh loads pending; confirm removes from pending list', () => {
  repo.insertDraft({
    amount: 100, type: 'debit', date: 1, categoryId: null, subcategoryId: null,
    note: null, payee: null, source: 'X', status: 'pending', origin: 'sms',
    rawSmsBody: 'x', rawSmsSender: 'X', dedupeHash: 'z',
  } as any);
  usePendingStore.getState().refresh();
  expect(usePendingStore.getState().items).toHaveLength(1);
  const tid = usePendingStore.getState().items[0].id;
  usePendingStore.getState().confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  expect(usePendingStore.getState().items).toHaveLength(0);
});

test('discard removes item', () => {
  repo.insertDraft({
    amount: 100, type: 'debit', date: 1, categoryId: null, subcategoryId: null,
    note: null, payee: null, source: 'X', status: 'pending', origin: 'sms',
    rawSmsBody: 'x', rawSmsSender: 'X', dedupeHash: 'a',
  } as any);
  usePendingStore.getState().refresh();
  const tid = usePendingStore.getState().items[0].id;
  usePendingStore.getState().discard(tid);
  expect(usePendingStore.getState().items).toHaveLength(0);
});
