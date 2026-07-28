# Spec: Transações, Tags, Categorias & Notificações

**Data:** 2026-07-28  
**Projeto:** Genius Finance (financemobile)  
**Referência web:** geniushub (Firestore + React Router v7)

## Escopo

5 melhorias incrementais no app mobile, ordenadas por dependência:

1. Navegação de mês no Financeiro
2. Swipe (status + excluir) / Tap (editar) — Home + Financeiro
3. Formulário de transação completo
4. Gestão de categorias e tags via Config
5. Notificações locais de vencimento

---

## 1. Navegação de mês no Financeiro

**Requisito:** A tela Financeiro (`(tabs)/finance/index.tsx`) deve ter o mesmo navegador de mês da Home.

**Implementação:**
- Extrair o row `< > MÊS` da Home para `src/components/MonthNavigator.tsx`
- Props: `selectedMonth: Date`, `onPrev: () => void`, `onNext: () => void`
- Usar na Home e no Financeiro (header da FlatList)
- `selectedMonth` já é estado global no contexto → ambas telas reagem juntas

**Arquivos:** `src/components/MonthNavigator.tsx` (novo), `app/(app)/(tabs)/index.tsx`, `app/(app)/(tabs)/finance/index.tsx`

---

## 2. Swipe / Tap — Home e Financeiro

**Requisito:** Swipe revela toggle status + excluir; tap abre edição. Mesmo comportamento nas duas telas.

**Comportamento:**
- Swipe esquerda → 2 botões:
  - Botão 1 (64px): "Pago" (verde `#22c55e`) se status=PENDING / "Pendente" (laranja `#f59e0b`) se status=PAID. Chama `toggleStatus(id)` direto.
  - Botão 2 (64px): "Excluir" (vermelho `#ef4444`). Mostra Alert de confirmação, depois `deleteTransaction(id)`.
- Tap no item → `openEdit(item)` que preenche e abre o modal de edição.

**Implementação:**
- Extrair `renderRightActions` compartilhado para `src/components/TransactionSwipeActions.tsx`
- Na Home: envolver cada item da lista de recentes em `<Swipeable>` com as mesmas ações
- No Financeiro: substituir `renderRightActions` atual pela versão compartilhada

**Arquivos:** `src/components/TransactionSwipeActions.tsx` (novo), `app/(app)/(tabs)/index.tsx`, `app/(app)/(tabs)/finance/index.tsx`

---

## 3. Formulário de transação completo

**Requisito:** Réplica do form web com todos os campos.

**Campos:**
| Campo | Tipo | Notas |
|-------|------|-------|
| Tipo | Toggle Entrada/Saída | Já existe |
| Status | Toggle Pago/Pendente | **Novo** (default: Pendente) |
| Descrição | TextInput | Renomeado de "Título" pra "Descrição" |
| Valor | TextInput com máscara BRL | Já existe |
| Data | DatePicker ou TextInput ISO | **Novo** (default: hoje) |
| Categoria | Chips horizontais por seção | Já existe |
| Tags | Multi-select chips | **Novo** (opcional Pessoal, ≥1 Business) |
| Recorrência | Radio: Único / Fixo mensal / Parcelado | **Novo** |
| Data fim | DatePicker | **Novo** (visível se Fixo + checkbox "definir fim") |
| Parcelas | NumberInput (2-48) | **Novo** (visível se Parcelado) |

**Lógica backend:** `addTransaction` já aceita `generateMultiple: 'INSTALLMENTS' | 'FIXED'` e `count`. Só expor na UI.

**Sugestão de categoria:** Ao digitar descrição, buscar transações passadas com descrição similar e sugerir a categoria mais usada (lógica do web em `TransactionModal.tsx`). Fica pra V2.

**Arquivos:** `app/(app)/(tabs)/finance/index.tsx` (modal)

---

## 4. Config → Categorias e Tags

**Requisito:** Tela de Config ganha itens "Categorias" e "Tags" que navegam pra telas dedicadas.

