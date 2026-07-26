import { View, Text, ScrollView } from 'react-native';

export default function Subscription() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Assinatura</Text>
        <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
          Gerencie seu plano e visualize o status da sua assinatura.
        </Text>
        <View style={{ width: '100%', padding: 16, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>Plano Ativo</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Sua assinatura está ativa</Text>
        </View>
      </View>
    </ScrollView>
  );
}
