const DEBIT = /\b(debited|debit|spent|withdrawn|paid|purchase|sent|deducted)\b/i;
const CREDIT = /\b(credited|credit|received|deposited|refund(?:ed)?|added)\b/i;

export function classifyType(body: string): 'credit' | 'debit' | null {
  const d = DEBIT.test(body);
  const c = CREDIT.test(body);
  if (d && !c) return 'debit';
  if (c && !d) return 'credit';
  if (d && c) return /credited/i.test(body) ? 'credit' : 'debit';
  return null;
}
