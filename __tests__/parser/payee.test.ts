import { extractPayee } from '@/parser/payee';

test.each([
  ['Rs.50 spent at SWIGGY on 12-01', 'SWIGGY'],
  ['paid to AMAZON PAY via UPI', 'AMAZON PAY'],
  ['VPA swiggy@hdfcbank credited', 'swiggy@hdfcbank'],
  ['random text', null],
])('payee from "%s" is %s', (body, expected) => {
  expect(extractPayee(body)).toBe(expected);
});
