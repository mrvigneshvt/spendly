import type { RawSms, ParseResult } from './types';
import type { DraftTransaction } from '@/data/types';

export function dedupeHash(raw: RawSms): string {
  // simple stable djb2 over sender|body|dateBucket(minute)
  const bucket = Math.floor(raw.date / 60000);
  const s = `${raw.sender}|${raw.body}|${bucket}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function toDraft(raw: RawSms, r: ParseResult): DraftTransaction | null {
  if (r.amount === null) return null;
  return {
    amount: r.amount,
    type: r.type ?? 'debit',
    date: raw.date,
    categoryId: null, subcategoryId: null,
    note: null, payee: r.payee, source: raw.sender,
    status: 'pending', origin: 'sms',
    rawSmsBody: raw.body, rawSmsSender: raw.sender,
    dedupeHash: dedupeHash(raw),
  };
}
