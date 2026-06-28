import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { transactionsRepo } from '@/data/transactionsRepo';
import { filterTransactions } from './filter';

export function LedgerScreen() {
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
  }, []);

  const filtered = useMemo(() => filterTransactions(transactions, { type: typeFilter, q: query || undefined }), [transactions, typeFilter, query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.search}
          placeholder="Search payee or note..."
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={[styles.filterBtn, !typeFilter && styles.filterActive]} onPress={() => setTypeFilter(undefined)}>
          <Text>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, typeFilter === 'expense' && styles.filterActive]} onPress={() => setTypeFilter('expense')}>
          <Text>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, typeFilter === 'credit' && styles.filterActive]} onPress={() => setTypeFilter('credit')}>
          <Text>Income</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.payee}>{item.payee ?? 'Unknown'}</Text>
              {item.categoryId && <Text style={styles.cat}>{item.categoryId}</Text>}
            </View>
            <Text style={[styles.amount, item.type === 'credit' ? styles.credit : styles.debit]}>
              {item.type === 'credit' ? '+' : '-'}₹{(item.amount / 100).toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', padding: 8, gap: 4, alignItems: 'center' },
  search: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, marginRight: 4 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#eee' },
  filterActive: { backgroundColor: '#007AFF' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#eee' },
  payee: { fontSize: 15, fontWeight: '600' },
  cat: { fontSize: 12, color: '#999', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold' },
  credit: { color: '#2e7d32' },
  debit: { color: '#c62828' },
});
