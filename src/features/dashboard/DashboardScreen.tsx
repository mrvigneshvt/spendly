import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import { periodRange } from './period';
import { buildCategorySlices } from './aggregations';
import { formatPaise } from '@/util/formatPaise';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  onDrillCategory: (categoryId: string) => void;
  periodKind: 'month' | 'week';
  onSetPeriodKind: (k: 'month' | 'week') => void;
  anchor: number;
  onSetAnchor: (a: number) => void;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 12 },
    periodChips: { flexDirection: 'row', gap: 4 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.chipBg },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.text },
    chipActiveText: { color: colors.chipSelectedText, fontWeight: '600' },
    navBtn: { fontSize: 20, padding: 8, color: colors.text },
    headline: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: colors.surface, marginHorizontal: 12, borderRadius: 12 },
    headlineItem: { alignItems: 'center' },
    headlineLabel: { fontSize: 12, color: colors.textTertiary },
    headlineValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    credit: { color: colors.credit },
    debit: { color: colors.debit },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', padding: 12, paddingBottom: 4, color: colors.text },
    catRow: { paddingHorizontal: 12, paddingVertical: 8 },
    catBar: { height: 36, backgroundColor: colors.chipBg, borderRadius: 8, overflow: 'hidden' },
    catBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 8, opacity: 0.7 },
    catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -28, paddingHorizontal: 10, paddingVertical: 6 },
    catName: { fontSize: 13, fontWeight: '600', flex: 1, color: colors.text },
    catPct: { fontSize: 13, color: colors.textSecondary, marginRight: 8 },
    catAmount: { fontSize: 13, fontWeight: '600', color: colors.text },
  });
}

export function DashboardScreen({ onDrillCategory, periodKind, onSetPeriodKind, anchor, onSetAnchor }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);

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
    onSetAnchor(d.getTime());
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.periodRow}>
        <TouchableOpacity onPress={() => navigatePeriod(-1)}><Text style={s.navBtn}>◀</Text></TouchableOpacity>
        <View style={s.periodChips}>
          <TouchableOpacity style={[s.chip, periodKind === 'month' && s.chipActive]} onPress={() => onSetPeriodKind('month')}>
            <Text style={periodKind === 'month' ? s.chipActiveText : s.chipText}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.chip, periodKind === 'week' && s.chipActive]} onPress={() => onSetPeriodKind('week')}>
            <Text style={periodKind === 'week' ? s.chipActiveText : s.chipText}>Week</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigatePeriod(1)}><Text style={s.navBtn}>▶</Text></TouchableOpacity>
      </View>

      <View style={s.headline}>
        <View style={s.headlineItem}>
          <Text style={s.headlineLabel}>Income</Text>
          <Text style={[s.headlineValue, s.credit]}>+{formatPaise(sums.credit)}</Text>
        </View>
        <View style={s.headlineItem}>
          <Text style={s.headlineLabel}>Expense</Text>
          <Text style={[s.headlineValue, s.debit]}>-{formatPaise(sums.debit)}</Text>
        </View>
        <View style={s.headlineItem}>
          <Text style={s.headlineLabel}>Net</Text>
          <Text style={[s.headlineValue, net >= 0 ? s.credit : s.debit]}>
            {net >= 0 ? '+' : ''}{formatPaise(net)}
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Spending by category</Text>
      {slices.map(sl => (
        <TouchableOpacity key={sl.categoryId} style={s.catRow} onPress={() => onDrillCategory(sl.categoryId)}>
          <View style={s.catBar}>
            <View style={[s.catBarFill, { width: `${Math.min(sl.pct, 100)}%` as any }]} />
          </View>
          <View style={s.catInfo}>
            <Text style={s.catName}>{sl.name}</Text>
            <Text style={s.catPct}>{sl.pct.toFixed(1)}%</Text>
            <Text style={s.catAmount}>{formatPaise(sl.total)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
