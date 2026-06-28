import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { categoriesRepo, seedDefaults } from '@/data/categoriesRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('seedDefaults creates 13 categories with subcategories', () => {
  seedDefaults(db);
  const cats = categoriesRepo.listCategories(db);
  expect(cats).toHaveLength(13);
  expect(cats.filter(c => c.isDefault)).toHaveLength(13);
  // each category has at least one subcategory
  for (const cat of cats) {
    expect(categoriesRepo.listSubcategories(cat.id, db).length).toBeGreaterThan(0);
  }
});

test('seedDefaults is idempotent', () => {
  seedDefaults(db);
  seedDefaults(db);
  expect(categoriesRepo.listCategories(db)).toHaveLength(13);
});

test('addCategory adds a non-default category', () => {
  seedDefaults(db);
  const cid = categoriesRepo.addCategory('Custom', '📦', db);
  const cats = categoriesRepo.listCategories(db);
  expect(cats.find(c => c.name === 'Custom')?.isDefault).toBe(false);
});

test('addSubcategory adds to a category', () => {
  seedDefaults(db);
  const cats = categoriesRepo.listCategories(db);
  const cid = cats[0].id;
  categoriesRepo.addSubcategory(cid, 'New Sub', db);
  expect(categoriesRepo.listSubcategories(cid, db).length).toBeGreaterThanOrEqual(cats[0].subcategories?.length ?? 0 + 1);
});

test('renameCategory updates name', () => {
  seedDefaults(db);
  const cat = categoriesRepo.listCategories(db)[0];
  categoriesRepo.renameCategory(cat.id, 'Renamed', db);
  expect(categoriesRepo.listCategories(db).find(c => c.id === cat.id)?.name).toBe('Renamed');
});

test('deleteCategory throws when category is in use', () => {
  seedDefaults(db);
  const cat = categoriesRepo.listCategories(db)[0];
  // Insert a transaction referencing this category
  db.execute("INSERT INTO transactions (id,amount,type,date,category_id,subcategory_id,status,origin,created_at) VALUES (?,?,?,?,?,?,?,?,?)", ['tx1', 100, 'debit', 0, cat.id, 'nope', 'confirmed', 'manual', 0]);
  expect(() => categoriesRepo.deleteCategory(cat.id, db)).toThrow('Category in use');
});

test('deleteCategory works when not in use', () => {
  seedDefaults(db);
  const cat = categoriesRepo.listCategories(db)[0];
  categoriesRepo.deleteCategory(cat.id, db);
  expect(categoriesRepo.listCategories(db).find(c => c.id === cat.id)).toBeUndefined();
});