### 4a. Categorias
- Tela dedicada: `app/(app)/drawer/categories.tsx`
- Lista agrupada por seção DRE (Receita / Custos / Despesas)
- Cada item: nome, seção (badge), botão editar, botão deletar (se `!isDefault`)
- Modal de add/edit: nome (TextInput), seção (picker RECEITA/CUSTOS/DESPESAS)
- Delete com Alert confirm; bloqueado se `isDefault === true`
- CRUD via `addCategory`, `updateCategory`, `deleteCategory` (já existem no contexto)

### 4b. Tags
- Tela dedicada: `app/(app)/drawer/tags.tsx`
- Lista de tags como chips coloridos
- Cada item: círculo colorido + nome, botão editar, botão deletar
- Modal de add/edit: nome (TextInput), cor (grid de 10 cores predefinidas)
- Delete com Alert confirm
- CRUD via `addTag`, `updateTag`, `deleteTag` (já existem no contexto)

**Arquivos:** `app/(app)/drawer/settings.tsx`, `app/(app)/drawer/categories.tsx`, `app/(app)/drawer/tags.tsx`

---

## 5. Notificações locais

**Requisito:** Notificações de vencimento mesmo com app fechado, badge com pendências.

**Implementação:**
- Instalar `expo-notifications` + `expo-task-manager`
- Hook `useTransactionNotifications`:
  - `scheduleNotification(tx)`: agenda notificação local às 9h da `date` da transação, com título "Conta a pagar/receber" e corpo com descrição + valor
  - `cancelNotification(txId)`: cancela agendamento quando transação é paga ou deletada
  - Trigger: chamado em `addTransaction`, `updateTransaction`, `deleteTransaction`, `toggleStatus`
- Background task (`expo-task-manager`): ao receber notificação, atualiza badge com contagem de PENDING cuja data é hoje ou anterior
- Lembrete de vencidos: agendar notificação diária às 9h se existirem pendências vencidas (resumo: "X contas vencidas")
- Solicitar permissão no primeiro uso (integrar no fluxo de onboarding ou na Home)

**Payload da notificação:**
```json
{
  "title": "Genius Finance",
  "body": "Descrição — R$ 150,00 vence hoje",
  "data": { "txId": "...", "type": "due" },
  "trigger": { "date": "2026-08-15T09:00:00-03:00" }
}
```

**Arquivos:** `package.json`, `src/hooks/useNotifications.ts` (novo), `app/_layout.tsx` (registrar background task), `src/hooks/useFinance.tsx` (integrar chamadas)

---

## Fora do escopo (V2)

- Sugestão inteligente de categoria por descrição
- Push notifications via servidor (Firebase Cloud Messaging)
- Configuração de horário/quiet hours nas notificações
- Temas / dark mode
- Exportação de dados

---

## Ordem de execução

| # | Feature | Depende de |
|---|---------|-----------|
| 1 | MonthNavigator compartilhado | nada |
| 2 | Swipe/Tap Home + Financeiro | #1 |
| 3 | Formulário completo | #2 (usa mesmo modal) |
| 4 | Categorias + Tags | nada |
| 5 | Notificações | #3 (precisa do status na criação) |

## Arquivos alterados/criados

**Novos (5):**
- `src/components/MonthNavigator.tsx`
- `src/components/TransactionSwipeActions.tsx`
- `app/(app)/drawer/categories.tsx`
- `app/(app)/drawer/tags.tsx`
- `src/hooks/useNotifications.ts`

**Alterados (6):**
- `package.json` (+expo-notifications, +expo-task-manager)
- `app/_layout.tsx` (background task registration)
- `app/(app)/(tabs)/index.tsx` (MonthNavigator + Swipeable)
- `app/(app)/(tabs)/finance/index.tsx` (MonthNavigator + swipe actions + form completo)
- `app/(app)/drawer/settings.tsx` (novos itens Categorias/Tags)
- `src/hooks/useFinance.tsx` (integrar notificações nos CRUDs)
