import { DEFAULT_CATEGORIES } from '@/data/seed';

test('seed has 13 categories, all with >=1 sub', () => {
  expect(DEFAULT_CATEGORIES).toHaveLength(13);
  for (const c of DEFAULT_CATEGORIES) expect(c.subs.length).toBeGreaterThan(0);
});

test('Income category exists for credit defaults', () => {
  expect(DEFAULT_CATEGORIES.find(c => c.name === 'Income')).toBeTruthy();
});
