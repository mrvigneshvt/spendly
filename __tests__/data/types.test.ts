import type { Transaction } from '@/data/types';

test('Transaction shape compiles', () => {
  const t: Transaction = {
    id: '1', amount: 100, type: 'debit', date: 0, categoryId: null,
    subcategoryId: null, note: null, payee: null, source: null,
    status: 'pending', origin: 'sms', rawSmsBody: null, rawSmsSender: null,
    dedupeHash: null, createdAt: 0,
  };
  expect(t.amount).toBe(100);
});
