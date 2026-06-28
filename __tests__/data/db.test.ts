import { MIGRATIONS } from '@/data/schema';

test('migrations are non-empty valid-looking DDL', () => {
  expect(MIGRATIONS.length).toBeGreaterThan(0);
  expect(MIGRATIONS[0]).toMatch(/CREATE TABLE/i);
  // dedupe uniqueness must exist
  expect(MIGRATIONS.some(m => /UNIQUE INDEX.*dedupe_hash/i.test(m))).toBe(true);
});
