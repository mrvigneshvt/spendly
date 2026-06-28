import type { ParseRule } from '@/data/types';

export const BUILTIN_RULES: ParseRule[] = [
  { id: 'hdfc', senderPattern: 'HDFCBK', bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'sbi',  senderPattern: 'SBIINB|SBI',  bodyRegex: '(debited|credited|withdrawn)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'icici',senderPattern: 'ICICIB|ICICI',bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'axis', senderPattern: 'AXISBK|AXIS',  bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'upi',  senderPattern: 'UPI',          bodyRegex: '(debited|credited|paid|received)', typeHint: null, isBuiltIn: true, confidenceWeight: 0.9 },
];
