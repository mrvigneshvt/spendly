import { filterTransactions } from '@/features/ledger/filter';

const items = [
  { id: 'a', type: 'debit', categoryId: 'c1', payee: 'SWIGGY', note: null },
  { id: 'b', type: 'credit', categoryId: 'c2', payee: 'ACME', note: 'salary' },
] as any[];

test('filters by type', () => {
  expect(filterTransactions(items, { type: 'credit' })).toHaveLength(1);
});

test('filters by query over payee/note', () => {
  expect(filterTransactions(items, { q: 'swig' })[0].id).toBe('a');
});

test('filters by categoryId', () => {
  expect(filterTransactions(items, { categoryId: 'c1' })).toHaveLength(1);
});
