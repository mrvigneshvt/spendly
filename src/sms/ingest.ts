import { parseSms } from '@/parser';
import { toDraft, dedupeHash } from '@/parser/toDraft';
import type { RawSms } from '@/parser';
import { transactionsRepo } from '@/data/transactionsRepo';
import { parseRulesRepo } from '@/data/parseRulesRepo';

export function ingestRaw(raw: RawSms): { inserted: boolean; reason?: string } {
  const userRules = parseRulesRepo.listUserRules();
  const result = parseSms(raw, userRules);
  const draft = toDraft(raw, result);
  if (!draft) return { inserted: false, reason: 'not-a-transaction' };
  if (transactionsRepo.existsByHash(dedupeHash(raw))) return { inserted: false, reason: 'duplicate' };
  transactionsRepo.insertDraft(draft);
  return { inserted: true };
}
