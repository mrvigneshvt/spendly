import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Transaction, Category, Subcategory, TxType } from '@/data/types';
import { formatPaise } from '@/util/formatPaise';

interface Props {
  tx: Transaction;
  categories: Category[];
  subcategoriesFor: (categoryId: string) => Subcategory[];
  onConfirm: (p: { categoryId: string; subcategoryId: string; note?: string; payee?: string; type?: TxType }) => void;
  onDiscard: () => void;
}

export function ConfirmSheet({ tx, categories, subcategoriesFor, onConfirm, onDiscard }: Props) {
  const [catId, setCatId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [txType, setTxType] = useState<TxType>(tx.type);
  const subs = catId ? subcategoriesFor(catId) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.amount}>{formatPaise(tx.amount)}</Text>
      <Text style={styles.payee}>{tx.payee ?? 'Unknown'}</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            testID="type-debit"
            style={[styles.typeBtn, txType === 'debit' && styles.typeSelected]}
            onPress={() => setTxType('debit')}>
            <Text style={[styles.typeBtnText, txType === 'debit' && styles.typeSelectedText]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="type-credit"
            style={[styles.typeBtn, txType === 'credit' && styles.typeSelected]}
            onPress={() => setTxType('credit')}>
            <Text style={[styles.typeBtnText, txType === 'credit' && styles.typeSelectedText]}>Income</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              testID={`cat-${c.id}`}
              style={[styles.chip, catId === c.id && styles.chipSelected]}
              onPress={() => { setCatId(c.id); setSubId(null); }}>
              <Text>{c.icon ?? '📁'} {c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {catId && (
        <View style={styles.section}>
          <Text style={styles.label}>Subcategory</Text>
          <View style={styles.chips}>
            {subs.map(s => (
              <TouchableOpacity
                key={s.id}
                testID={`sub-${s.id}`}
                style={[styles.chip, subId === s.id && styles.chipSelected]}
                onPress={() => setSubId(s.id)}>
                <Text>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={styles.buttons}>
        <TouchableOpacity testID="discard-btn" style={styles.discardBtn} onPress={onDiscard}>
          <Text style={styles.btnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="confirm-btn"
          style={[styles.confirmBtn, (!catId || !subId) && styles.btnDisabled]}
          disabled={!catId || !subId}
          onPress={() => { if (catId && subId) onConfirm({ categoryId: catId, subcategoryId: subId, type: txType }); }}>
          <Text style={styles.btnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  amount: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  payee: { fontSize: 16, textAlign: 'center', marginBottom: 16, color: '#666' },
  section: { marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  typeSelected: { backgroundColor: '#007AFF' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  typeSelectedText: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee' },
  chipSelected: { backgroundColor: '#007AFF' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  discardBtn: { padding: 12, backgroundColor: '#ccc', borderRadius: 8 },
  confirmBtn: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600' },
});
