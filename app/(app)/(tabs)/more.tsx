import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinance } from '../../../src/hooks/useFinance';
import { Settings, BarChart3, AlertTriangle, CreditCard, Bug, FileText } from 'lucide-react-native';

const menuItems = [
  { icon: BarChart3, label: 'Orçamento', route: '/(app)/drawer/budget' },
  { icon: AlertTriangle, label: 'Limites de Gastos', route: '/(app)/drawer/spending-limits' },
  { icon: FileText, label: 'Relatórios', route: '/(app)/drawer/reports' },
  { icon: CreditCard, label: 'Assinatura', route: '/(app)/drawer/subscription' },
];

export default function More() {
  const router = useRouter();
  const { user, signOut } = useFinance();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16, paddingBottom: 80 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>Menu</Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{user?.email}</Text>

        <View style={{ marginBottom: 24 }}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route as any)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
              <item.icon size={20} color="#3b82f6" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b', flex: 1 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.push('/(app)/drawer/settings')}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
            <Settings size={20} color="#64748b" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b', flex: 1 }}>Configurações</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/drawer/report-issue')}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
            <Bug size={20} color="#64748b" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b', flex: 1 }}>Reportar Problema</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout}
          style={{ paddingVertical: 14, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' }}>
          <Text style={{ fontWeight: '600', color: '#dc2626', fontSize: 15 }}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
