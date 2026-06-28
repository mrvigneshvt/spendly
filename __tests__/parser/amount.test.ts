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
