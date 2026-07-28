import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
import { addMonths, format, parseISO } from 'date-fns';
import { ContextType, FinanceContextState, Transaction, Category, Budget, SpendingLimit, DRESection, SalesTarget, Tag, FinancialGoal, Lead, LeadOption, ServiceType, Project, ProjectKanbanSettings, Task, ActiveScope, Account, AccountMember, AccountInvite, AccountRole, MonthlyClosing } from '../types';
import { auth, db, signInWithGoogle as fbSignInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut } from '../services/firebase';
import { handleFirestoreError } from '../lib/handleFirestoreError';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { resolveDataPath } from '../lib/pathAdapter';
import type { FinanceCollectionName } from '../lib/pathAdapter';
import { ensureUserOnboardingDocs } from '../lib/onboarding';
import { useNotifications } from './useNotifications';
import { createAccount, getUserAccounts, getAccountMembers, getAccountInvites, migrateUserToAccount, createInvite, getPendingInvites, acceptInvite as acceptInviteSvc, archiveAccount, updateAccountSettings, revokeInvite, removeMember } from '../lib/accountService';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, writeBatch, serverTimestamp, onSnapshot, query,
} from 'firebase/firestore';
import { useCollectionListener } from './useCollectionListener';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_SCOPE_KEY = 'gh_active_scope';

async function loadSavedScope(): Promise<ActiveScope | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SCOPE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === 'string') return parsed as ActiveScope;
  } catch {}
  return null;
}

function saveScope(scope: ActiveScope) {
  AsyncStorage.setItem(ACTIVE_SCOPE_KEY, JSON.stringify(scope)).catch(() => {});
}

const FinanceContext = createContext<FinanceContextState | undefined>(undefined);

// normalizeProjectKanbanSettings isn't used in RN, provide stub
function normalizeProjectKanbanSettings(overrides?: Partial<ProjectKanbanSettings>): ProjectKanbanSettings {
  const defaultColumns = [
    { status: 'BACKLOG', label: 'Backlog', color: '#94a3b8', order: 0, visible: true },
    { status: 'DOING', label: 'Fazendo', color: '#3b82f6', order: 1, visible: true },
    { status: 'DONE', label: 'Concluído', color: '#22c55e', order: 2, visible: true },
  ];
  return {
    columns: overrides?.columns || defaultColumns,
    ...overrides,
  };
}

