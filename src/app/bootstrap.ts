import { runMigrations } from '@/data/db';
import { seedDefaults } from '@/data/categoriesRepo';
import { getDb } from '@/data/db';
import { hasSmsPermissions, requestSmsPermissions } from '@/sms/permissions';
import { backfill } from '@/sms/inbox';
import { registerSmsHeadlessTask } from '@/sms/liveBridge';

function setMeta(db: any, key: string, value: string): void {
  const existing = db.execute("SELECT value FROM meta WHERE key=?", [key]).rows?._array?.[0];
  if (existing) {
    db.execute("UPDATE meta SET value=? WHERE key=?", [value, key]);
  } else {
    db.execute("INSERT INTO meta (key,value) VALUES (?,?)", [key, value]);
  }
}

export async function bootstrap(): Promise<{ firstRun: boolean; backfill?: { scanned: number; inserted: number } }> {
  const db = getDb();
  runMigrations(db);
  seedDefaults(db);

  const row = db.execute("SELECT value FROM meta WHERE key=?", ['bootstrapped']).rows?._array?.[0];
  const firstRun = !row || row.value !== '1';
  if (firstRun) setMeta(db, 'bootstrapped', '1');

  const bfRow = db.execute("SELECT value FROM meta WHERE key=?", ['backfilled']).rows?._array?.[0];
  const alreadyBackfilled = bfRow && bfRow.value === '1';

  let backfillResult: { scanned: number; inserted: number } | undefined;
  if (!alreadyBackfilled) {
    const hasPerms = await hasSmsPermissions();
    if (hasPerms || await requestSmsPermissions()) {
      try {
        backfillResult = await backfill();
        setMeta(db, 'backfilled', '1');
      } catch {
        backfillResult = undefined;
      }
    }
  }

  registerSmsHeadlessTask();
  return { firstRun, backfill: backfillResult };
}
