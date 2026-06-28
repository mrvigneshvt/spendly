export interface RawSms {
  sender: string;
  body: string;
  date: number;
}

export interface ParseResult {
  amount: number | null;
  type: 'credit' | 'debit' | null;
  payee: string | null;
  confidence: number;
  matchedRuleId: string | null;
}
