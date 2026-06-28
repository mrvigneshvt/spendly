import React from 'react';
import { View } from 'react-native';
import { TransactionForm } from './TransactionForm';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import type { DraftTransaction } from '@/data/types';

export function ManualEntryScreen({ onSaved }: { onSaved?: () => void }) {
  const categories = categoriesRepo.listCategories();
  const subcategoriesFor = (categoryId: string) => categoriesRepo.listSubcategories(categoryId);

  const handleSave = (draft: DraftTransaction) => {
    transactionsRepo.insertDraft(draft);
    onSaved?.();
  };

  return (
    <View style={{ flex: 1 }}>
      <TransactionForm categories={categories} subcategoriesFor={subcategoriesFor} onSave={handleSave} />
    </View>
  );
}
