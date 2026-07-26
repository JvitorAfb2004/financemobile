import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import { formatCurrency } from '../../../src/lib/utils';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function BudgetScreen() {
  const { budgets, categories, selectedMonth, upsertBudget, transactions } = useFinance();
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const month = selectedMonth.getMonth() + 1;
  const year = selectedMonth.getFullYear();

  const handleSave = async (categoryId: string) => {
    if (!editValue) return;
    await upsertBudget(categoryId, parseFloat(editValue));
    setEditingCat(null);
  };

  const catList = categories.filter(c => c.section === 'RECEITA' || c.section === 'CUSTOS');
  const sections = ['RECEITA', 'CUSTOS'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={catList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListHeaderComponent={() => (
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 }}>
            Orçamento - {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
          </Text>
        )}
        renderItem={({ item }) => {
          const budget = budgets.find(b => b.categoryId === item.id && b.month === month && b.year === year);
          const actual = transactions.filter(t => {
            const d = new Date(t.date);
            return t.categoryId === item.id && d.getMonth() + 1 === month && d.getFullYear() === year;
          }).reduce((s, t) => s + t.amount, 0);
          const planned = budget?.plannedAmount || 0;

          return (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Planejado: <Text style={{ fontWeight: '700' }}>{planned > 0 ? formatCurrency(planned) : '—'}</Text></Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Real: <Text style={{ fontWeight: '700' }}>{formatCurrency(actual)}</Text></Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { setEditingCat(item.id); setEditValue(String(planned)); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Editar</Text>
                </TouchableOpacity>
              </View>
              {editingCat === item.id && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    value={editValue} onChangeText={setEditValue}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 13, color: '#1e293b' }}
                    placeholder="0,00"
                  />
                  <TouchableOpacity onPress={() => handleSave(item.id)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#3b82f6', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: '600', color: '#fff', fontSize: 12 }}>OK</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
