import { extractAmountPaise } from '@/parser/amount';

test.each([
  ['Rs.5,000.00 debited', 500000],
  ['INR 1234.50 credited', 123450],
  ['debited by Rs 50', 5000],
  ['₹ 99.99 spent', 9999],
  ['no amount here', null],
])('extracts amount from "%s"', (body, expected) => {
  expect(extractAmountPaise(body)).toBe(expected);
});

test('skips balance figure when balance appears first', () => {
  expect(extractAmountPaise('Avl Bal Rs.50,000.00. Rs.1,000.00 debited')).toBe(100000);
});

test('skips balance figure when balance appears last', () => {
  expect(extractAmountPaise('Rs.250 spent on lunch. Avl Bal Rs.9,999.00')).toBe(25000);
});
