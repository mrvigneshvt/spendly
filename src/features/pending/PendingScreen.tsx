import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { usePendingStore } from './pendingStore';
import { ConfirmSheet } from './ConfirmSheet';
import { categoriesRepo } from '@/data/categoriesRepo';
import { formatPaise } from '@/util/formatPaise';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    amount: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    payee: { fontSize: 14, color: colors.textSecondary },
    date: { fontSize: 12, color: colors.textTertiary },
    empty: { textAlign: 'center', padding: 32, color: colors.textTertiary },
  });
}

export function PendingScreen() {
  const { colors } = useTheme();
  const s = useStyles(colors);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => setSelectedTx(item.id)}>
            <Text style={s.amount}>{formatPaise(item.amount)}</Text>
            <Text style={s.payee}>{item.payee ?? item.source ?? 'Unknown'}</Text>
            <Text style={s.date}>{new Date(item.date).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>No pending transactions</Text>}
      />
    </View>
  );
}
