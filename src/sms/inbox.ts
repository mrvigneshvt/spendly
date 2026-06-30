import { readInboxNative } from './nativeReader';
import type { RawSms } from '@/parser';

export async function readInbox(): Promise<RawSms[]> {
  const messages = await readInboxNative();
  return messages.map(s => ({ sender: s.address, body: s.body, date: s.date }));
}

export async function backfill(): Promise<{ scanned: number; inserted: number }> {
  const { ingestRaw } = await import('./ingest');
  const msgs = await readInbox();
  let inserted = 0;
  for (const m of msgs) if (ingestRaw(m).inserted) inserted++;
  return { scanned: msgs.length, inserted };
}
