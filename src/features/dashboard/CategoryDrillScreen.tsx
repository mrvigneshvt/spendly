import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import { periodRange } from './period';

interface Props {
  categoryId: string;
  onBack: () => void;
}

export function CategoryDrillScreen({ categoryId, onBack }: Props) {
  const [periodKind] = useState<'month' | 'week'>('month');
  const [anchor] = useState(Date.now());
  const { from, to } = useMemo(() => periodRange(periodKind, anchor), [periodKind, anchor]);

  const transactions = useMemo(() => {
    const all = transactionsRepo.listInRange(from, to);
    return all.filter(t => t.categoryId === categoryId);
  }, [from, to, categoryId]);

  const category = useMemo(() => categoriesRepo.listCategories().find(c => c.id === categoryId), [categoryId]);
  const subs = useMemo(() => categoriesRepo.listSubcategories(categoryId), [categoryId]);

  // Subcategory breakdown
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
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={onBack}>← Back</Text>
        <Text style={styles.title}>{category?.name ?? 'Category'}</Text>
      </View>
      <FlatList
        data={subTotals}
        keyExtractor={i => i.subcategoryId}
        renderItem={({ item }) => (
          <View style={styles.subRow}>
            <Text style={styles.subName}>{item.name}</Text>
            <Text style={styles.subAmount}>₹{(item.total / 100).toFixed(2)}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{(transactions.reduce((s, t) => s + t.amount, 0) / 100).toFixed(2)}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { fontSize: 16, color: '#007AFF', marginRight: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#eee' },
  subName: { fontSize: 15 },
  subAmount: { fontSize: 15, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8f9fa' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalAmount: { fontSize: 16, fontWeight: 'bold' },
});
