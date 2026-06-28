import { getDb } from './db';
import { id } from './id';
import { DEFAULT_CATEGORIES } from './seed';
import type { Category, Subcategory } from './types';

export function seedDefaults(db = getDb()): void {
  const existing = db.execute('SELECT COUNT(*) c FROM categories').rows?._array?.[0]?.c ?? 0;
  if (existing > 0) return;
  for (const c of DEFAULT_CATEGORIES) {
    const cid = id('cat');
    db.execute('INSERT INTO categories (id,name,icon,is_default) VALUES (?,?,?,?)', [cid, c.name, c.icon, 1]);
    for (const s of c.subs)
      db.execute('INSERT INTO subcategories (id,category_id,name,is_default) VALUES (?,?,?,?)', [id('sub'), cid, s, 1]);
  }
}

export const categoriesRepo = {
  listCategories(db = getDb()): Category[] {
    return (db.execute('SELECT id,name,icon,is_default FROM categories ORDER BY name').rows?._array ?? [])
      .map((r: any) => ({ id: r.id, name: r.name, icon: r.icon, isDefault: !!r.is_default }));
  },
  listSubcategories(categoryId: string, db = getDb()): Subcategory[] {
    return (db.execute('SELECT id,category_id,name,is_default FROM subcategories WHERE category_id=? ORDER BY name', [categoryId]).rows?._array ?? [])
      .map((r: any) => ({ id: r.id, categoryId: r.category_id, name: r.name, isDefault: !!r.is_default }));
  },
  addCategory(name: string, icon = '🗂️', db = getDb()): string {
    const cid = id('cat'); db.execute('INSERT INTO categories (id,name,icon,is_default) VALUES (?,?,?,0)', [cid, name, icon]); return cid;
  },
  addSubcategory(categoryId: string, name: string, db = getDb()): string {
    const sid = id('sub'); db.execute('INSERT INTO subcategories (id,category_id,name,is_default) VALUES (?,?,?,0)', [sid, categoryId, name]); return sid;
  },
  renameCategory(id: string, name: string, db = getDb()): void { db.execute('UPDATE categories SET name=? WHERE id=?', [name, id]); },
  isCategoryInUse(id: string, db = getDb()): boolean {
    return ((db.execute('SELECT COUNT(*) c FROM transactions WHERE category_id=?', [id]).rows?._array?.[0]?.c ?? 0) > 0);
  },
  deleteCategory(id: string, db = getDb()): void {
    if (categoriesRepo.isCategoryInUse(id, db)) throw new Error('Category in use; reassign transactions first');
    db.execute('DELETE FROM subcategories WHERE category_id=?', [id]);
    db.execute('DELETE FROM categories WHERE id=?', [id]);
  },
};
