import { View, Text, FlatList } from 'react-native';
import { useFinance } from '../../../../src/hooks/useFinance';
import { formatCurrency } from '../../../../src/lib/utils';
import { useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

export default function CashCalendar() {
  const { transactions, selectedMonth } = useFinance();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const dayTxs = transactions.filter(t => t.date === selectedDate);
  const markedDates: Record<string, any> = {};
  transactions.forEach(t => {
    if (!markedDates[t.date]) markedDates[t.date] = { dots: [] };
    markedDates[t.date].dots.push({ key: t.type, color: t.type === 'INCOME' ? '#22c55e' : '#ef4444' });
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Calendar
        current={format(selectedMonth, 'yyyy-MM-dd')}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markingType="multi-dot"
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: '#3b82f6' },
        }}
        theme={{
          todayTextColor: '#3b82f6',
          selectedDayBackgroundColor: '#3b82f6',
          arrowColor: '#3b82f6',
        }}
      />

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>
          Transações em {selectedDate}
        </Text>
        <FlatList
          data={dayTxs}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>
              Nenhuma transação nesta data
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 }}>{item.title}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: item.type === 'INCOME' ? '#22c55e' : '#ef4444' }}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
