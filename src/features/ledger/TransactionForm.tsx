import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { Category, Subcategory } from '@/data/types';
import type { DraftTransaction } from '@/data/types';

interface Props {
  categories: Category[];
  subcategoriesFor: (categoryId: string) => Subcategory[];
  onSave: (draft: DraftTransaction) => void;
}

export function TransactionForm({ categories, subcategoriesFor, onSave }: Props) {
  const [amountText, setAmountText] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('debit');
  const [catId, setCatId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const subs = catId ? subcategoriesFor(catId) : [];

  const amountPaise = amountText ? Math.round(parseFloat(amountText) * 100) : 0;
  const canSave = amountPaise > 0 && catId !== null && subId !== null;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      amount: amountPaise,
      type,
      date: Date.now(),
      categoryId: catId,
      subcategoryId: subId,
      note: null,
      payee: null,
      source: null,
      status: 'confirmed',
      origin: 'manual',
      rawSmsBody: null,
      rawSmsSender: null,
      dedupeHash: null,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        testID="amount-input"
        style={styles.input}
        placeholder="Amount (₹)"
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
      />
      <View style={styles.typeRow}>
        <TouchableOpacity testID="type-debit" style={[styles.typeBtn, type === 'debit' && styles.typeSelected]} onPress={() => setType('debit')}>
          <Text style={type === 'debit' ? styles.typeTextSelected : undefined}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="type-credit" style={[styles.typeBtn, type === 'credit' && styles.typeSelected]} onPress={() => setType('credit')}>
          <Text style={type === 'credit' ? styles.typeTextSelected : undefined}>Income</Text>
        </TouchableOpacity>
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
      <TouchableOpacity
        testID="save-btn"
        style={[styles.saveBtn, !canSave && styles.btnDisabled]}
        disabled={!canSave}
        onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { padding: 10, borderRadius: 8, backgroundColor: '#eee', flex: 1, alignItems: 'center' },
  typeSelected: { backgroundColor: '#007AFF' },
  typeTextSelected: { color: '#fff', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  section: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee' },
  chipSelected: { backgroundColor: '#007AFF' },
  saveBtn: { padding: 14, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
