const DEBIT = /\b(debited|debit|spent|withdrawn|paid|purchase|sent|deducted)\b/gi;
const CREDIT = /\b(credited|credit|received|deposited|refund(?:ed)?|added)\b/gi;
const NEGATION = /(?:not\s+\w{0,10}|n't\s+\w{0,10})$/i;

function isNegated(at: number, text: string): boolean {
  const before = text.slice(Math.max(0, at - 20), at);
  return NEGATION.test(before);
}

function findMatches(re: RegExp, body: string): { at: number }[] {
  const out: { at: number }[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(body)) !== null) {
    out.push({ at: m.index });
  }
  return out;
}

export function classifyType(body: string): 'credit' | 'debit' | null {
  const debits = findMatches(DEBIT, body).filter(m => !isNegated(m.at, body));
  const credits = findMatches(CREDIT, body).filter(m => !isNegated(m.at, body));

  if (!debits.length && !credits.length) return null;
  if (debits.length && !credits.length) return 'debit';
  if (credits.length && !debits.length) return 'credit';

  const firstDebit = debits[0].at;
  const firstCredit = credits[0].at;
  return firstDebit < firstCredit ? 'debit' : 'credit';
}
