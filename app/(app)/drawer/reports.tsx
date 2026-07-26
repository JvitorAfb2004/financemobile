import { View, Text, ScrollView } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import { formatCurrency } from '../../../src/lib/utils';

export default function Reports() {
  const { transactions, selectedMonth } = useFinance();

  const year = selectedMonth.getFullYear();
  const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === year);

  const monthSummary = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const mTxs = yearTxs.filter(t => new Date(t.date).getMonth() + 1 === m);
    const income = mTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = mTxs.filter(t => t.type === 'EXPENSE' || t.type === 'CREDIT_CARD').reduce((s, t) => s + t.amount, 0);
    return { month: m, income, expense, balance: income - expense };
  });

  const totalIncome = yearTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = yearTxs.filter(t => t.type === 'EXPENSE' || t.type === 'CREDIT_CARD').reduce((s, t) => s + t.amount, 0);

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 }}>Relatório Anual — {year}</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Receitas</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Despesas</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(totalExpense)}</Text>
        </View>
      </View>

      {monthSummary.map(m => {
        const maxVal = Math.max(...monthSummary.map(x => x.income + x.expense), 1);
        const incomeW = (m.income / maxVal) * 100;
        const expenseW = (m.expense / maxVal) * 100;
        return (
          <View key={m.month} style={{ marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>{MONTHS[m.month - 1]}</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', marginBottom: 2, flexDirection: 'row' }}>
              <View style={{ width: `${incomeW}%`, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', flexDirection: 'row' }}>
              <View style={{ width: `${expenseW}%`, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '600' }}>{formatCurrency(m.income)}</Text>
              <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>{formatCurrency(m.expense)}</Text>
              <Text style={{ fontSize: 11, color: m.balance >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                Saldo: {formatCurrency(m.balance)}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
