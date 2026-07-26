import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFinance } from '../../src/hooks/useFinance';
import { useEffect } from 'react';

export default function AppLayout() {
  const { user, loading } = useFinance();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/(public)');
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#1e293b', headerTitleStyle: { fontWeight: '600' }, headerShadowVisible: false, headerBackTitle: 'Voltar' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="drawer/budget" options={{ title: 'Orçamento' }} />
      <Stack.Screen name="drawer/spending-limits" options={{ title: 'Limites de Gastos' }} />
      <Stack.Screen name="drawer/reports" options={{ title: 'Relatórios' }} />
      <Stack.Screen name="drawer/subscription" options={{ title: 'Assinatura' }} />
      <Stack.Screen name="drawer/settings" options={{ title: 'Configurações' }} />
      <Stack.Screen name="drawer/report-issue" options={{ title: 'Reportar Problema' }} />
    </Stack>
  );
}
