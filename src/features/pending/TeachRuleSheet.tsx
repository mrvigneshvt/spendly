import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { parseRulesRepo } from '@/data/parseRulesRepo';
import type { Transaction } from '@/data/types';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  tx: Transaction;
  onCreated: () => void;
  onCancel: () => void;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.text },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12, color: colors.text },
    input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 10, fontSize: 16, color: colors.text, backgroundColor: colors.background },
    typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    typeBtn: { padding: 8, borderRadius: 8, backgroundColor: colors.chipBg, flex: 1, alignItems: 'center' },
    typeSelected: { backgroundColor: colors.primary },
    typeBtnText: { color: colors.text },
    typeSelectedText: { color: colors.chipSelectedText },
    buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    cancelBtn: { padding: 12, backgroundColor: colors.chipBg, borderRadius: 8 },
    createBtn: { padding: 12, backgroundColor: colors.primary, borderRadius: 8 },
    btnDisabled: { opacity: 0.4 },
    createText: { color: colors.chipSelectedText, fontWeight: '600' },
    cancelText: { color: colors.text },
  });
}

export function TeachRuleSheet({ tx, onCreated, onCancel }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);
  const [senderPattern, setSenderPattern] = useState(tx.rawSmsSender ?? '');
  const [bodyRegex, setBodyRegex] = useState('');
  const [typeHint, setTypeHint] = useState<'debit' | 'credit' | ''>('');

  const handleCreate = () => {
    if (!senderPattern || !bodyRegex) return;
    parseRulesRepo.addRule({
      senderPattern,
      bodyRegex,
      typeHint: typeHint || null,
    });
    onCreated();
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Teach Spendly this SMS format</Text>
      <Text style={s.label}>Sender pattern (regex)</Text>
      <TextInput style={s.input} value={senderPattern} onChangeText={setSenderPattern} placeholder="e.g. MYBANK" placeholderTextColor={colors.textTertiary} />
      <Text style={s.label}>Body pattern (regex)</Text>
      <TextInput style={s.input} value={bodyRegex} onChangeText={setBodyRegex} placeholder="e.g. (debited|spent)" placeholderTextColor={colors.textTertiary} />
      <Text style={s.label}>Type hint (optional)</Text>
      <View style={s.typeRow}>
        <TouchableOpacity style={[s.typeBtn, typeHint === 'debit' && s.typeSelected]} onPress={() => setTypeHint('debit')}>
          <Text style={typeHint === 'debit' ? s.typeSelectedText : s.typeBtnText}>Debit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.typeBtn, typeHint === 'credit' && s.typeSelected]} onPress={() => setTypeHint('credit')}>
          <Text style={typeHint === 'credit' ? s.typeSelectedText : s.typeBtnText}>Credit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.typeBtn, typeHint === '' && s.typeSelected]} onPress={() => setTypeHint('')}>
          <Text style={typeHint === '' ? s.typeSelectedText : s.typeBtnText}>Auto</Text>
        </TouchableOpacity>
      </View>
      <View style={s.buttons}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.createBtn, !senderPattern || !bodyRegex ? s.btnDisabled : null]} disabled={!senderPattern || !bodyRegex} onPress={handleCreate}>
          <Text style={s.createText}>Create Rule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
