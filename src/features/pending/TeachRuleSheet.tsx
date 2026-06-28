import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { parseRulesRepo } from '@/data/parseRulesRepo';
import type { Transaction } from '@/data/types';

interface Props {
  tx: Transaction;
  onCreated: () => void;
  onCancel: () => void;
}

export function TeachRuleSheet({ tx, onCreated, onCancel }: Props) {
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
    <View style={styles.container}>
      <Text style={styles.title}>Teach Spendly this SMS format</Text>
      <Text style={styles.label}>Sender pattern (regex)</Text>
      <TextInput style={styles.input} value={senderPattern} onChangeText={setSenderPattern} placeholder="e.g. MYBANK" />
      <Text style={styles.label}>Body pattern (regex)</Text>
      <TextInput style={styles.input} value={bodyRegex} onChangeText={setBodyRegex} placeholder="e.g. (debited|spent)" />
      <Text style={styles.label}>Type hint (optional)</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, typeHint === 'debit' && styles.typeSelected]} onPress={() => setTypeHint('debit')}>
          <Text>Debit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, typeHint === 'credit' && styles.typeSelected]} onPress={() => setTypeHint('credit')}>
          <Text>Credit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, typeHint === '' && styles.typeSelected]} onPress={() => setTypeHint('')}>
          <Text>Auto</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.createBtn, !senderPattern || !bodyRegex ? styles.btnDisabled : null]} disabled={!senderPattern || !bodyRegex} onPress={handleCreate}>
          <Text style={styles.createText}>Create Rule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#eee', flex: 1, alignItems: 'center' },
  typeSelected: { backgroundColor: '#007AFF' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 12, backgroundColor: '#ccc', borderRadius: 8 },
  createBtn: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  btnDisabled: { opacity: 0.4 },
  createText: { color: '#fff', fontWeight: '600' },
});
