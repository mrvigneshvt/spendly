import { dedupeHash, toDraft } from '@/parser/toDraft';

test('dedupeHash stable for same content', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50 debited', date: 1719500000000 };
  expect(dedupeHash(raw)).toBe(dedupeHash({ ...raw }));
});

test('toDraft yields pending sms draft with amount', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 };
  const d = toDraft(raw, { amount: 5000, type: 'debit', payee: 'SWIGGY', confidence: 0.9, matchedRuleId: 'hdfc' });
  expect(d?.status).toBe('pending');
  expect(d?.origin).toBe('sms');
  expect(d?.amount).toBe(5000);
  expect(d?.dedupeHash).toBeTruthy();
});

test('toDraft returns null when no amount', () => {
  const raw = { sender: 'X', body: 'hi', date: 1 };
  expect(toDraft(raw, { amount: null, type: null, payee: null, confidence: 0, matchedRuleId: null })).toBeNull();
});
