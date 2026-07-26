import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFinance } from '../../../src/hooks/useFinance';
import { formatCurrency } from '../../../src/lib/utils';
import { Pencil, Trash2 } from 'lucide-react-native';

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseFormattedAmount(formatted: string): number {
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export default function SpendingLimits() {
  const { spendingLimits, categories, transactions, selectedMonth, addSpendingLimit, updateSpendingLimit, deleteSpendingLimit } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', limitAmount: '', categoryIds: [] as string[] });
  const [rawLimit, setRawLimit] = useState('');

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear() && (t.type === 'EXPENSE' || t.type === 'CREDIT_CARD');
  });

  const toggleCategory = (id: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !rawLimit) return;
    const amount = parseFormattedAmount(form.limitAmount);
    if (amount <= 0) { Alert.alert('Atenção', 'Digite um valor válido'); return; }
    try {
      if (editingId) {
        await updateSpendingLimit(editingId, {
          name: form.name,
          limitAmount: amount,
          categoryIds: form.categoryIds,
        });
      } else {
        await addSpendingLimit({
          name: form.name,
          limitAmount: amount,
          categoryIds: form.categoryIds,
          context: 'PERSONAL',
        });
      }
      setShowForm(false);
      setEditingId(null);
      setRawLimit('');
      setForm({ name: '', limitAmount: '', categoryIds: [] });
    } catch (e) {
      console.error('save spending limit error:', e);
      Alert.alert('Erro', 'Não foi possível salvar');
    }
  };

  const openEdit = (item: any) => {
    const raw = String(Math.round(item.limitAmount * 100));
    setEditingId(item.id);
    setRawLimit(raw);
    setForm({ name: item.name, limitAmount: formatAmount(raw), categoryIds: item.categoryIds || [] });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteSpendingLimit(id) },
    ]);
  };

  const rightActions = (item: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 8 }}>
      <TouchableOpacity onPress={() => openEdit(item)}
        style={{ width: 64, height: '100%', backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>
        <Pencil size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)}
        style={{ width: 64, height: '100%', backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
        <Trash2 size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={spendingLimits}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListHeaderComponent={() => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Limites de Gastos</Text>
            <TouchableOpacity onPress={() => { setEditingId(null); setForm({ name: '', limitAmount: '', categoryIds: [] }); setRawLimit(''); setShowForm(true); }}
              style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>+ Novo</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum limite definido</Text>
          </View>
        }
        renderItem={({ item }) => {
          const catNames = item.categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean);
          const actual = monthTxs.filter(t => item.categoryIds.includes(t.categoryId || '')).reduce((s, t) => s + t.amount, 0);
          const pct = item.limitAmount > 0 ? Math.min(actual / item.limitAmount, 1) : 0;
          const isOver = actual > item.limitAmount;

          return (
            <Swipeable overshootRight={false} renderRightActions={() => rightActions(item)}>
              <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: isOver ? '#ef4444' : '#64748b', fontWeight: '600' }}>
                    {formatCurrency(actual)} / {formatCurrency(item.limitAmount)}
                  </Text>
                </View>
                {catNames.length > 0 && (
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{catNames.join(', ')}</Text>
                )}
                <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
                  <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: isOver ? '#ef4444' : '#0ea5e9' }} />
                </View>
              </View>
            </Swipeable>
          );
        }}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#1e293b' }}>
                {editingId ? 'Editar Limite' : 'Novo Limite'}
              </Text>
              <TextInput value={form.name} onChangeText={v => setForm({ ...form, name: v })}
                style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
                placeholder="Nome do limite" placeholderTextColor="#94a3b8" />
              <TextInput value={form.limitAmount} onChangeText={v => {
                  const digits = v.replace(/\D/g, '');
                  setRawLimit(digits);
                  setForm({ ...form, limitAmount: formatAmount(digits) });
                }}
                keyboardType="decimal-pad"
                style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, fontWeight: '600', color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
                placeholder="0,00" placeholderTextColor="#94a3b8" />

              {categories.length > 0 && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Categorias</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {categories.filter(c => c.section === 'CUSTOS' || c.section === 'DESPESAS').map(cat => (
                        <TouchableOpacity key={cat.id} onPress={() => toggleCategory(cat.id)}
                          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: form.categoryIds.includes(cat.id) ? '#0ea5e9' : '#f1f5f9' }}>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: form.categoryIds.includes(cat.id) ? '#fff' : '#475569' }}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => { setShowForm(false); setEditingId(null); }}
                  style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#475569', fontSize: 15 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave}
                  style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
