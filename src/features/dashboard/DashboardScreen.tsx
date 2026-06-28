import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import { periodRange } from './period';
import { buildCategorySlices } from './aggregations';
import { formatPaise } from '@/util/formatPaise';

interface Props {
  onDrillCategory: (categoryId: string) => void;
}

export function DashboardScreen({ onDrillCategory }: Props) {
  const [periodKind, setPeriodKind] = useState<'month' | 'week'>('month');
  const [anchor, setAnchor] = useState(Date.now());

  const { from, to } = useMemo(() => periodRange(periodKind, anchor), [periodKind, anchor]);
  const sums = useMemo(() => transactionsRepo.sumByType(from, to), [from, to]);
  const breakdown = useMemo(() => transactionsRepo.breakdownByCategory(from, to, 'debit'), [from, to]);
  const categories = useMemo(() => categoriesRepo.listCategories(), []);
  const slices = useMemo(() => buildCategorySlices(breakdown.map(b => ({ categoryId: b.categoryId, amount: b.total })), categories), [breakdown, categories]);

  const net = sums.credit - sums.debit;

  const navigatePeriod = (dir: -1 | 1) => {
    const d = new Date(anchor);
    if (periodKind === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setAnchor(d.getTime());
  };

  return (
    <ScrollView style={styles.container}>
      {/* Period selector */}
      <View style={styles.periodRow}>
        <TouchableOpacity onPress={() => navigatePeriod(-1)}><Text style={styles.navBtn}>◀</Text></TouchableOpacity>
        <View style={styles.periodChips}>
          <TouchableOpacity style={[styles.chip, periodKind === 'month' && styles.chipActive]} onPress={() => setPeriodKind('month')}>
            <Text style={periodKind === 'month' ? styles.chipActiveText : undefined}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, periodKind === 'week' && styles.chipActive]} onPress={() => setPeriodKind('week')}>
            <Text style={periodKind === 'week' ? styles.chipActiveText : undefined}>Week</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigatePeriod(1)}><Text style={styles.navBtn}>▶</Text></TouchableOpacity>
      </View>

      {/* Headline */}
      <View style={styles.headline}>
        <View style={styles.headlineItem}>
          <Text style={styles.headlineLabel}>Income</Text>
          <Text style={[styles.headlineValue, styles.credit]}>+{formatPaise(sums.credit)}</Text>
        </View>
        <View style={styles.headlineItem}>
          <Text style={styles.headlineLabel}>Expense</Text>
          <Text style={[styles.headlineValue, styles.debit]}>-{formatPaise(sums.debit)}</Text>
        </View>
        <View style={styles.headlineItem}>
          <Text style={styles.headlineLabel}>Net</Text>
          <Text style={[styles.headlineValue, net >= 0 ? styles.credit : styles.debit]}>
            {net >= 0 ? '+' : ''}{formatPaise(net)}
          </Text>
        </View>
      </View>

      {/* Category breakdown */}
      <Text style={styles.sectionTitle}>Spending by category</Text>
      {slices.map(s => (
        <TouchableOpacity key={s.categoryId} style={styles.catRow} onPress={() => onDrillCategory(s.categoryId)}>
          <View style={styles.catBar}>
            <View style={[styles.catBarFill, { width: `${Math.min(s.pct, 100)}%` as any }]} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{s.name}</Text>
            <Text style={styles.catPct}>{s.pct.toFixed(1)}%</Text>
            <Text style={styles.catAmount}>{formatPaise(s.total)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 12 },
  periodChips: { flexDirection: 'row', gap: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#eee' },
  chipActive: { backgroundColor: '#007AFF' },
  chipActiveText: { color: '#fff', fontWeight: '600' },
  navBtn: { fontSize: 20, padding: 8 },
  headline: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#f8f9fa', marginHorizontal: 12, borderRadius: 12 },
  headlineItem: { alignItems: 'center' },
  headlineLabel: { fontSize: 12, color: '#999' },
  headlineValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  credit: { color: '#2e7d32' },
  debit: { color: '#c62828' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', padding: 12, paddingBottom: 4 },
  catRow: { paddingHorizontal: 12, paddingVertical: 8 },
  catBar: { height: 36, backgroundColor: '#f0f0f0', borderRadius: 8, overflow: 'hidden' },
  catBarFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 8, opacity: 0.7 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -28, paddingHorizontal: 10, paddingVertical: 6 },
  catName: { fontSize: 13, fontWeight: '600', flex: 1 },
  catPct: { fontSize: 13, color: '#666', marginRight: 8 },
  catAmount: { fontSize: 13, fontWeight: '600' },
});
