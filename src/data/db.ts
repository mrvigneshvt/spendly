import { open, type DB } from '@op-engineering/op-sqlite';
import { MIGRATIONS } from './schema';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) _db = open({ name: 'spendly.sqlite' });
  return _db;
}

export function runMigrations(db: DB = getDb()): void {
  for (const sql of MIGRATIONS) db.execute(sql);
}

// test seam: allow injecting an in-memory DB
export function _setDbForTests(db: DB | null): void { _db = db; }
