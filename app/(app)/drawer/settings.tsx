import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

export default function Settings() {
  const { user, signOut, activeScope, setActiveScope, accounts, pendingInvites, acceptInvite, transactions } = useFinance();
  const { updateBadge } = useNotifications();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const scopeOptions = [
    { label: 'Pessoal', scope: { type: 'PERSONAL' as const, userId: user?.uid || '' } },
    ...accounts.map(acc => ({
      label: acc.name,
      scope: { type: 'ACCOUNT' as const, accountId: acc.id, accountName: acc.name, role: acc.memberRole || 'member' as const },
    })),
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 }}>Configurações</Text>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Conta</Text>
        <Text style={{ fontSize: 16, color: '#1e293b', marginBottom: 4 }}>{user?.displayName || 'Usuário'}</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8' }}>{user?.email}</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Contexto Ativo</Text>
        {scopeOptions.map((opt, i) => {
          const isActive = opt.scope.type === 'PERSONAL'
            ? activeScope.type === 'PERSONAL'
            : activeScope.type === 'ACCOUNT' && activeScope.accountId === opt.scope.accountId;
          return (
            <TouchableOpacity key={i} onPress={() => setActiveScope(opt.scope as any)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: isActive ? '#eff6ff' : 'transparent', borderRadius: 8, marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isActive ? '#3b82f6' : '#d1d5db', marginRight: 10 }} />
              <Text style={{ fontSize: 14, color: isActive ? '#1e40af' : '#475569', fontWeight: isActive ? '600' : '400' }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Gerenciar</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/drawer/categories')}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 14, color: '#475569' }}>Categorias</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/drawer/tags')}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, color: '#475569' }}>Tags</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Notificacoes</Text>
        <TouchableOpacity onPress={async () => {
          updateBadge().then(() => Alert.alert('Pronto', 'Notificacoes sincronizadas')).catch(() => Alert.alert('Erro', 'Falha ao sincronizar'));
        }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 8 }}>
          <Bell size={16} color="#475569" />
          <Text style={{ fontSize: 14, color: '#475569' }}>Sincronizar Notificacoes</Text>
        </TouchableOpacity>
      </View>

      {pendingInvites.length > 0 && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Convites Pendentes</Text>
          {pendingInvites.map(invite => (
            <View key={invite.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: '#475569' }}>{invite.accountId}</Text>
              <TouchableOpacity onPress={() => acceptInvite(invite.id, invite.accountId)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3b82f6' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={handleLogout}
        style={{ paddingVertical: 14, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', color: '#dc2626', fontSize: 15 }}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
