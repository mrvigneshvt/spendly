import { open, type DB } from '@op-engineering/op-sqlite';
import { MIGRATIONS } from './schema';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) {
    _db = open({ name: 'spendly.sqlite' });
    _db.execute('PRAGMA foreign_keys = ON');
  }
  return _db;
}

export function runMigrations(db: DB = getDb()): void {
  try {
    db.execute('BEGIN TRANSACTION');
    for (const sql of MIGRATIONS) db.execute(sql);
    db.execute('COMMIT');
  } catch (e) {
    try { db.execute('ROLLBACK'); } catch { /* ROLLBACK failure must not mask the original error */ }
    throw e;
  }
}

// test seam: allow injecting an in-memory DB
export function _setDbForTests(db: DB | null): void { _db = db; }
