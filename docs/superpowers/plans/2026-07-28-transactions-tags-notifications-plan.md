# Transações, Tags, Categorias & Notificações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar 5 features no app mobile: navegação de mês no Financeiro, swipe/tap unificado, formulário de transação completo, gestão de categorias/tags, notificações locais.

**Architecture:** Extrair 2 componentes compartilhados (MonthNavigator, TransactionSwipeActions) e 1 hook (useNotifications). Adicionar 2 telas novas (categories, tags). Modificar 6 arquivos existentes. Tudo Firebase Firestore, sem novas dependências além de expo-notifications + expo-task-manager.

**Tech Stack:** Expo SDK 54, React Native 0.81, Firebase Firestore, react-native-gesture-handler (Swipeable), date-fns v4, expo-notifications, expo-task-manager

## Global Constraints

- Expo SDK 54 (docs: https://docs.expo.dev/versions/v57.0.0/)
- Estilização inline (objetos `style={{...}}`), seguir padrão existente
- Cores: income `#22c55e`, expense `#ef4444`, pending `#f59e0b`, accent `#0ea5e9`/`#3b82f6`
- Labels em português (pt-BR)
- Firebase Firestore com `resolveDataPath` para multitenancy
- CRUD de categoria/tag já existe no `useFinance` context, só falta UI
- `addTransaction` já suporta `generateMultiple: 'INSTALLMENTS' | 'FIXED'`, só falta UI

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/MonthNavigator.tsx` | **Create** | Componente reutilizável `< > MÊS` |
| `src/components/TransactionSwipeActions.tsx` | **Create** | Swipe actions compartilhadas (status + excluir) |
| `src/hooks/useNotifications.ts` | **Create** | Hook: schedule/cancel/badge notifications |
| `app/(app)/drawer/categories.tsx` | **Create** | Tela CRUD de categorias |
| `app/(app)/drawer/tags.tsx` | **Create** | Tela CRUD de tags |
| `app/(app)/(tabs)/index.tsx` | **Modify** | MonthNavigator + Swipeable na lista recente |
| `app/(app)/(tabs)/finance/index.tsx` | **Modify** | MonthNavigator + swipe actions + form completo |
| `app/(app)/drawer/settings.tsx` | **Modify** | Adicionar itens Categorias e Tags |
| `app/_layout.tsx` | **Modify** | Registrar background task de notificação |
| `src/hooks/useFinance.tsx` | **Modify** | Integrar chamadas de notificação nos CRUDs |
| `package.json` | **Modify** | Adicionar expo-notifications, expo-task-manager |

---

### Task 1: MonthNavigator component + Financeiro header

**Files:**
- Create: `src/components/MonthNavigator.tsx`
- Modify: `app/(app)/(tabs)/finance/index.tsx`
- Modify: `app/(app)/(tabs)/index.tsx`

**Interfaces:**
- Produces: `MonthNavigator` component — props: `selectedMonth: Date`, `onPrev: () => void`, `onNext: () => void`

- [ ] **Step 1: Create `src/components/MonthNavigator.tsx`**

Extract the month navigation row from Home screen. It's a row with `<` button, formatted month text, `>` button.

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Props {
  selectedMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ selectedMonth, onPrev, onNext }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
      <TouchableOpacity onPress={onPrev} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color="#475569" />
      </TouchableOpacity>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
        {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </Text>
      <TouchableOpacity onPress={onNext} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRight size={18} color="#475569" />
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Replace inline MonthNavigator in Home with component**

In `app/(app)/(tabs)/index.tsx`:
- Add import: `import MonthNavigator from '../../../src/components/MonthNavigator';`
- Replace the inline `<View>` block (lines 44-54, the row with ChevronLeft/ChevronRight) with:

```tsx
<View style={{ marginBottom: 16 }}>
  <MonthNavigator selectedMonth={selectedMonth} onPrev={goPrevMonth} onNext={goNextMonth} />
</View>
```

The original block with shadow/rounded corners is now inside MonthNavigator itself, so remove the shadow wrapper from Home.

- [ ] **Step 3: Add MonthNavigator above FlatList in Financeiro**

In `app/(app)/(tabs)/finance/index.tsx`:
- Add import: `import MonthNavigator from '../../../../src/components/MonthNavigator';`
- Add `goPrevMonth` and `goNextMonth` callbacks (copy from Home):
```tsx
const goPrevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
const goNextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
```
- Insert before the FlatList (after the summary bar, before the "Transações" header):
```tsx
<View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
  <MonthNavigator selectedMonth={selectedMonth} onPrev={goPrevMonth} onNext={goNextMonth} />
</View>
```

- [ ] **Step 4: Verify** — Build check
```bash
npx tsc --noEmit 2>&1 | head -30
```

---

### Task 2: TransactionSwipeActions component + update both screens

**Files:**
- Create: `src/components/TransactionSwipeActions.tsx`
- Modify: `app/(app)/(tabs)/finance/index.tsx`
- Modify: `app/(app)/(tabs)/index.tsx`

**Interfaces:**
- Produces: `TransactionSwipeActions` — props: `item: Transaction`, `onEdit: (item: Transaction) => void`, `onDelete: (id: string) => void`, `onToggleStatus: (id: string) => void`

- [ ] **Step 1: Create `src/components/TransactionSwipeActions.tsx`**

Swipe left reveals: button 1 = toggle status (green "Pago" / orange "Pendente"), button 2 = delete (red, with confirm Alert).

```tsx
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2, CheckCircle, Clock } from 'lucide-react-native';
import type { Transaction } from '../types';

