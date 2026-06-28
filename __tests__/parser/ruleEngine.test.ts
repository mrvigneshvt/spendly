import { parseSms } from '@/parser';

test('HDFC debit parsed with high confidence', () => {
  const r = parseSms({ sender: 'VM-HDFCBK', date: 1, body: 'Rs.250.00 debited from a/c **1234 at SWIGGY. UPI Ref 123.' });
  expect(r.type).toBe('debit');
  expect(r.amount).toBe(25000);
  expect(r.payee).toBe('SWIGGY');
  expect(r.confidence).toBeGreaterThanOrEqual(0.7);
});

test('unknown sender still parses via generic fallback at low confidence', () => {
  const r = parseSms({ sender: 'XX-RANDOM', date: 1, body: 'INR 99 credited to wallet' });
  expect(r.type).toBe('credit');
  expect(r.amount).toBe(9900);
  expect(r.confidence).toBeLessThan(0.7);
  expect(r.confidence).toBeGreaterThan(0);
});

test('non-transaction SMS yields zero confidence / null amount', () => {
  const r = parseSms({ sender: 'XX-PROMO', date: 1, body: 'Get 50% off this weekend!' });
  expect(r.amount).toBeNull();
  expect(r.confidence).toBe(0);
});

test('user rule can boost a custom sender', () => {
  const r = parseSms(
    { sender: 'NEOBANK', date: 1, body: 'You spent 12.00 at CAFE' },
    [{ id: 'u1', senderPattern: 'NEOBANK', bodyRegex: 'spent', typeHint: 'debit', isBuiltIn: false, confidenceWeight: 1 }],
  );
  expect(r.type).toBe('debit');
  expect(r.confidence).toBeGreaterThanOrEqual(0.7);
});
