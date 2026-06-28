import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { usePendingStore } from './pendingStore';
import { ConfirmSheet } from './ConfirmSheet';
import { categoriesRepo } from '@/data/categoriesRepo';
import { formatPaise } from '@/util/formatPaise';

export function PendingScreen() {
  const { items, refresh, confirm, discard } = usePendingStore();
  const [selectedTx, setSelectedTx] = React.useState<string | null>(null);
  const categories = categoriesRepo.listCategories();
  const subcategoriesFor = (categoryId: string) => categoriesRepo.listSubcategories(categoryId);

  React.useEffect(() => { refresh(); }, []);

  const selected = items.find(i => i.id === selectedTx);

  if (selected) {
    return (
      <ConfirmSheet
        tx={selected}
        categories={categories}
        subcategoriesFor={subcategoriesFor}
        onConfirm={(p) => { confirm(selected.id, p); setSelectedTx(null); }}
        onDiscard={() => { discard(selected.id); setSelectedTx(null); }}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={i => i.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => setSelectedTx(item.id)}>
          <Text style={styles.amount}>{formatPaise(item.amount)}</Text>
          <Text style={styles.payee}>{item.payee ?? item.source ?? 'Unknown'}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No pending transactions</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  payee: { fontSize: 14, color: '#666' },
  date: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', padding: 32, color: '#999' },
});
