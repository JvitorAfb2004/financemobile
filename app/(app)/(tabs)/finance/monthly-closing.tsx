import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../../../../src/hooks/useFinance';
import { formatCurrency } from '../../../../src/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MonthlyClosing() {
  const { monthlyClosings, transactions, selectedMonth, closeMonth, reopenMonth, activeScope } = useFinance();
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;

  const closing = monthlyClosings.find(c => c.year === year && c.month === month);
  const isClosed = closing?.status === 'CLOSED';

  const contextValue = activeScope.type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS';
  const monthTxs = transactions.filter(
    t => t.type !== 'CREDIT_CARD' && t.context === contextValue &&
      new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() + 1 === month
  );
  const totalIncome = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleClose = () => {
    Alert.alert('Fechar Mês', 'Tem certeza que deseja fechar este mês?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Fechar', onPress: () => closeMonth(year, month).catch(() => Alert.alert('Erro', 'Não foi possível fechar o mês')) },
    ]);
  };

  const handleReopen = () => {
    Alert.alert('Reabrir Mês', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reabrir', onPress: () => reopenMonth(year, month).catch(() => Alert.alert('Erro', 'Não foi possível reabrir')) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: isClosed ? '#22c55e' : '#f59e0b' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
              {isClosed ? 'FECHADO' : 'ABERTO'}
            </Text>
          </View>
        </View>

        <Row label="Receitas" value={totalIncome} color="#22c55e" />
        <Row label="Despesas" value={totalExpense} color="#ef4444" />

        {closing && (
          <>
            <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
            <Row label="Saldo Inicial" value={closing.openingBalance} color="#64748b" />
          </>
        )}

        <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
        <Row label="Saldo do Mês" value={balance} color={balance >= 0 ? '#22c55e' : '#ef4444'} bold />

        {closing && (
          <Row label="Saldo Final" value={closing.closingBalance} color={closing.closingBalance >= 0 ? '#22c55e' : '#ef4444'} bold />
        )}

        <TouchableOpacity
          onPress={isClosed ? handleReopen : handleClose}
          style={{ marginTop: 16, paddingVertical: 14, borderRadius: 10, backgroundColor: isClosed ? '#f59e0b' : '#3b82f6', alignItems: 'center' }}
        >
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: 15 }}>
            {isClosed ? 'Reabrir Mês' : 'Fechar Mês'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 14, color: '#64748b', fontWeight: bold ? '600' : '400' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: bold ? '700' : '600', color }}>{formatCurrency(value)}</Text>
    </View>
  );
}
