import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import { formatCurrency } from '../../../src/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Eye, EyeOff, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react-native';

export default function Dashboard() {
  const { transactions, categories, selectedMonth, setSelectedMonth, activeScope, accounts, user } = useFinance();
  const [valuesVisible, setValuesVisible] = useState(true);
  const router = useRouter();

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();
  });

  const totalIncome = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'EXPENSE' || t.type === 'CREDIT_CARD').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const recentTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const goPrevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const goNextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: '#64748b' }}>Olá, {user?.displayName || user?.email?.split('@')[0] || 'usuário'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>
              {activeScope.type === 'PERSONAL' ? 'Visão Geral' : activeScope.accountName}
            </Text>
            <TouchableOpacity onPress={() => setValuesVisible(!valuesVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {valuesVisible ? <Eye size={20} color="#94a3b8" /> : <EyeOff size={20} color="#94a3b8" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
          <TouchableOpacity onPress={goPrevMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} color="#475569" />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <TouchableOpacity onPress={goNextMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={14} color="#22c55e" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Receitas</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#22c55e' }}>
              {valuesVisible ? formatCurrency(totalIncome) : '••••'}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingDown size={14} color="#ef4444" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Despesas</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#ef4444' }}>
              {valuesVisible ? formatCurrency(totalExpense) : '••••'}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <PiggyBank size={16} color={balance >= 0 ? '#22c55e' : '#ef4444'} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Saldo do Mês</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: balance >= 0 ? '#22c55e' : '#ef4444' }}>
            {valuesVisible ? formatCurrency(balance) : '••••'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Últimas Transações</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/finance')}>
            <Text style={{ fontSize: 13, color: '#0ea5e9', fontWeight: '500' }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentTxs.length === 0 ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhuma transação neste mês</Text>
          </View>
        ) : (
          recentTxs.slice(0, 5).map(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            return (
              <TouchableOpacity
                key={tx.id}
                onPress={() => router.push('/(app)/(tabs)/finance')}
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: tx.type === 'INCOME' ? '#f0fdf4' : '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {tx.type === 'INCOME' ? <TrendingUp size={18} color="#22c55e" /> : <TrendingDown size={18} color="#ef4444" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{tx.title}</Text>
                  {cat && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{cat.name}</Text>}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tx.type === 'INCOME' ? '#22c55e' : '#ef4444' }}>
                  {valuesVisible ? formatCurrency(tx.amount) : '••••'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
