const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
const BALANCE_RE = /bal(?:ance)?\s*\.?\s*$/i;
const TX_VERB_RE = /(?:debited?|credited?|spent|paid|withdrawn|purchased?)/i;

export function extractAmountPaise(body: string): number | null {
  const matches = [...body.matchAll(AMOUNT_RE)];
  if (!matches.length) return null;

  const candidates = matches.filter(m => {
    const before = body.slice(Math.max(0, m.index - 30), m.index);
    return !BALANCE_RE.test(before);
  });

  if (!candidates.length) return null;

  const scored = candidates.map(m => {
    const before = body.slice(Math.max(0, m.index - 40), m.index);
    const txDistance = TX_VERB_RE.test(before) ? 0 : 1;
    return { match: m, score: txDistance };
  });

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0].match;
  const num = parseFloat(best[1].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}
