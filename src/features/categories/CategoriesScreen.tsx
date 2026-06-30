import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { categoriesRepo } from '@/data/categoriesRepo';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

function useCategoriesStyles(colors: ThemeColors) {
  return StyleSheet.create({
    catRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: colors.modalBg, borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text },
    modalInput: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, backgroundColor: colors.background },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
    modalCancel: { padding: 10, borderRadius: 8, backgroundColor: colors.chipBg },
    modalConfirm: { padding: 10, borderRadius: 8, backgroundColor: colors.primary },
    deleteBtn: { color: colors.danger, fontSize: 18, padding: 4 },
    subSection: { paddingLeft: 24, paddingVertical: 8, backgroundColor: colors.surface },
    subItem: { paddingVertical: 4, fontSize: 14, color: colors.textSecondary },
    subInput: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 6, padding: 8, marginTop: 8, color: colors.text, backgroundColor: colors.background },
    addRow: { flexDirection: 'row', padding: 12, gap: 8 },
    addInput: { flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 10, color: colors.text, backgroundColor: colors.background },
    addBtn: { padding: 10, backgroundColor: colors.primary, borderRadius: 8, justifyContent: 'center' },
    addBtnText: { color: colors.chipSelectedText, fontSize: 18, fontWeight: 'bold' },
    catName: { fontSize: 15, color: colors.text },
    cancelText: { color: colors.text },
    confirmText: { color: colors.chipSelectedText },
  });
}

export function CategoriesScreen() {
  const { colors } = useTheme();
  const s = useCategoriesStyles(colors);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; currentName: string } | null>(null);
  const [renameText, setRenameText] = useState('');

  const refresh = () => setCategories(categoriesRepo.listCategories());
  useEffect(() => { refresh(); }, []);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    categoriesRepo.addCategory(newCatName.trim());
    setNewCatName('');
    refresh();
  };

  const addSubcategory = (categoryId: string) => {
    if (!newSubName.trim()) return;
    categoriesRepo.addSubcategory(categoryId, newSubName.trim());
    setNewSubName('');
    refresh();
  };

  const renameCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setRenameText(cat?.name ?? '');
    setRenameTarget({ id, currentName: cat?.name ?? '' });
  };

  const confirmRename = () => {
    if (renameTarget && renameText.trim()) {
      categoriesRepo.renameCategory(renameTarget.id, renameText.trim());
      refresh();
    }
    setRenameTarget(null);
  };

  const deleteCategory = (id: string) => {
    try {
      categoriesRepo.deleteCategory(id);
      refresh();
    } catch (e: any) {
      Alert.alert('Cannot delete', 'Reassign transactions first');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <FlatList
      data={categories}
      keyExtractor={c => c.id}
      renderItem={({ item }) => (
        <View>
          <TouchableOpacity style={s.catRow} onPress={() => setExpandedCat(expandedCat === item.id ? null : item.id)} onLongPress={() => renameCategory(item.id)}>
            <Text style={s.catName}>{item.icon ?? '📁'} {item.name}</Text>
            <TouchableOpacity onPress={() => deleteCategory(item.id)}>
              <Text style={s.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          {expandedCat === item.id && (
            <View style={s.subSection}>
              {categoriesRepo.listSubcategories(item.id).map((s: any) => (
                <Text key={s.id} style={s.subItem}>{s.name}</Text>
              ))}
              <TextInput style={s.subInput} placeholder="Add subcategory..." placeholderTextColor={colors.textTertiary} value={newSubName} onChangeText={setNewSubName} onSubmitEditing={() => addSubcategory(item.id)} />
            </View>
          )}
        </View>
      )}
      ListHeaderComponent={
        <View style={s.addRow}>
          <TextInput style={s.addInput} placeholder="New category name..." placeholderTextColor={colors.textTertiary} value={newCatName} onChangeText={setNewCatName} onSubmitEditing={addCategory} />
          <TouchableOpacity style={s.addBtn} onPress={addCategory}><Text style={s.addBtnText}>+</Text></TouchableOpacity>
        </View>
      }
    />
      <Modal visible={renameTarget !== null} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Rename category</Text>
            <TextInput style={s.modalInput} value={renameText} onChangeText={setRenameText} autoFocus placeholderTextColor={colors.textTertiary} />
            <View style={s.modalButtons}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setRenameTarget(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmRename}>
                <Text style={s.confirmText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