export function FinanceProvider({ children, onReady }: { children: React.ReactNode; onReady?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectKanbanSettings, setProjectKanbanSettings] = useState<ProjectKanbanSettings>(
    normalizeProjectKanbanSettings()
  );
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({});
  const taskUnsubscribers = useRef<Record<string, () => void>>({});
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [leadOptionsLoaded, setLeadOptionsLoaded] = useState(false);

  const [activeScope, setActiveScope] = useState<ActiveScope>({ type: 'PERSONAL', userId: '' });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [accountInvites, setAccountInvites] = useState<AccountInvite[]>([]);
  const [pendingInvites, setPendingInvites] = useState<AccountInvite[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { scheduleForTransaction, cancelForTransaction, updateBadge } = useNotifications();
  const readyRef = useRef(false);

  useEffect(() => {
    if (!loading && !readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
  }, [loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setTransactions([]); setCategories([]); setBudgets([]);
        setSalesTargets([]); setTags([]); setGoals([]);
        setSpendingLimits([]); setLeads([]); setLeadOptions([]);
        setServiceTypes([]); setProjects([]);
        setProjectKanbanSettings(normalizeProjectKanbanSettings());
        setTasksMap({});
        for (const projectId in taskUnsubscribers.current) {
          taskUnsubscribers.current[projectId]?.();
        }
        taskUnsubscribers.current = {};
        setAccounts([]); setAccountMembers([]); setAccountInvites([]);
        setPendingInvites([]); setMonthlyClosings([]);
        setCategoriesLoaded(false); setLeadOptionsLoaded(false);
        setActiveScope({ type: 'PERSONAL', userId: '' });
        setLoading(false);
      } else {
        ensureUserOnboardingDocs({
          uid: u.uid, email: u.email || '', displayName: u.displayName || '',
          authProvider: u.providerData.some((provider) => provider.providerId === 'google.com') ? 'google' : 'email',
        }).catch(() => {});
        loadSavedScope().then((saved) => {
          if (saved) {
            if (saved.type === 'PERSONAL') setActiveScope({ type: 'PERSONAL', userId: u.uid });
            else setActiveScope(saved);
          } else {
            setActiveScope({ type: 'PERSONAL', userId: u.uid });
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeScope.type === 'PERSONAL' && !activeScope.userId) return;
    saveScope(activeScope);
  }, [activeScope]);

  useEffect(() => {
    if (!user) return;
    getUserAccounts(user.uid).then((result) => setAccounts(result.map((r) => r.account))).catch(() => {});
    if (user.email) {
      getPendingInvites(user.email).then(setPendingInvites).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user || activeScope.type !== 'ACCOUNT') {
      setAccountMembers([]); setAccountInvites([]); return;
    }
    getAccountMembers(activeScope.accountId).then(setAccountMembers).catch(() => {});
    getAccountInvites(activeScope.accountId).then(setAccountInvites).catch(() => {});
  }, [user, activeScope.type === 'ACCOUNT' ? (activeScope as any).accountId : null]);

  const onTxsLoaded = useCallback(() => setLoading(false), []);
  useCollectionListener(user, activeScope, 'transactions', setTransactions, onTxsLoaded);
  useCollectionListener(user, activeScope, 'categories', setCategories, () => setCategoriesLoaded(true));
  useCollectionListener(user, activeScope, 'budgets', setBudgets);
  useCollectionListener(user, activeScope, 'spending-limits', setSpendingLimits);
  useCollectionListener(user, activeScope, 'sales-targets', setSalesTargets);
  useCollectionListener(user, activeScope, 'tags', setTags);
  useCollectionListener(user, activeScope, 'goals', setGoals);
  useCollectionListener(user, activeScope, 'leads', setLeads);
  useCollectionListener(user, activeScope, 'lead-options', setLeadOptions, () => setLeadOptionsLoaded(true));
  useCollectionListener(user, activeScope, 'service-types', setServiceTypes);
  useCollectionListener(user, activeScope, 'projects', setProjects);
  useCollectionListener(user, activeScope, 'monthly-closings', setMonthlyClosings);

  useEffect(() => {
    for (const projectId in taskUnsubscribers.current) { taskUnsubscribers.current[projectId]?.(); }
    taskUnsubscribers.current = {};
    setTasksMap({});
  }, [activeScope]);

  useEffect(() => {
    if (!user) { setProjectKanbanSettings(normalizeProjectKanbanSettings()); return; }
    const colPath = resolveDataPath(activeScope, user.uid, 'project-kanban-settings');
    const docRef = doc(db, colPath, 'default');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) { setProjectKanbanSettings(normalizeProjectKanbanSettings()); return; }
      const data = snapshot.data();
      setProjectKanbanSettings(normalizeProjectKanbanSettings({
        id: snapshot.id, userId: data.userId, columns: data.columns || [],
        createdAt: data.createdAt?.toDate?.().toISOString() || undefined,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || undefined,
      }));
    }, () => setProjectKanbanSettings(normalizeProjectKanbanSettings()));
    return () => unsubscribe();
  }, [user, activeScope]);

  useEffect(() => {
    if (!user || !categoriesLoaded) return;
    if (categories.length === 0) seedDefaultCategories();
  }, [user, categoriesLoaded, categories.length]);

  // ponytail: O(n) re-schedule on every transactions change — Notification API dedup handles same txId
  useEffect(() => {
    const pending = transactions.filter(t => t.status === 'PENDING');
    pending.forEach(tx => { scheduleForTransaction(tx).catch(() => {}); });
    updateBadge().catch(() => {});
  }, [transactions]);

  // ---------- CRUD Operations ----------

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, generateMultiple?: 'INSTALLMENTS' | 'FIXED', count: number = 1) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const groupId = genId();
      const baseDate = parseISO(txData.date);
      const colPath = resolveDataPath(activeScope, user.uid, 'transactions');
      const collectionRef = collection(db, colPath);

      if (generateMultiple === 'INSTALLMENTS') {
        const installmentAmount = txData.amount / count;
        for (let i = 0; i < count; i++) {
          const docRef = doc(collectionRef);
          batch.set(docRef, {
            ...txData, amount: parseFloat(installmentAmount.toFixed(2)),
            date: format(addMonths(baseDate, i), 'yyyy-MM-dd'), groupId,
            installmentInfo: `${i + 1}/${count}`, userId: user.uid,
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          });
        }
      } else if (generateMultiple === 'FIXED') {
        const endDate = (txData as any).endDate;
        let months: number;
        if (endDate) {
          const endTime = new Date(endDate).getTime();
          months = isNaN(endTime) ? 24 : Math.min(Math.max(1, Math.ceil((endTime - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)) + 1), 120);
        } else months = 24;
        for (let i = 0; i < months; i++) {
          const docDate = addMonths(baseDate, i);
          if (endDate && docDate > new Date(endDate)) break;
          const docRef = doc(collectionRef);
          batch.set(docRef, {
            ...txData, date: format(docDate, 'yyyy-MM-dd'), groupId, isFixed: true,
            userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          });
        }
      } else {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...txData, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'transactions'), user);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>, applyToFuture?: boolean) => {
    if (!user) return;
    try {
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;
      const batch = writeBatch(db);
      const colPath = resolveDataPath(activeScope, user.uid, 'transactions');
      if (applyToFuture && tx.groupId && tx.isFixed) {
        const futureTxs = transactions.filter(t => t.groupId === tx.groupId && new Date(t.date) >= new Date(tx.date));
        for (const ft of futureTxs) {
          const docRef = doc(db, colPath, ft.id);
          const toUpdate = { ...updates }; delete toUpdate.date;
          batch.update(docRef, { ...toUpdate, updatedAt: serverTimestamp() });
        }
      } else {
        const docRef = doc(db, colPath, id);
        batch.update(docRef, { ...updates, updatedAt: serverTimestamp() });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'transactions')}/${id}`, user);
    }
  };

  const deleteTransaction = async (id: string, deleteFuture?: boolean) => {
    if (!user) return;
    try {
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;
      const batch = writeBatch(db);
      const colPath = resolveDataPath(activeScope, user.uid, 'transactions');
      if (deleteFuture && tx.groupId) {
        const futureTxs = transactions.filter(t => t.groupId === tx.groupId && new Date(t.date) >= new Date(tx.date));
        for (const ft of futureTxs) { const docRef = doc(db, colPath, ft.id); batch.delete(docRef); }
      } else {
        const docRef = doc(db, colPath, id); batch.delete(docRef);
      }
      await batch.commit();
      if (tx.groupId && deleteFuture) {
        const futureTxs = transactions.filter(t => t.groupId === tx.groupId && new Date(t.date) >= new Date(tx.date));
        for (const ft of futureTxs) { cancelForTransaction(ft.id).catch(() => {}); }
      } else {
        cancelForTransaction(id).catch(() => {});
      }
      updateBadge().catch(() => {});
    } catch (error) {
      handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'transactions')}/${id}`, user);
    }
  };

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

  const closeMonth = async (year: number, month: number, notes?: string) => {
    if (!user) return;
    const contextValue: ContextType = activeScope.type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS';
    const monthTxs = transactions.filter(
      (t) => t.type !== 'CREDIT_CARD' && t.context === contextValue &&
        new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() + 1 === month
    );
    const totalIncome = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const prevKey = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
    const prevClosing = monthlyClosings.find((c) => c.context === contextValue && c.status === 'CLOSED' && `${c.year}-${c.month}` === prevKey);
    const openingBalance = prevClosing ? prevClosing.closingBalance : 0;
    const closingBalance = openingBalance + balance;
    const existingId = `${year}-${String(month).padStart(2, '0')}`;
    const colPath = resolveDataPath(activeScope, user.uid, 'monthly-closings');
    const docRef = doc(db, colPath, existingId);
    try {
      const batch = writeBatch(db);
      batch.set(docRef, {
        userId: user.uid, context: contextValue, year, month, status: 'CLOSED',
        totalIncome, totalExpense, totalCreditCard: 0, balance, openingBalance, closingBalance,
        notes: notes || '', closedBy: user.uid, closedAt: new Date().toISOString(),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', colPath, user); }
  };

  const reopenMonth = async (year: number, month: number) => {
    if (!user) return;
    const colPath = resolveDataPath(activeScope, user.uid, 'monthly-closings');
    const id = `${year}-${String(month).padStart(2, '0')}`;
    try {
      const batch = writeBatch(db);
      const docRef = doc(db, colPath, id);
      batch.update(docRef, { status: 'OPEN', reopenedBy: user.uid, reopenedAt: new Date().toISOString(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', colPath, user); }
  };

  const upsertBudget = async (categoryId: string, plannedAmount: number) => {
    if (!user) return;
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const contextValue: ContextType = activeScope.type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS';
      const existing = budgets.find((b) => b.categoryId === categoryId && b.year === year && b.month === month && b.context === contextValue);
      const colPath = resolveDataPath(activeScope, user.uid, 'budgets');
      const batch = writeBatch(db);
      if (existing) {
        batch.update(doc(db, colPath, existing.id), { plannedAmount, updatedAt: serverTimestamp() });
      } else {
        const docRef = doc(collection(db, colPath));
        batch.set(docRef, { userId: user.uid, context: contextValue, year, month, categoryId, plannedAmount, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'budgets'), user); }
  };

  const seedDefaultCategories = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const colPath = resolveDataPath(activeScope, user.uid, 'categories');
      const collectionRef = collection(db, colPath);
      for (const cat of DEFAULT_CATEGORIES) {
        batch.set(doc(collectionRef), { userId: user.uid, name: cat.name, section: cat.section, order: cat.order, isDefault: true });
      }
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'categories'), user); }
  };

  const addCategory = async (name: string, section: DRESection) => {
    if (!user) return;
    try {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.order), 0);
      const colPath = resolveDataPath(activeScope, user.uid, 'categories');
      const batch = writeBatch(db);
      batch.set(doc(collection(db, colPath)), { userId: user.uid, name, section, order: maxOrder + 1, isDefault: false });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'categories'), user); }
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'section' | 'order'>>) => {
    if (!user) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'categories');
      const batch = writeBatch(db);
      batch.update(doc(db, colPath, id), updates);
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'categories')}/${id}`, user); }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const cat = categories.find((c) => c.id === id);
    if (!cat || cat.isDefault) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'categories');
      const batch = writeBatch(db);
      batch.delete(doc(db, colPath, id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'categories')}/${id}`, user); }
  };

  const upsertSalesTarget = async (target: Omit<SalesTarget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const existing = salesTargets.find((t) => t.context === target.context && t.year === target.year && t.month === target.month && t.channel === target.channel && t.seller === target.seller);
      const colPath = resolveDataPath(activeScope, user.uid, 'sales-targets');
      const batch = writeBatch(db);
      if (existing) {
        batch.update(doc(db, colPath, existing.id), { targetAmount: target.targetAmount, updatedAt: serverTimestamp() });
      } else {
        const docRef = doc(collection(db, colPath));
        const docData: Record<string, unknown> = { userId: user.uid, context: target.context, year: target.year, month: target.month, targetAmount: target.targetAmount, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if (target.channel) docData.channel = target.channel;
        if (target.seller) docData.seller = target.seller;
        batch.set(docRef, docData);
      }
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'sales-targets'), user); }
  };

  const deleteSalesTarget = async (id: string) => {
    if (!user) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'sales-targets');
      const batch = writeBatch(db);
      batch.delete(doc(db, colPath, id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'sales-targets')}/${id}`, user); }
  };

  const addTag = async (name: string, color: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.set(doc(collection(db, resolveDataPath(activeScope, user.uid, 'tags'))), { userId: user.uid, name, color });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'tags'), user); }
  };

  const updateTag = async (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'tags'), id), updates);
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'tags')}/${id}`, user); }
  };

  const deleteTag = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'tags'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'tags')}/${id}`, user); }
  };

  const addGoal = async (goal: Omit<FinancialGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'goals');
      const batch = writeBatch(db);
      batch.set(doc(collection(db, colPath)), { ...goal, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'goals'), user); }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'goals'), id), { ...updates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'goals')}/${id}`, user); }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'goals'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'goals')}/${id}`, user); }
  };

  const addSpendingLimit = async (data: Omit<SpendingLimit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'spending-limits');
      const batch = writeBatch(db);
      const payload: Record<string, unknown> = { userId: user.uid, context: data.context, name: data.name, limitAmount: data.limitAmount, categoryIds: data.categoryIds, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      if (data.month !== undefined) payload.month = data.month;
      if (data.year !== undefined) payload.year = data.year;
      batch.set(doc(collection(db, colPath)), payload);
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'spending-limits'), user); }
  };

  const updateSpendingLimit = async (id: string, updates: Partial<Pick<SpendingLimit, 'name' | 'limitAmount' | 'categoryIds' | 'month' | 'year'>>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'spending-limits'), id), { ...cleanUpdates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'spending-limits')}/${id}`, user); }
  };

  const deleteSpendingLimit = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'spending-limits'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'spending-limits')}/${id}`, user); }
  };

  // Lead CRUD
  const addLead = async (leadData: Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const docRef = doc(collection(db, resolveDataPath(activeScope, user.uid, 'leads')));
      batch.set(docRef, { ...leadData, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'leads'), user); }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'leads'), id), { ...updates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'leads')}/${id}`, user); }
  };

  const deleteLead = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'leads'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'leads')}/${id}`, user); }
  };

  const addLeadOption = async (field: LeadOption['field'], value: string, color?: string) => {
    if (!user) return;
    try {
      const maxOrder = leadOptions.filter(o => o.field === field).reduce((max, o) => Math.max(max, o.order), -1);
      const batch = writeBatch(db);
      const data: Record<string, unknown> = { userId: user.uid, field, value, order: maxOrder + 1, isDefault: false };
      if (color) data.color = color;
      batch.set(doc(collection(db, resolveDataPath(activeScope, user.uid, 'lead-options'))), data);
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'lead-options'), user); }
  };

  const updateLeadOption = async (id: string, updates: Partial<Pick<LeadOption, 'value' | 'color'>>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'lead-options'), id), updates);
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'lead-options')}/${id}`, user); }
  };

  const deleteLeadOption = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'lead-options'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'lead-options')}/${id}`, user); }
  };

  const seedDefaultLeadOptions = async () => {
    if (!user) return;
    const ALL_DEFAULT_LEAD_OPTIONS = [
      { field: 'status' as const, value: 'Novo', color: '#3b82f6', order: 0 },
      { field: 'status' as const, value: 'Em contato', color: '#f59e0b', order: 1 },
      { field: 'status' as const, value: 'Proposta enviada', color: '#8b5cf6', order: 2 },
      { field: 'status' as const, value: 'Negociação', color: '#ec4899', order: 3 },
      { field: 'status' as const, value: 'Fechado', color: '#22c55e', order: 4 },
      { field: 'status' as const, value: 'Perdido', color: '#ef4444', order: 5 },
      { field: 'source' as const, value: 'Instagram', order: 0 },
      { field: 'source' as const, value: 'Indicação', order: 1 },
      { field: 'source' as const, value: 'Google', order: 2 },
      { field: 'source' as const, value: 'WhatsApp', order: 3 },
    ];
    try {
      const batch = writeBatch(db);
      const colPath = resolveDataPath(activeScope, user.uid, 'lead-options');
      const collectionRef = collection(db, colPath);
      for (const opt of ALL_DEFAULT_LEAD_OPTIONS) {
        batch.set(doc(collectionRef), { userId: user.uid, field: opt.field, value: opt.value, color: opt.color || null, order: opt.order, isDefault: true });
      }
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'lead-options'), user); }
  };

  // Service Type CRUD
  const addServiceType = async (data: Omit<ServiceType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.set(doc(collection(db, resolveDataPath(activeScope, user.uid, 'service-types'))), { ...data, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'service-types'), user); }
  };

  const updateServiceType = async (id: string, updates: Partial<ServiceType>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'service-types'), id), { ...updates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'service-types')}/${id}`, user); }
  };

  const deleteServiceType = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'service-types'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'service-types')}/${id}`, user); }
  };

  // Project CRUD
  const addProject = async (data: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      batch.set(doc(collection(db, resolveDataPath(activeScope, user.uid, 'projects'))), { ...cleanData, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', resolveDataPath(activeScope, user.uid, 'projects'), user); }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      batch.update(doc(db, resolveDataPath(activeScope, user.uid, 'projects'), id), { ...cleanUpdates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'projects')}/${id}`, user); }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, resolveDataPath(activeScope, user.uid, 'projects'), id));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${resolveDataPath(activeScope, user.uid, 'projects')}/${id}`, user); }
  };

  const updateProjectKanbanSettings = async (updates: Partial<ProjectKanbanSettings>) => {
    if (!user) return;
    try {
      const colPath = resolveDataPath(activeScope, user.uid, 'project-kanban-settings');
      const normalized = normalizeProjectKanbanSettings({ ...projectKanbanSettings, ...updates });
      const batch = writeBatch(db);
      batch.set(doc(db, colPath, 'default'), { userId: user.uid, columns: normalized.columns, updatedAt: serverTimestamp() }, { merge: true });
      await batch.commit();
      setProjectKanbanSettings(normalized);
    } catch (error) { handleFirestoreError(error, 'update', `${resolveDataPath(activeScope, user.uid, 'project-kanban-settings')}/default`, user); }
  };

  const getTaskColPath = useCallback((projectId: string) => {
    if (!user) return '';
    const base = resolveDataPath(activeScope, user.uid, 'projects');
    return `${base}/${projectId}/tasks`;
  }, [user, activeScope]);

  const loadTasks = useCallback((projectId: string) => {
    if (!user) return;
    const colPath = getTaskColPath(projectId);
    if (!colPath || taskUnsubscribers.current[projectId]) return;
    const colRef = collection(db, colPath);
    const q = query(colRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id, projectId: d.projectId, title: d.title || '', done: d.done || false,
          dueDate: d.dueDate, priority: d.priority || 'MEDIUM', assignee: d.assignee,
          description: d.description, subtasks: d.subtasks || [], order: d.order ?? 0,
          createdAt: d.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: d.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
        } as Task;
      });
      tasks.sort((a, b) => a.order - b.order);
      setTasksMap(prev => ({ ...prev, [projectId]: tasks }));
    }, (err) => { handleFirestoreError(err, 'list', colPath, user); });
    taskUnsubscribers.current[projectId] = unsub;
  }, [user, activeScope, getTaskColPath]);

  const unloadTasks = useCallback((projectId: string) => {
    const unsub = taskUnsubscribers.current[projectId];
    if (unsub) { unsub(); delete taskUnsubscribers.current[projectId]; }
    setTasksMap(prev => { if (!(projectId in prev)) return prev; const next = { ...prev }; delete next[projectId]; return next; });
  }, []);

  const addTask = async (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const colPath = getTaskColPath(projectId);
    if (!colPath) return;
    try {
      const tasks = tasksMap[projectId] || [];
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
      const batch = writeBatch(db);
      batch.set(doc(collection(db, colPath)), { ...data, projectId, userId: user.uid, order: data.order ?? (maxOrder + 1), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'create', colPath, user); }
  };

  const updateTask = async (projectId: string, taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    const colPath = getTaskColPath(projectId);
    if (!colPath) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, colPath, taskId), { ...updates, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'update', `${colPath}/${taskId}`, user); }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    if (!user) return;
    const colPath = getTaskColPath(projectId);
    if (!colPath) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, colPath, taskId));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, 'delete', `${colPath}/${taskId}`, user); }
  };

  const createAccountFn = async (name: string) => {
    if (!user) return;
    const accountId = await createAccount(user, name);
    const newAccount: Account = {
      id: accountId, name, ownerId: user.uid, memberRole: 'owner', status: 'ACTIVE',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    setActiveScope({ type: 'ACCOUNT', accountId, accountName: name, role: 'owner' });
  };

  const deleteAccountFn = async (accountId: string) => {
    if (!user) return;
    const account = accounts.find((a) => a.id === accountId);
    if (!account || account.ownerId !== user.uid) return;
    await archiveAccount(accountId);
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    if (activeScope.type === 'ACCOUNT' && activeScope.accountId === accountId) {
      setActiveScope({ type: 'PERSONAL', userId: user.uid });
    }
  };

  const migrateToAccountFn = async (accountId: string) => {
    if (!user) return [];
    return migrateUserToAccount(user.uid, accountId);
  };

  const inviteMemberFn = async (email: string, role: Exclude<AccountRole, 'owner'>) => {
    if (!user || activeScope.type !== 'ACCOUNT') return;
    const accountName = activeScope.accountName;
    await createInvite(activeScope.accountId, email.trim().toLowerCase(), role, user.uid, accountName);
    const invites = await getAccountInvites(activeScope.accountId);
    setAccountInvites(invites);
  };

  const acceptInviteFn = async (inviteId: string, accountId: string) => {
    if (!user) return;
    await acceptInviteSvc(inviteId, accountId, user);
    const result = await getUserAccounts(user.uid);
    setAccounts(result.map((r) => r.account));
    if (user.email) { const invites = await getPendingInvites(user.email); setPendingInvites(invites); }
  };

  const cancelInviteFn = async (inviteId: string) => {
    if (!user || activeScope.type !== 'ACCOUNT') return;
    const invite = accountInvites.find((i) => i.id === inviteId);
    if (!invite) return;
    await revokeInvite(activeScope.accountId, inviteId, invite.email);
    setAccountInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  const updateAccountSettingsFn = async (accountId: string, settings: Partial<Account['settings']>) => {
    await updateAccountSettings(accountId, settings);
    setAccounts((prev) => prev.map((account) => (
      account.id === accountId ? { ...account, settings: { ...(account.settings || {}), ...settings } as Account['settings'] } : account
    )));
  };

  return (
      <FinanceContext.Provider value={{
        user, loading,
        signInWithGoogle: fbSignInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
      transactions, categories, budgets, salesTargets, tags, goals,
      spendingLimits, leads, leadOptions, serviceTypes, projects,
      projectKanbanSettings,
      projectKanbanColumns: projectKanbanSettings.columns,
      tasksMap, loadTasks, unloadTasks,
      accounts, accountMembers, accountInvites, monthlyClosings,
      closeMonth, reopenMonth,
      activeScope,
      activeContext: (activeScope.type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS') as ContextType,
      selectedMonth, setSelectedMonth, setActiveScope,
      createAccount: createAccountFn, deleteAccount: deleteAccountFn,
      migrateToAccount: migrateToAccountFn,
      inviteMember: inviteMemberFn, acceptInvite: acceptInviteFn,
      cancelInvite: cancelInviteFn,
      updateAccountSettings: updateAccountSettingsFn,
      pendingInvites,
      addTransaction, updateTransaction, deleteTransaction, toggleStatus,
      upsertBudget, seedDefaultCategories, addCategory, updateCategory, deleteCategory,
      upsertSalesTarget, deleteSalesTarget,
      addTag, updateTag, deleteTag,
      addGoal, updateGoal, deleteGoal,
      addSpendingLimit, updateSpendingLimit, deleteSpendingLimit,
      addLead, updateLead, deleteLead,
      addLeadOption, updateLeadOption, deleteLeadOption,
      seedDefaultLeadOptions,
      addServiceType, updateServiceType, deleteServiceType,
      addProject, updateProject, deleteProject,
      updateProjectKanbanSettings,
      addTask, updateTask, deleteTask,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
}
