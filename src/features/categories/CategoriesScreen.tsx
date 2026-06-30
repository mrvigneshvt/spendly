import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { categoriesRepo } from '@/data/categoriesRepo';

export function CategoriesScreen() {
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
    <FlatList
      data={categories}
      keyExtractor={c => c.id}
      renderItem={({ item }) => (
        <View>
          <TouchableOpacity style={styles.catRow} onPress={() => setExpandedCat(expandedCat === item.id ? null : item.id)} onLongPress={() => renameCategory(item.id)}>
            <Text>{item.icon ?? '📁'} {item.name}</Text>
            <TouchableOpacity onPress={() => deleteCategory(item.id)}>
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          {expandedCat === item.id && (
            <View style={styles.subSection}>
              {categoriesRepo.listSubcategories(item.id).map((s: any) => (
                <Text key={s.id} style={styles.subItem}>{s.name}</Text>
              ))}
              <TextInput style={styles.subInput} placeholder="Add subcategory..." value={newSubName} onChangeText={setNewSubName} onSubmitEditing={() => addSubcategory(item.id)} />
            </View>
          )}
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="New category name..." value={newCatName} onChangeText={setNewCatName} onSubmitEditing={addCategory} />
          <TouchableOpacity style={styles.addBtn} onPress={addCategory}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
        </View>
      }
    />
      <Modal visible={renameTarget !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename category</Text>
            <TextInput style={styles.modalInput} value={renameText} onChangeText={setRenameText} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameTarget(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmRename}>
                <Text style={{ color: '#fff' }}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  catRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
  modalCancel: { padding: 10, borderRadius: 8, backgroundColor: '#eee' },
  modalConfirm: { padding: 10, borderRadius: 8, backgroundColor: '#007AFF' },
  deleteBtn: { color: '#c62828', fontSize: 18, padding: 4 },
  subSection: { paddingLeft: 24, paddingVertical: 8, backgroundColor: '#fafafa' },
  subItem: { paddingVertical: 4, fontSize: 14, color: '#555' },
  subInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginTop: 8 },
  addRow: { flexDirection: 'row', padding: 12, gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  addBtn: { padding: 10, backgroundColor: '#007AFF', borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
