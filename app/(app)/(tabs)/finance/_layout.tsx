import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#1e293b', headerTitleStyle: { fontWeight: '600' } }}>
      <Stack.Screen name="index" options={{ title: 'Entradas / Saídas' }} />
      <Stack.Screen name="fixed-monthly" options={{ title: 'Fixos Mensais' }} />
      <Stack.Screen name="calendar" options={{ title: 'Calendário' }} />
      <Stack.Screen name="monthly-closing" options={{ title: 'Fechamento Mensal' }} />
    </Stack>
  );
}
