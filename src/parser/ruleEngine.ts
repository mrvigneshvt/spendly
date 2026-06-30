import type { ParseRule } from '@/data/types';
import type { RawSms, ParseResult } from './types';
import { extractAmountPaise } from './amount';
import { classifyType } from './classify';
import { extractPayee } from './payee';

// Simple heuristic: flag patterns with nested quantifiers (potential catastrophic backtracking)
const CATASTROPHIC_RE = /\(.[+*]\)[+*]/;

export function isRegexSafe(pattern: string): boolean {
  try {
    new RegExp(pattern);
  } catch {
    return false;
  }
  return !CATASTROPHIC_RE.test(pattern);
}

function ruleMatches(rule: ParseRule, raw: RawSms): boolean {
  try {
    if (!rule.isBuiltIn && (!isRegexSafe(rule.senderPattern) || !isRegexSafe(rule.bodyRegex))) return false;
    return new RegExp(rule.senderPattern, 'i').test(raw.sender) &&
           new RegExp(rule.bodyRegex, 'i').test(raw.body);
  } catch { return false; }
}

export function runEngine(raw: RawSms, rules: ParseRule[]): ParseResult {
  const amount = extractAmountPaise(raw.body);
  const matched = rules.find(r => ruleMatches(r, raw)) ?? null;
  const type = matched?.typeHint ?? classifyType(raw.body);
  const payee = extractPayee(raw.body);

  if (amount === null && type === null)
    return { amount: null, type: null, payee, confidence: 0, matchedRuleId: null };

  // confidence: base for signal present + bonus for a known rule match
  let c = 0;
  if (amount !== null) c += 0.3;
  if (type !== null) c += 0.2;
  if (matched) c += 0.5 * (matched.confidenceWeight ?? 1);
  c = Math.min(1, c);

  return { amount, type, payee, confidence: c, matchedRuleId: matched?.id ?? null };
}
