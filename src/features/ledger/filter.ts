import type { Transaction } from '@/data/types';

export function filterTransactions(
  items: Transaction[],
  f: { type?: string; categoryId?: string; q?: string },
): Transaction[] {
  return items.filter(t => {
    if (f.type && t.type !== f.type) return false;
    if (f.categoryId && t.categoryId !== f.categoryId) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!(`${t.payee ?? ''} ${t.note ?? ''}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}
