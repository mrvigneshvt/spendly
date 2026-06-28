const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;

export function extractAmountPaise(body: string): number | null {
  const m = body.match(AMOUNT_RE);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}
