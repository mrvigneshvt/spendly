import { create } from 'zustand';
import { transactionsRepo } from '@/data/transactionsRepo';
import type { Transaction, TxType } from '@/data/types';

interface PendingState {
  items: Transaction[];
  refresh: () => void;
  confirm: (id: string, p: { categoryId: string; subcategoryId: string; note?: string; payee?: string; type?: TxType }) => void;
  discard: (id: string) => void;
}

export const usePendingStore = create<PendingState>((set) => ({
  items: [],
  refresh: () => set({ items: transactionsRepo.listByStatus('pending') }),
  confirm: (id, p) => { transactionsRepo.confirm(id, p); set({ items: transactionsRepo.listByStatus('pending') }); },
  discard: (id) => { transactionsRepo.remove(id); set({ items: transactionsRepo.listByStatus('pending') }); },
}));
