import { runMigrations } from '@/data/db';
import { seedDefaults } from '@/data/categoriesRepo';
import { getDb } from '@/data/db';
import { hasSmsPermissions } from '@/sms/permissions';
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

// PermissionGate calls this after it has granted permission and backfilled, so
// bootstrap does not redundantly re-scan the inbox on the next cold start.
export function markBackfilled(): void {
  setMeta(getDb(), 'backfilled', '1');
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
    // bootstrap NEVER pops the system permission dialog — the rationale-gated
    // request is owned solely by PermissionGate. Here we only backfill when the
    // user has ALREADY granted permission (returning user, or granted via the
    // system Settings app between cold starts).
    let hasPerms = false;
    try { hasPerms = await hasSmsPermissions(); } catch { hasPerms = false; }
    if (hasPerms) {
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
