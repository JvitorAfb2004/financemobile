import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  WithFieldValue,
  PartialWithFieldValue,
  DocumentData,
} from 'firebase/firestore';
import type {
  Transaction, Category, Budget, SpendingLimit, SalesTarget,
  Tag, FinancialGoal, Lead, LeadOption, ServiceType, Project,
  Task, Account, AccountMember, AccountInvite, ProjectKanbanSettings, MonthlyClosing,
} from '../types';

function timestampToISO(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function createConverter<T>(
  fromFirestore: (data: DocumentData, id: string) => T,
  toFirestore: (model: WithFieldValue<T> | PartialWithFieldValue<T>) => DocumentData
): FirestoreDataConverter<T> {
  return {
    toFirestore(model) { return toFirestore(model); },
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>) {
      return fromFirestore(snapshot.data(), snapshot.id);
    },
  };
}

export const transactionConverter = createConverter<Transaction>(
  (data, id) => ({
    id, userId: data.userId, context: data.context, type: data.type,
    title: data.title, amount: data.amount, date: data.date, status: data.status,
    isFixed: data.isFixed, groupId: data.groupId, installmentInfo: data.installmentInfo,
    categoryId: data.categoryId, endDate: data.endDate, tagIds: data.tagIds || [],
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, context: model.context, type: model.type,
    title: model.title, amount: model.amount, date: model.date, status: model.status,
    isFixed: model.isFixed, groupId: model.groupId, installmentInfo: model.installmentInfo,
    categoryId: model.categoryId, endDate: model.endDate, tagIds: model.tagIds,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const categoryConverter = createConverter<Category>(
  (data, id) => ({ id, userId: data.userId, name: data.name, section: data.section, order: data.order, isDefault: data.isDefault }),
  (model) => ({ userId: model.userId, name: model.name, section: model.section, order: model.order, isDefault: model.isDefault })
);

export const budgetConverter = createConverter<Budget>(
  (data, id) => ({
    id, userId: data.userId, context: data.context, year: data.year, month: data.month,
    categoryId: data.categoryId, plannedAmount: data.plannedAmount,
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, context: model.context, year: model.year, month: model.month,
    categoryId: model.categoryId, plannedAmount: model.plannedAmount,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const spendingLimitConverter = createConverter<SpendingLimit>(
  (data, id) => ({
    id, userId: data.userId, context: data.context, name: data.name, limitAmount: data.limitAmount,
    categoryIds: data.categoryIds || [], month: data.month, year: data.year,
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, context: model.context, name: model.name, limitAmount: model.limitAmount,
    categoryIds: model.categoryIds, month: model.month, year: model.year,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const monthlyClosingConverter = createConverter<MonthlyClosing>(
  (data, id) => ({
    id, userId: data.userId, context: data.context, year: data.year, month: data.month,
    status: data.status, totalIncome: data.totalIncome, totalExpense: data.totalExpense,
    totalCreditCard: data.totalCreditCard, balance: data.balance, openingBalance: data.openingBalance,
    closingBalance: data.closingBalance, notes: data.notes || '', closedBy: data.closedBy,
    closedAt: data.closedAt, reopenedBy: data.reopenedBy, reopenedAt: data.reopenedAt,
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, context: model.context, year: model.year, month: model.month,
    status: model.status, totalIncome: model.totalIncome, totalExpense: model.totalExpense,
    totalCreditCard: model.totalCreditCard, balance: model.balance, openingBalance: model.openingBalance,
    closingBalance: model.closingBalance, notes: model.notes, closedBy: model.closedBy,
    closedAt: model.closedAt, reopenedBy: model.reopenedBy, reopenedAt: model.reopenedAt,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const salesTargetConverter = createConverter<SalesTarget>(
  (data, id) => ({
    id, userId: data.userId, context: data.context, year: data.year, month: data.month,
    channel: data.channel, seller: data.seller, targetAmount: data.targetAmount,
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, context: model.context, year: model.year, month: model.month,
    channel: model.channel, seller: model.seller, targetAmount: model.targetAmount,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const tagConverter = createConverter<Tag>(
  (data, id) => ({ id, userId: data.userId, name: data.name, color: data.color }),
  (model) => ({ userId: model.userId, name: model.name, color: model.color })
);

export const goalConverter = createConverter<FinancialGoal>(
  (data, id) => ({
    id, userId: data.userId, name: data.name, targetAmount: data.targetAmount,
    currentAmount: data.currentAmount, deadline: data.deadline, category: data.category,
    color: data.color, createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, name: model.name, targetAmount: model.targetAmount,
    currentAmount: model.currentAmount, deadline: model.deadline, category: model.category,
    color: model.color, createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export const projectKanbanSettingsConverter = createConverter<ProjectKanbanSettings>(
  (data, id) => ({
    id, userId: data.userId, columns: data.columns || [],
    createdAt: timestampToISO(data.createdAt), updatedAt: timestampToISO(data.updatedAt),
  }),
  (model) => ({
    userId: model.userId, columns: model.columns,
    createdAt: model.createdAt, updatedAt: model.updatedAt,
  })
);

export type FinanceCollectionName =
  | 'transactions' | 'categories' | 'budgets' | 'sales-targets' | 'tags'
  | 'goals' | 'leads' | 'lead-options' | 'service-types' | 'projects'
  | 'project-kanban-settings' | 'spending-limits' | 'monthly-closings';

export const converters: Record<FinanceCollectionName, FirestoreDataConverter<unknown>> = {
  transactions: transactionConverter,
  categories: categoryConverter,
  budgets: budgetConverter,
  'spending-limits': spendingLimitConverter,
  'sales-targets': salesTargetConverter,
  tags: tagConverter,
  goals: goalConverter,
  leads: transactionConverter as any,
  'lead-options': transactionConverter as any,
  'service-types': transactionConverter as any,
  projects: transactionConverter as any,
  'project-kanban-settings': projectKanbanSettingsConverter,
  'monthly-closings': monthlyClosingConverter,
};
