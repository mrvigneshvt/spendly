import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import { periodRange } from './period';
import { formatPaise } from '@/util/formatPaise';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  categoryId: string;
  onBack: () => void;
  periodKind: 'month' | 'week';
  anchor: number;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: colors.border },
    backBtn: { fontSize: 16, color: colors.primary, marginRight: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: colors.border },
    subName: { fontSize: 15, color: colors.text },
    subAmount: { fontSize: 15, fontWeight: '600', color: colors.text },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: colors.surface },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    totalAmount: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  });
}

export function CategoryDrillScreen({ categoryId, onBack, periodKind, anchor }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);
  const { from, to } = useMemo(() => periodRange(periodKind, anchor), [periodKind, anchor]);

  const transactions = useMemo(() => {
    const all = transactionsRepo.listInRange(from, to);
    return all.filter(t => t.categoryId === categoryId);
  }, [from, to, categoryId]);

  const category = useMemo(() => categoriesRepo.listCategories().find(c => c.id === categoryId), [categoryId]);
  const subs = useMemo(() => categoriesRepo.listSubcategories(categoryId), [categoryId]);

  const subTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const sid = t.subcategoryId ?? 'uncat';
      map.set(sid, (map.get(sid) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([id, total]) => ({
      subcategoryId: id,
      name: subs.find(s => s.id === id)?.name ?? 'Uncategorized',
      total,
    })).sort((a, b) => b.total - a.total);
  }, [transactions, subs]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.backBtn} onPress={onBack}>← Back</Text>
        <Text style={s.title}>{category?.name ?? 'Category'}</Text>
      </View>
      <FlatList
        data={subTotals}
        keyExtractor={i => i.subcategoryId}
        renderItem={({ item }) => (
          <View style={s.subRow}>
            <Text style={s.subName}>{item.name}</Text>
            <Text style={s.subAmount}>{formatPaise(item.total)}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalAmount}>{formatPaise(transactions.reduce((sum, t) => sum + t.amount, 0))}</Text>
          </View>
        }
      />
    </View>
  );
}
