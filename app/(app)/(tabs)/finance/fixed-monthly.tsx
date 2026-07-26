import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useFinance } from '../../../../src/hooks/useFinance';
import { formatCurrency } from '../../../../src/lib/utils';

export default function FixedMonthly() {
  const { transactions, categories } = useFinance();
  const fixed = transactions.filter(t => t.isFixed);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={fixed}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum gasto fixo cadastrado</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find(c => c.id === item.categoryId);
          return (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.title}</Text>
                {cat && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cat.name}</Text>}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(item.amount)}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}
