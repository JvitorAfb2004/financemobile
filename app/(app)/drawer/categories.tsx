import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import { SECTION_LABELS } from '../../../src/lib/categories';
import type { DRESection, Category } from '../../../src/types';
import { useState } from 'react';

const SECTIONS: DRESection[] = ['RECEITA', 'CUSTOS', 'DESPESAS'];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [addingSection, setAddingSection] = useState<DRESection | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const grouped: Record<DRESection, Category[]> = { RECEITA: [], CUSTOS: [], DESPESAS: [] };
  for (const c of categories) {
    grouped[c.section]?.push(c);
  }
  for (const s of SECTIONS) {
    grouped[s].sort((a, b) => a.order - b.order);
  }

  const handleAdd = async (section: DRESection) => {
    const name = newName.trim();
    if (!name) return;
    await addCategory(name, section);
    setNewName('');
    setAddingSection(null);
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name || name === categories.find(c => c.id === id)?.name) {
      setEditingId(null);
      return;
    }
    await updateCategory(id, { name });
    setEditingId(null);
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Excluir Categoria', `Tem certeza que deseja excluir "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {SECTIONS.map(section => (
        <View key={section} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>
            {SECTION_LABELS[section]}
          </Text>

          {grouped[section].map(cat => (
            <View key={cat.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingId === cat.id ? (
                <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: '#1e293b' }}
                    autoFocus
                    onSubmitEditing={() => handleUpdate(cat.id)}
                  />
                  <TouchableOpacity onPress={() => handleUpdate(cat.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3b82f6' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                    <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, color: '#1e293b' }}>{cat.name}</Text>
                    {cat.isDefault && (
                      <Text style={{ fontSize: 10, color: '#94a3b8', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>Padrao</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Editar</Text>
                    </TouchableOpacity>
                    {!cat.isDefault && (
                      <TouchableOpacity onPress={() => handleDelete(cat)}
                        style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#fef2f2' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>Excluir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          ))}

          {addingSection === section ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Nome da categoria"
                style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: '#1e293b' }}
                autoFocus
                onSubmitEditing={() => handleAdd(section)}
              />
              <TouchableOpacity onPress={() => handleAdd(section)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3b82f6' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Adicionar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingSection(null); setNewName(''); }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setAddingSection(section)}
              style={{ paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>+ Adicionar Categoria</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
