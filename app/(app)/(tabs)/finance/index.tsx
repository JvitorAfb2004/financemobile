import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFinance } from '../../../../src/hooks/useFinance';
import { formatCurrency } from '../../../../src/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import MonthNavigator from '../../../../src/components/MonthNavigator';
import TransactionSwipeActions from '../../../../src/components/TransactionSwipeActions';

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseFormattedAmount(formatted: string): number {
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export default function Transactions() {
  const { transactions, categories, tags, selectedMonth, setSelectedMonth, addTransaction, updateTransaction, deleteTransaction, toggleStatus, activeScope } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [rawAmount, setRawAmount] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'PENDING' as 'PENDING' | 'PAID',
    tagIds: [] as string[],
    recurrence: 'NONE' as 'NONE' | 'FIXED' | 'INSTALLMENTS',
    endDate: '',
    installments: 2,
  });
  const router = useRouter();

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const goPrevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const goNextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));

  const handleSave = async () => {
    if (!formData.title || !rawAmount) return;
    const numericAmount = parseFormattedAmount(formData.amount);
    if (numericAmount <= 0) { Alert.alert('Atencao', 'Digite um valor valido'); return; }

    if (activeScope.type !== 'PERSONAL' && formData.tagIds.length === 0) {
      Alert.alert('Atencao', 'Selecione pelo menos uma tag');
      return;
    }

    try {
      if (editingTx) {
        await updateTransaction(editingTx, {
          title: formData.title,
          amount: numericAmount,
          type: formData.type,
          categoryId: formData.categoryId,
          status: formData.status,
          date: formData.date,
          tagIds: formData.tagIds,
        });
      } else {
        await addTransaction(
          {
            ...formData as any,
            amount: numericAmount,
            context: activeScope.type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS',
            endDate: formData.recurrence === 'FIXED' && formData.endDate ? formData.endDate : undefined,
          } as any,
          formData.recurrence === 'NONE' ? undefined : formData.recurrence,
          formData.recurrence === 'INSTALLMENTS' ? formData.installments : undefined,
        );
      }
      setShowForm(false);
      setEditingTx(null);
      setRawAmount('');
      setFormData({
        title: '', amount: '', type: 'EXPENSE', categoryId: '',
        date: format(new Date(), 'yyyy-MM-dd'), status: 'PENDING',
        tagIds: [], recurrence: 'NONE', endDate: '', installments: 2,
      });
    } catch (e) {
      console.error('save transaction error:', e);
      Alert.alert('Erro', 'Nao foi possivel salvar');
    }
  };

  const openEdit = (item: any) => {
    const raw = String(Math.round(item.amount * 100));
    setEditingTx(item.id);
    setRawAmount(raw);
    setFormData({
      title: item.title,
      amount: formatAmount(raw),
      type: item.type,
      categoryId: item.categoryId || '',
      date: item.date,
      status: item.status,
      tagIds: item.tagIds || [],
      recurrence: item.isFixed ? 'FIXED' : (item.installmentInfo ? 'INSTALLMENTS' : 'NONE'),
      endDate: item.endDate || '',
      installments: item.installmentInfo ? parseInt(item.installmentInfo.split('/')[1], 10) : 2,
    });
    setShowForm(true);
  };

  const incomeTotal = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = monthTxs.filter(t => t.type === 'EXPENSE' || t.type === 'CREDIT_CARD').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f9ff' }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>Receitas</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(incomeTotal)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>Despesas</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(expenseTotal)}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
        <MonthNavigator selectedMonth={selectedMonth} onPrev={goPrevMonth} onNext={goNextMonth} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Transacoes</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={monthTxs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhuma transacao encontrada</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find(c => c.id === item.categoryId);
          return (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => (
                <TransactionSwipeActions
                  item={item}
                  onEdit={openEdit}
                  onDelete={deleteTransaction}
                  onToggleStatus={toggleStatus}
                />
              )}
            >
              <TouchableOpacity
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}
                onPress={() => openEdit(item)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <View style={{ width: 4, height: 40, borderRadius: 2, backgroundColor: item.type === 'INCOME' ? '#22c55e' : '#ef4444', marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {cat && <Text style={{ fontSize: 11, color: '#94a3b8' }}>{cat.name}</Text>}
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>•</Text>
                      <Text style={{ fontSize: 11, color: item.status === 'PAID' ? '#22c55e' : '#f59e0b' }}>
                        {item.status === 'PAID' ? 'Pago' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: item.type === 'INCOME' ? '#22c55e' : '#ef4444' }}>
                  {formatCurrency(item.amount)}
                </Text>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}
            keyboardShouldPersistTaps="handled">
            <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 24 }}>
              {editingTx ? 'Editar Transacao' : 'Nova Transacao'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 }}>
              <TouchableOpacity onPress={() => setFormData({ ...formData, type: 'EXPENSE' })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: formData.type === 'EXPENSE' ? '#ef4444' : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: formData.type === 'EXPENSE' ? '#fff' : '#64748b' }}>Saida</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFormData({ ...formData, type: 'INCOME' })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: formData.type === 'INCOME' ? '#22c55e' : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: formData.type === 'INCOME' ? '#fff' : '#64748b' }}>Entrada</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 }}>
              <TouchableOpacity onPress={() => setFormData({ ...formData, status: 'PENDING' })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: formData.status === 'PENDING' ? '#f59e0b' : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: formData.status === 'PENDING' ? '#fff' : '#64748b' }}>Pendente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFormData({ ...formData, status: 'PAID' })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: formData.status === 'PAID' ? '#22c55e' : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: formData.status === 'PAID' ? '#fff' : '#64748b' }}>Pago</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Descricao</Text>
            <TextInput
              value={formData.title} onChangeText={v => setFormData({ ...formData, title: v })}
              style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
              placeholder="Descricao" placeholderTextColor="#94a3b8"
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Valor (R$)</Text>
            <TextInput
              value={formData.amount}
              onChangeText={v => {
                const digits = v.replace(/\D/g, '');
                setRawAmount(digits);
                setFormData({ ...formData, amount: formatAmount(digits) });
              }}
              keyboardType="decimal-pad"
              style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, fontWeight: '600', color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
              placeholder="0,00" placeholderTextColor="#94a3b8"
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Data</Text>
            <TextInput
              value={formData.date}
              onChangeText={v => setFormData({ ...formData, date: v })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
            />

            {categories.length > 0 && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {categories.filter(c => {
                      if (formData.type === 'INCOME') return c.section === 'RECEITA';
                      return c.section === 'CUSTOS' || c.section === 'DESPESAS';
                    }).map(cat => (
                      <TouchableOpacity key={cat.id} onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: formData.categoryId === cat.id ? '#0ea5e9' : '#f1f5f9' }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: formData.categoryId === cat.id ? '#fff' : '#475569' }}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {tags.length > 0 && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Tags</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {tags.map(tag => {
                      const selected = formData.tagIds.includes(tag.id);
                      return (
                        <TouchableOpacity key={tag.id}
                          onPress={() => {
                            if (selected) {
                              setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) });
                            } else {
                              setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                            }
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selected ? tag.color : '#f1f5f9' }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tag.color }} />
                          <Text style={{ fontSize: 12, fontWeight: '500', color: selected ? '#fff' : '#475569' }}>{tag.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Recorrencia</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['NONE', 'FIXED', 'INSTALLMENTS'] as const).map(opt => {
                const labels: Record<string, string> = { NONE: 'Unico', FIXED: 'Fixo Mensal', INSTALLMENTS: 'Parcelado' };
                const active = formData.recurrence === opt;
                return (
                  <TouchableOpacity key={opt} onPress={() => setFormData({ ...formData, recurrence: opt })}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: active ? '#0ea5e9' : '#f1f5f9', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', fontSize: 12, color: active ? '#fff' : '#475569' }}>{labels[opt]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formData.recurrence === 'FIXED' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Data Fim (opcional)</Text>
                <TextInput
                  value={formData.endDate}
                  onChangeText={v => setFormData({ ...formData, endDate: v })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
                />
              </>
            )}

            {formData.recurrence === 'INSTALLMENTS' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>N de Parcelas</Text>
                <TextInput
                  value={String(formData.installments)}
                  onChangeText={v => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n >= 2 && n <= 48) setFormData({ ...formData, installments: n });
                    else if (v === '') setFormData({ ...formData, installments: 2 });
                  }}
                  keyboardType="number-pad"
                  style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
                  placeholder="2"
                  placeholderTextColor="#94a3b8"
                />
                {formData.installments >= 2 && parseFormattedAmount(formData.amount) > 0 && (
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: -8, marginBottom: 14 }}>
                    {formData.installments}x de {formatCurrency(parseFormattedAmount(formData.amount) / formData.installments)}
                  </Text>
                )}
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => { setShowForm(false); setEditingTx(null); }}
                style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#475569', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