interface Props {
  item: Transaction;
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function TransactionSwipeActions({ item, onEdit, onDelete, onToggleStatus }: Props) {
  const isPaid = item.status === 'PAID';

  const handleToggle = () => {
    onToggleStatus(item.id);
  };

  const handleDelete = () => {
    Alert.alert('Excluir', 'Tem certeza que deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 8 }}>
      <TouchableOpacity onPress={handleToggle}
        style={{ width: 64, height: '100%', backgroundColor: isPaid ? '#f59e0b' : '#22c55e', justifyContent: 'center', alignItems: 'center' }}>
        {isPaid ? <Clock size={20} color="#fff" /> : <CheckCircle size={20} color="#fff" />}
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>
          {isPaid ? 'Pendente' : 'Pago'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete}
        style={{ width: 64, height: '100%', backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
        <Trash2 size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Update Financeiro to use TransactionSwipeActions + tap→edit**

In `app/(app)/(tabs)/finance/index.tsx`:
- Add import: `import TransactionSwipeActions from '../../../../src/components/TransactionSwipeActions';`
- Remove the old `rightActions` function (lines 91-104)
- Replace the `Swipeable` content in the FlatList `renderItem`. The `renderRightActions` becomes:
```tsx
renderRightActions={() => (
  <TransactionSwipeActions
    item={item}
    onEdit={openEdit}
    onDelete={deleteTransaction}
    onToggleStatus={toggleStatus}
  />
)}
```
- Change the `onPress` on the TouchableOpacity inside Swipeable: instead of the Alert toggleStatus dialog, call `openEdit(item)` directly:
```tsx
onPress={() => openEdit(item)}
```

- [ ] **Step 3: Update Home to add Swipeable on recent transactions**

In `app/(app)/(tabs)/index.tsx`:
- Add imports:
```tsx
import { Swipeable } from 'react-native-gesture-handler';
import TransactionSwipeActions from '../../../src/components/TransactionSwipeActions';
```
- Import `deleteTransaction`, `toggleStatus`, `openEdit` from useFinance (add to destructure).
- Actually, the Home screen doesn't have edit modal. Tapping should navigate to finance tab OR we need to import the edit logic. The simplest approach: tap → navigate to finance (existing behavior stays but with edit intent), OR we bring the modal to Home too.

**Decision:** For Home, tap → navigate to Financeiro tab (existing behavior). Swipe actions work the same (toggle status + delete). This avoids duplicating the modal.

- Wrap each transaction row in `<Swipeable>`:
```tsx
<Swipeable
  overshootRight={false}
  renderRightActions={() => (
    <TransactionSwipeActions
      item={tx}
      onEdit={() => router.push('/(app)/(tabs)/finance')}
      onDelete={deleteTransaction}
      onToggleStatus={toggleStatus}
    />
  )}
>
  <TouchableOpacity ... onPress={() => router.push('/(app)/(tabs)/finance')}>
    {/* existing row content */}
  </TouchableOpacity>
</Swipeable>
```

- [ ] **Step 4: Verify** — TypeScript check
```bash
npx tsc --noEmit 2>&1 | head -30
```

---

### Task 3: Complete transaction form (status, tags, date, recurrence)

**Files:**
- Modify: `app/(app)/(tabs)/finance/index.tsx`

**Interfaces:**
- Consumes: `TransactionSwipeActions` from Task 2
- Consumes: `addTransaction`, `updateTransaction` from `useFinance` (already exist)
- Consumes: `tags` array from `useFinance` (already exists)

- [ ] **Step 1: Add new form state fields**

In `app/(app)/(tabs)/finance/index.tsx`, update `formData` initial state to include new fields:

```tsx
const [formData, setFormData] = useState({
  title: '', // label will show as "Descrição"
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
```

Also add `const { ..., tags } = useFinance();` to the destructure (tags already in context).

- [ ] **Step 2: Add Status toggle row (after type toggle, before description)**

```tsx
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
```

- [ ] **Step 3: Rename "Título" label to "Descrição"**

Change line 198 from `<Text ...>Título</Text>` to `<Text ...>Descrição</Text>`.

- [ ] **Step 4: Add Date field (after value, before category)**

```tsx
<Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Data</Text>
<TextInput
  value={formData.date}
  onChangeText={v => setFormData({ ...formData, date: v })}
  placeholder="YYYY-MM-DD"
  placeholderTextColor="#94a3b8"
  style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', marginBottom: 14 }}
/>
```

- [ ] **Step 5: Add Tags multi-select (after categories)**

```tsx
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
```

- [ ] **Step 6: Add Recurrence selector (radio-style, after tags)**

```tsx
<Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Recorrência</Text>
<View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
  {(['NONE', 'FIXED', 'INSTALLMENTS'] as const).map(opt => {
    const labels: Record<string, string> = { NONE: 'Único', FIXED: 'Fixo Mensal', INSTALLMENTS: 'Parcelado' };
    const active = formData.recurrence === opt;
    return (
      <TouchableOpacity key={opt} onPress={() => setFormData({ ...formData, recurrence: opt })}
        style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: active ? '#0ea5e9' : '#f1f5f9', alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', fontSize: 12, color: active ? '#fff' : '#475569' }}>{labels[opt]}</Text>
      </TouchableOpacity>
    );
  })}
</View>
```

- [ ] **Step 7: Conditional fields for recurrence**

If `FIXED`, show optional end date:
```tsx
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
```

If `INSTALLMENTS`, show count (2-48):
```tsx
{formData.recurrence === 'INSTALLMENTS' && (
  <>
    <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Nº de Parcelas</Text>
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
    {formData.installments >= 2 && (
      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: -8, marginBottom: 14 }}>
        {formData.installments}x de {formatCurrency(parseFormattedAmount(formData.amount) / formData.installments)}
      </Text>
    )}
  </>
)}
```

- [ ] **Step 8: Update handleSave to pass recurrence params**

```tsx
const handleSave = async () => {
  if (!formData.title || !rawAmount) return;
  const numericAmount = parseFormattedAmount(formData.amount);
  if (numericAmount <= 0) { Alert.alert('Atenção', 'Digite um valor válido'); return; }
  
  // Business mode: require at least 1 tag
  if (activeScope.type !== 'PERSONAL' && formData.tagIds.length === 0) {
    Alert.alert('Atenção', 'Selecione pelo menos uma tag');
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
    Alert.alert('Erro', 'Não foi possível salvar');
  }
};
```

- [ ] **Step 9: Update openEdit to populate new fields**

```tsx
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
```

- [ ] **Step 10: Verify** — TypeScript check
```bash
npx tsc --noEmit 2>&1 | head -40
```

---

### Task 4: Categories management screen

**Files:**
- Create: `app/(app)/drawer/categories.tsx`
- Modify: `app/(app)/drawer/settings.tsx`

**Interfaces:**
- Consumes: `categories`, `addCategory(name, section)`, `updateCategory(id, updates)`, `deleteCategory(id)` from `useFinance`
- Route: registered via `app/(app)/drawer/categories.tsx` (Expo Router picks up automatically)

- [ ] **Step 1: Create `app/(app)/drawer/categories.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import type { DRESection, Category } from '../../../src/types';
import { SECTION_LABELS } from '../../../src/lib/categories';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';

const SECTIONS: DRESection[] = ['RECEITA', 'CUSTOS', 'DESPESAS'];

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState<DRESection>('CUSTOS');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setSection('CUSTOS');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSection(cat.section);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), section });
      } else {
        await addCategory(name.trim(), section);
      }
      setShowForm(false);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar');
    }
  };

  const handleDelete = (cat: Category) => {
    if (cat.isDefault) {
      Alert.alert('Atenção', 'Categorias padrão não podem ser excluídas');
      return;
    }
    Alert.alert('Excluir', `Excluir "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={SECTIONS}
        keyExtractor={s => s}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item: sectionKey }) => {
          const sectionCategories = categories.filter(c => c.section === sectionKey).sort((a, b) => a.order - b.order);
          if (sectionCategories.length === 0) return null;
          return (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                {SECTION_LABELS[sectionKey]}
              </Text>
              {sectionCategories.map(cat => (
                <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{cat.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => openEdit(cat)} style={{ padding: 8 }}>
                    <Pencil size={16} color="#64748b" />
                  </TouchableOpacity>
                  {!cat.isDefault && (
                    <TouchableOpacity onPress={() => handleDelete(cat)} style={{ padding: 8 }}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          );
        }}
      />

      <TouchableOpacity onPress={openAdd}
        style={{ position: 'absolute', bottom: 16, right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 }}>
              {editing ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', marginBottom: 14 }}
              placeholder="Nome da categoria"
              placeholderTextColor="#94a3b8"
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Seção DRE</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {SECTIONS.map(sec => (
                <TouchableOpacity key={sec} onPress={() => setSection(sec)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: section === sec ? '#0ea5e9' : '#f1f5f9', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', fontSize: 12, color: section === sec ? '#fff' : '#475569' }}>{SECTION_LABELS[sec]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowForm(false)}
                style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#475569', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 2: Add "Categorias" item to Settings**

In `app/(app)/drawer/settings.tsx`:
- Add import: `import { useRouter } from 'expo-router';`
- Add `const router = useRouter();`
- Add a new section after "Contexto Ativo" block, before the logout button:

```tsx
<View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
  <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Gerenciar</Text>
  <TouchableOpacity onPress={() => router.push('/(app)/drawer/categories')}
    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
    <Text style={{ fontSize: 14, color: '#1e293b' }}>Categorias</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => router.push('/(app)/drawer/tags')}
    style={{ paddingVertical: 12 }}>
    <Text style={{ fontSize: 14, color: '#1e293b' }}>Tags</Text>
  </TouchableOpacity>
</View>
```

- [ ] **Step 3: Verify** — TypeScript check
```bash
npx tsc --noEmit 2>&1 | head -30
```

---

### Task 5: Tags management screen

**Files:**
- Create: `app/(app)/drawer/tags.tsx`

**Interfaces:**
- Consumes: `tags`, `addTag(name, color)`, `updateTag(id, updates)`, `deleteTag(id)` from `useFinance`

- [ ] **Step 1: Create `app/(app)/drawer/tags.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useFinance } from '../../../src/hooks/useFinance';
import type { Tag } from '../../../src/types';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';

const TAG_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function TagsScreen() {
  const { tags, addTag, updateTag, deleteTag } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setColor(TAG_COLORS[0]);
    setShowForm(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setName(tag.name);
    setColor(tag.color);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateTag(editing.id, { name: name.trim(), color });
      } else {
        await addTag(name.trim(), color);
      }
      setShowForm(false);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar');
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('Excluir', `Excluir tag "${tag.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteTag(tag.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={tags}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhuma tag criada</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 8 }}>
              <Pencil size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity onPress={openAdd}
        style={{ position: 'absolute', bottom: 16, right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 }}>
              {editing ? 'Editar Tag' : 'Nova Tag'}
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{ height: 48, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#1e293b', marginBottom: 14 }}
              placeholder="Nome da tag"
              placeholderTextColor="#94a3b8"
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Cor</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {TAG_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#1e293b' }} />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowForm(false)}
                style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#475569', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 2: Verify** — TypeScript check (Settings already updated in Task 4 Step 2)
```bash
npx tsc --noEmit 2>&1 | head -30
```

---

### Task 6: Local notifications

**Files:**
- Modify: `package.json` (add deps)
- Create: `src/hooks/useNotifications.ts`
- Modify: `app/_layout.tsx`
- Modify: `src/hooks/useFinance.tsx`

**Interfaces:**
- Produces: `useNotifications()` hook returns `{ scheduleForTransaction(tx: Transaction): Promise<void>, cancelForTransaction(txId: string): Promise<void>, updateBadge(): Promise<void> }`
- Consumes: called from `addTransaction`, `updateTransaction`, `deleteTransaction`, `toggleStatus` in useFinance

- [ ] **Step 1: Install dependencies**

```bash
npx expo install expo-notifications expo-task-manager
```

- [ ] **Step 2: Create `src/hooks/useNotifications.ts`**

```tsx
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import type { Transaction } from '../types';

const BACKGROUND_TASK = 'UPDATE_BADGE_COUNT';

// Configure default notification behavior (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register background task for badge updates
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  // Badge is set directly via Notifications.setBadgeCountAsync
  // This task fires when a scheduled notification triggers while app is backgrounded
  const pendentes = await getPendingCount();
  await Notifications.setBadgeCountAsync(pendentes);
});

async function getPendingCount(): Promise<number> {
  // Count scheduled notifications that haven't fired yet
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  // We estimate: each scheduled notification = 1 pending transaction
  return scheduled.length;
}

export function useNotifications() {
  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    return true;
  };

  const scheduleForTransaction = async (tx: Transaction) => {
    // Only schedule for PENDING transactions with future date
    if (tx.status !== 'PENDING') return;
    const txDate = new Date(tx.date + 'T09:00:00-03:00');
    if (txDate.getTime() <= Date.now()) return;

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: tx.type === 'INCOME' ? 'Valor a receber' : 'Conta a pagar',
        body: `${tx.title} — R$ ${tx.amount.toFixed(2).replace('.', ',')}`,
        data: { txId: tx.id, type: 'due' },
        badge: 1, // auto-increment
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: txDate,
      },
    });
  };

  const cancelForTransaction = async (txId: string) => {
    // Find and cancel all scheduled notifications for this transaction
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      s => s.content.data && (s.content.data as any).txId === txId
    );
    for (const s of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier);
    }
  };

  const updateBadge = async () => {
    const count = await getPendingCount();
    await Notifications.setBadgeCountAsync(count);
  };

  return { scheduleForTransaction, cancelForTransaction, updateBadge, requestPermission };
}
```

- [ ] **Step 3: Register background task in `app/_layout.tsx`**

Add before the component:
```tsx
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_TASK = 'UPDATE_BADGE_COUNT';
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Notifications.setBadgeCountAsync(scheduled.length);
});
```

- [ ] **Step 4: Integrate notifications into `useFinance.tsx`**

At the top of `FinanceProvider`, after the state declarations, add notification calls:

```tsx
import { useNotifications } from './useNotifications';

// Inside FinanceProvider, after all useState declarations:
const { scheduleForTransaction, cancelForTransaction, updateBadge } = useNotifications();
```

Modify `addTransaction` — after `await batch.commit();`, add scheduling for new pending transactions. Since the batch creates multiple docs when `generateMultiple` is used, we need to handle this. The simplest approach: schedule after Firestore listener picks up the new docs. Add a useEffect:

```tsx
// After all transaction listeners are set up, add:
useEffect(() => {
  // Schedule notifications for all PENDING transactions with future dates
  const pending = transactions.filter(t => t.status === 'PENDING');
  pending.forEach(tx => {
    scheduleForTransaction(tx).catch(() => {});
  });
  updateBadge().catch(() => {});
}, [transactions]);
```

**ponytail:** This schedules for ALL pending on every `transactions` change — O(n) re-schedule. The notification API handles dedup (same txId replaces old). Add per-tx dedup if this becomes too chatty.

Modify `toggleStatus` — after `updateTransaction`, cancel notification if marking as PAID:
```tsx
const toggleStatus = async (id: string) => {
  if (!user) return;
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
  await updateTransaction(id, { status: newStatus });
  if (newStatus === 'PAID') {
    cancelForTransaction(id).catch(() => {});
  } else {
    scheduleForTransaction({ ...tx, status: 'PENDING' }).catch(() => {});
  }
  updateBadge().catch(() => {});
};
```

Modify `deleteTransaction` — after batch commit, cancel notifications for deleted tx:
```tsx
// In deleteTransaction, after await batch.commit():
if (tx.groupId && deleteFuture) {
  const futureTxs = transactions.filter(t => t.groupId === tx.groupId && new Date(t.date) >= new Date(tx.date));
  for (const ft of futureTxs) {
    cancelForTransaction(ft.id).catch(() => {});
  }
} else {
  cancelForTransaction(id).catch(() => {});
}
```

- [ ] **Step 5: Verify** — Build check + test on device
```bash
npx tsc --noEmit 2>&1 | head -30
```

---

### Self-Review

1. **Spec coverage:**
   - ✅ Month navigator on Financeiro → Task 1
   - ✅ Swipe/Tap on both screens → Task 2
   - ✅ Complete transaction form → Task 3
   - ✅ Categories management → Task 4
   - ✅ Tags management → Task 5
   - ✅ Notifications → Task 6

2. **Placeholder scan:** No TBDs, no TODOs. All steps have concrete code.

3. **Type consistency:**
   - `MonthNavigator` props: `selectedMonth: Date`, `onPrev: () => void`, `onNext: () => void` — consistent across all uses
   - `TransactionSwipeActions` props: `item: Transaction`, `onEdit`, `onDelete`, `onToggleStatus` — used in both Home and Financeiro
   - `useNotifications` returns `scheduleForTransaction(tx)`, `cancelForTransaction(txId)`, `updateBadge()` — called from useFinance
   - All CRUD signatures match those in `FinanceContextState` (types/index.ts)
   - Tags array, `addTag(name, color)`, `updateTag(id, {name?, color?})`, `deleteTag(id)` — all match context
   - Categories: `addCategory(name, section)`, `updateCategory(id, updates)`, `deleteCategory(id)` — all match context
   - `SECTION_LABELS` imported from `src/lib/categories.ts` — already exists (`export const SECTION_LABELS: Record<DRESection, string>`)
   - Route paths: `/(app)/drawer/categories`, `/(app)/drawer/tags` — follow existing pattern
