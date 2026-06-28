export type TxType = 'credit' | 'debit';
export type TxStatus = 'pending' | 'confirmed';
export type TxOrigin = 'sms' | 'manual';

export interface Transaction {
  id: string;
  amount: number;          // integer paise
  type: TxType;
  date: number;            // epoch ms
  categoryId: string | null;
  subcategoryId: string | null;
  note: string | null;
  payee: string | null;
  source: string | null;   // sms sender / account label
  status: TxStatus;
  origin: TxOrigin;
  rawSmsBody: string | null;
  rawSmsSender: string | null;
  dedupeHash: string | null;
  createdAt: number;
}

export type DraftTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  isDefault: boolean;
}

export interface ParseRule {
  id: string;
  senderPattern: string;   // regex source string
  bodyRegex: string;       // regex source string
  typeHint: TxType | null;
  isBuiltIn: boolean;
  confidenceWeight: number;
}
