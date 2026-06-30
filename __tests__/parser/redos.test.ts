import { parseSms } from '@/parser';
import { isRegexSafe } from '@/parser/ruleEngine';

test('isRegexSafe flags catastrophic and invalid patterns, accepts normal ones', () => {
  expect(isRegexSafe('(a+)+')).toBe(false); // catastrophic backtracking shape
  expect(isRegexSafe('([')).toBe(false);    // invalid regex
  expect(isRegexSafe('HDFCBK')).toBe(true);
});

test('a catastrophic user rule pattern is skipped by the ReDoS guard, not executed', () => {
  const r = parseSms(
    { sender: 'NNNN', date: 1, body: 'Rs.10 debited at CAFE' },
    [{ id: 'bad', senderPattern: '(N+)+', bodyRegex: 'debited', typeHint: 'credit', isBuiltIn: false, confidenceWeight: 1 }],
  );
  // The unsafe rule must NOT match: matchedRuleId is not the bad rule, and the
  // rule's 'credit' typeHint is not applied — type falls through to generic
  // classification of "debited" => 'debit'.
  expect(r.matchedRuleId).not.toBe('bad');
  expect(r.type).toBe('debit');
});
