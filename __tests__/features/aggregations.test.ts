import { buildCategorySlices } from '@/features/dashboard/aggregations';

test('category slices compute percentage of total', () => {
  const rows = [
    { categoryId: 'c1', amount: 7500, type: 'debit' },
    { categoryId: 'c2', amount: 2500, type: 'debit' },
  ] as any[];
  const cats = [{ id: 'c1', name: 'Food' }, { id: 'c2', name: 'Transport' }] as any[];
  const slices = buildCategorySlices(rows, cats);
  expect(slices.find(s => s.categoryId === 'c1')!.pct).toBeCloseTo(75);
  expect(slices.find(s => s.categoryId === 'c2')!.name).toBe('Transport');
});
