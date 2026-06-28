import { runMigrations } from '@/data/db';
import { seedDefaults } from '@/data/categoriesRepo';
import { getDb } from '@/data/db';
import { hasSmsPermissions, requestSmsPermissions } from '@/sms/permissions';
import { backfill } from '@/sms/inbox';
import { registerSmsHeadlessTask } from '@/sms/liveBridge';

export async function bootstrap(): Promise<{ firstRun: boolean; backfill?: { scanned: number; inserted: number } }> {
  const db = getDb();
  runMigrations(db);
  seedDefaults(db);

  const row = db.execute("SELECT value FROM meta WHERE key='bootstrapped'", []).rows?._array?.[0];
  const firstRun = !row || row.value !== '1';

  if (firstRun) {
    const hasPerms = await hasSmsPermissions();
    if (hasPerms || await requestSmsPermissions()) {
      const result = await backfill();
      db.execute("INSERT OR REPLACE INTO meta (key,value) VALUES ('bootstrapped','1')", []);
      registerSmsHeadlessTask();
      return { firstRun: true, backfill: result };
    }
    db.execute("INSERT OR REPLACE INTO meta (key,value) VALUES ('bootstrapped','1')", []);
  }

  registerSmsHeadlessTask();
  return { firstRun };
}
