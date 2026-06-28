import { classifyType } from '@/parser/classify';

test.each([
  ['Your a/c debited by Rs.50', 'debit'],
  ['Rs.500 credited to your account', 'credit'],
  ['spent Rs.20 at SWIGGY', 'debit'],
  ['received Rs.100 via UPI', 'credit'],
  ['withdrawn Rs.2000 at ATM', 'debit'],
  ['OTP is 123456', null],
])('classifies "%s" as %s', (body, expected) => {
  expect(classifyType(body)).toBe(expected);
});
