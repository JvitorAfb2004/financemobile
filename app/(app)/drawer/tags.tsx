import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import type { Tag } from '../../../src/types';
import { useState } from 'react';

const TAG_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function Tags() {
  const { tags, addTag, updateTag, deleteTag } = useFinance();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await addTag(name, newColor);
    setNewName('');
    setNewColor(TAG_COLORS[0]);
    setAdding(false);
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name || (name === tags.find(t => t.id === id)?.name && editColor === tags.find(t => t.id === id)?.color)) {
      setEditingId(null);
      return;
    }
    await updateTag(id, { name, color: editColor });
    setEditingId(null);
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('Excluir Tag', `Tem certeza que deseja excluir "${tag.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteTag(tag.id) },
    ]);
  };

  const renderItem = ({ item }: { item: Tag }) => (
    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      {editingId === item.id ? (
        <View style={{ flex: 1, gap: 8 }}>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: '#1e293b' }}
            autoFocus
            onSubmitEditing={() => handleUpdate(item.id)}
          />
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {TAG_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setEditColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: c,
                  borderWidth: editColor === c ? 3 : 0,
                  borderColor: '#1e293b',
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity onPress={() => handleUpdate(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3b82f6' }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingId(null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
              <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: item.color }} />
            <Text style={{ fontSize: 14, color: '#1e293b' }}>{item.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setEditingId(item.id); setEditName(item.name); setEditColor(item.color); }}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#fef2f2' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      data={tags}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Tags</Text>
          {adding ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 8 }}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Nome da tag"
                style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: '#1e293b' }}
                autoFocus
                onSubmitEditing={handleAdd}
              />
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {TAG_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c,
                      borderWidth: newColor === c ? 3 : 0,
                      borderColor: '#1e293b',
                    }}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleAdd} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3b82f6' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Adicionar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setAdding(false); setNewName(''); }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setAdding(true)}
              style={{ paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>+ Adicionar Tag</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );
}
