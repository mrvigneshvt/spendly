import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Transaction, Category, Subcategory, TxType } from '@/data/types';
import { formatPaise } from '@/util/formatPaise';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  tx: Transaction;
  categories: Category[];
  subcategoriesFor: (categoryId: string) => Subcategory[];
  onConfirm: (p: { categoryId: string; subcategoryId: string; note?: string; payee?: string; type?: TxType }) => void;
  onDiscard: () => void;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    amount: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: colors.text },
    payee: { fontSize: 16, textAlign: 'center', marginBottom: 16, color: colors.textSecondary },
    section: { marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 8 },
    typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.chipBg, alignItems: 'center' },
    typeSelected: { backgroundColor: colors.primary },
    typeBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
    typeSelectedText: { color: colors.chipSelectedText },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: colors.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.chipBg },
    chipSelected: { backgroundColor: colors.primary },
    chipText: { color: colors.text },
    chipTextSelected: { color: colors.chipSelectedText },
    buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    discardBtn: { padding: 12, backgroundColor: colors.chipBg, borderRadius: 8 },
    confirmBtn: { padding: 12, backgroundColor: colors.primary, borderRadius: 8 },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: colors.chipSelectedText, fontWeight: '600' },
    discardText: { color: colors.text },
  });
}

export function ConfirmSheet({ tx, categories, subcategoriesFor, onConfirm, onDiscard }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);
  const [catId, setCatId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [txType, setTxType] = useState<TxType>(tx.type);
  const subs = catId ? subcategoriesFor(catId) : [];

  return (
    <View style={s.container}>
      <Text style={s.amount}>{formatPaise(tx.amount)}</Text>
      <Text style={s.payee}>{tx.payee ?? 'Unknown'}</Text>
      <View style={s.section}>
        <Text style={s.label}>Type</Text>
        <View style={s.typeRow}>
          <TouchableOpacity
            testID="type-debit"
            style={[s.typeBtn, txType === 'debit' && s.typeSelected]}
            onPress={() => setTxType('debit')}>
            <Text style={[s.typeBtnText, txType === 'debit' && s.typeSelectedText]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="type-credit"
            style={[s.typeBtn, txType === 'credit' && s.typeSelected]}
            onPress={() => setTxType('credit')}>
            <Text style={[s.typeBtnText, txType === 'credit' && s.typeSelectedText]}>Income</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.label}>Category</Text>
        <View style={s.chips}>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              testID={`cat-${c.id}`}
              style={[s.chip, catId === c.id && s.chipSelected]}
              onPress={() => { setCatId(c.id); setSubId(null); }}>
              <Text style={catId === c.id ? s.chipTextSelected : s.chipText}>{c.icon ?? '📁'} {c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {catId && (
        <View style={s.section}>
          <Text style={s.label}>Subcategory</Text>
          <View style={s.chips}>
            {subs.map(s => (
              <TouchableOpacity
                key={s.id}
                testID={`sub-${s.id}`}
                style={[s.chip, subId === s.id && s.chipSelected]}
                onPress={() => setSubId(s.id)}>
                <Text style={subId === s.id ? s.chipTextSelected : s.chipText}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={s.buttons}>
        <TouchableOpacity testID="discard-btn" style={s.discardBtn} onPress={onDiscard}>
          <Text style={s.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="confirm-btn"
          style={[s.confirmBtn, (!catId || !subId) && s.btnDisabled]}
          disabled={!catId || !subId}
          onPress={() => { if (catId && subId) onConfirm({ categoryId: catId, subcategoryId: subId, type: txType }); }}>
          <Text style={s.btnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
