import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { Category, Subcategory, DraftTransaction } from '@/data/types';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  categories: Category[];
  subcategoriesFor: (categoryId: string) => Subcategory[];
  onSave: (draft: DraftTransaction) => void;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 12, color: colors.text, backgroundColor: colors.background },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    typeBtn: { padding: 10, borderRadius: 8, backgroundColor: colors.chipBg, flex: 1, alignItems: 'center' },
    typeSelected: { backgroundColor: colors.primary },
    typeText: { color: colors.text },
    typeTextSelected: { color: colors.chipSelectedText, fontWeight: '600' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: colors.text },
    section: { marginBottom: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.chipBg },
    chipSelected: { backgroundColor: colors.primary },
    chipText: { color: colors.text },
    chipTextSelected: { color: colors.chipSelectedText },
    saveBtn: { padding: 14, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    btnDisabled: { opacity: 0.4 },
    saveText: { color: colors.chipSelectedText, fontSize: 16, fontWeight: '600' },
  });
}

export function TransactionForm({ categories, subcategoriesFor, onSave }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);
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
    <View style={s.container}>
      <TextInput
        testID="amount-input"
        style={s.input}
        placeholder="Amount (₹)"
        placeholderTextColor={colors.textTertiary}
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
      />
      <View style={s.typeRow}>
        <TouchableOpacity testID="type-debit" style={[s.typeBtn, type === 'debit' && s.typeSelected]} onPress={() => setType('debit')}>
          <Text style={type === 'debit' ? s.typeTextSelected : s.typeText}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="type-credit" style={[s.typeBtn, type === 'credit' && s.typeSelected]} onPress={() => setType('credit')}>
          <Text style={type === 'credit' ? s.typeTextSelected : s.typeText}>Income</Text>
        </TouchableOpacity>
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
      <TouchableOpacity
        testID="save-btn"
        style={[s.saveBtn, !canSave && s.btnDisabled]}
        disabled={!canSave}
        onPress={handleSave}>
        <Text style={s.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}
