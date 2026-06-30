import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { categoriesRepo } from '@/data/categoriesRepo';
import { filterTransactions } from './filter';
import { formatPaise } from '@/util/formatPaise';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8 },
    addBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 },
    addBtnText: { color: colors.chipSelectedText, fontWeight: '600' },
    filterRow: { flexDirection: 'row', padding: 8, gap: 4, alignItems: 'center' },
    search: { flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 6, padding: 6, marginRight: 4, color: colors.text, backgroundColor: colors.background },
    filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.chipBg },
    filterActive: { backgroundColor: colors.primary },
    filterBtnText: { color: colors.text },
    filterActiveText: { color: colors.chipSelectedText },
    row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: colors.border },
    payee: { fontSize: 15, fontWeight: '600', color: colors.text },
    cat: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    amount: { fontSize: 16, fontWeight: 'bold' },
    credit: { color: colors.credit },
    debit: { color: colors.debit },
  });
}

export function LedgerScreen({ onAddEntry, refreshKey }: { onAddEntry?: () => void; refreshKey?: number }) {
  const { colors } = useTheme();
  const s = useStyles(colors);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const items = transactionsRepo.listInRange(monthStart.getTime(), now + 86400000);
    setTransactions(items);
  }, [refreshKey]);

  const categories = useMemo(() => categoriesRepo.listCategories(), []);
  const categoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name ?? id, [categories]);
  const filtered = useMemo(() => filterTransactions(transactions, { type: typeFilter, q: query || undefined }), [transactions, typeFilter, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={s.headerRow}>
        {onAddEntry && (
          <TouchableOpacity style={s.addBtn} onPress={onAddEntry}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.filterRow}>
        <TextInput
          style={s.search}
          placeholder="Search payee or note..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={[s.filterBtn, !typeFilter && s.filterActive]} onPress={() => setTypeFilter(undefined)}>
          <Text style={!typeFilter ? s.filterActiveText : s.filterBtnText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filterBtn, typeFilter === 'debit' && s.filterActive]} onPress={() => setTypeFilter('debit')}>
          <Text style={typeFilter === 'debit' ? s.filterActiveText : s.filterBtnText}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filterBtn, typeFilter === 'credit' && s.filterActive]} onPress={() => setTypeFilter('credit')}>
          <Text style={typeFilter === 'credit' ? s.filterActiveText : s.filterBtnText}>Income</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View>
              <Text style={s.payee}>{item.payee ?? 'Unknown'}</Text>
              {item.categoryId && <Text style={s.cat}>{categoryName(item.categoryId)}</Text>}
            </View>
            <Text style={[s.amount, item.type === 'credit' ? s.credit : s.debit]}>
              {item.type === 'credit' ? '+' : '-'}{formatPaise(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
