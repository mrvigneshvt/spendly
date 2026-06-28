import SmsAndroid from 'react-native-get-sms-android';
import type { RawSms } from '@/parser';

export function readInbox(): Promise<RawSms[]> {
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', maxCount: 2000 }),
      (err: string) => reject(new Error(err)),
      (_count: number, smsList: string) => {
        const arr = JSON.parse(smsList) as { address: string; body: string; date: number }[];
        resolve(arr.map(s => ({ sender: s.address, body: s.body, date: s.date })));
      },
    );
  });
}

export async function backfill(): Promise<{ scanned: number; inserted: number }> {
  const { ingestRaw } = await import('./ingest');
  const msgs = await readInbox();
  let inserted = 0;
  for (const m of msgs) if (ingestRaw(m).inserted) inserted++;
  return { scanned: msgs.length, inserted };
}
