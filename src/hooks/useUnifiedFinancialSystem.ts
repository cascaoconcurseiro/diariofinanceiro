import { useState, useEffect, useCallback, useMemo } from 'react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { syncService } from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput, sanitizeAmount } from '../utils/security';
import { backupSystem } from '../utils/backup';
import { realTimeSync } from '../utils/realTimeSync';

/**
 * SISTEMA FINANCEIRO SIMPLIFICADO
 * Apenas o essencial, sem over-engineering
 */
export const useUnifiedFinancialSystem = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // ✅ Sempre abrir no mês atual
  useEffect(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  }, []);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar dados (local + sincronização)
  useEffect(() => {
    const loadData = async () => {
      if (user && token) {
        // ✅ CONFIGURAR SINCRONIZAÇÃO REAL-TIME
        realTimeSync.setUserId(user.id);
        
        // Usuário logado: buscar do servidor
        setIsSyncing(true);
        const serverTransactions = await syncService.fetchTransactions();
        if (serverTransactions.length > 0) {
          setTransactions(serverTransactions);
          // Salvar localmente como backup
          localStorage.setItem('unifiedFinancialData', JSON.stringify(serverTransactions));
        } else {
          // Se servidor vazio, tentar carregar local e sincronizar
          const saved = localStorage.getItem('unifiedFinancialData');
          if (saved) {
            const localTransactions = JSON.parse(saved);
            if (Array.isArray(localTransactions) && localTransactions.length > 0) {
              await syncService.syncTransactions(localTransactions);
              setTransactions(localTransactions);
            }
          }
        }
        setIsSyncing(false);
      } else {
        // Usuário não logado: usar apenas local
        try {
          const saved = localStorage.getItem('unifiedFinancialData');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          setTransactions([]);
        }
      }
    };

    loadData();
  }, [user, token]);

  // ✅ ESCUTAR SINCRONIZAÇÃO REAL-TIME
  useEffect(() => {
    const handleRealTimeSync = (data: any) => {
      if (data.type === 'transaction') {
        if (data.action === 'add') {
          setTransactions(prev => {
            // Evitar duplicatas
            const exists = prev.find(t => t.id === data.data.id);
            if (exists) return prev;
            return [...prev, data.data];
          });
        } else if (data.action === 'delete') {
          setTransactions(prev => prev.filter(t => t.id !== data.data.id));
        }
      } else if (data.type === 'full_sync') {
        setTransactions(data.data);
        localStorage.setItem('unifiedFinancialData', JSON.stringify(data.data));
      }
    };

    realTimeSync.onSync(handleRealTimeSync);
  }, []);

  // Salvar dados no localStorage com backup
  useEffect(() => {
    if (transactions.length >= 0) {
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
      
      // ✅ Backup automático a cada 10 transações
      if (transactions.length > 0 && transactions.length % 10 === 0) {
        backupSystem.createBackup(transactions);
      }
    }
  }, [transactions]);

  // Gerar ID único
  const generateId = useCallback((): string => {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Adicionar transação
  const addTransaction = useCallback((
    date: string,
    description: string,
    amount: number,
    type: 'entrada' | 'saida' | 'diario',
    category?: string,
    isRecurring: boolean = false,
    recurringId?: string,
    source: 'manual' | 'recurring' | 'quick-entry' = 'manual'
  ): string => {
    
    // ✅ Prevenir duplicatas para transações recorrentes
    if (isRecurring && recurringId) {
      const existing = transactions.find(t => 
        t.recurringId === recurringId && 
        t.date === date && 
        t.type === type &&
        Math.abs(t.amount - amount) < 0.01
      );
      
      if (existing) {
        console.log(`⏭️ Duplicate prevented: ${sanitizeInput(date)} - ${sanitizeInput(description)}`);
        return existing.id;
      }
    }
    
    // ✅ Para recorrentes, verificar se é data futura
    if (isRecurring) {
      const targetDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
      
      if (targetDate < today) {
        console.log(`⏭️ Skipping past recurring date: ${sanitizeInput(date)}`);
        return ''; // Não criar transação para data passada
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    const newTransaction: TransactionEntry = {
      id,
      date: sanitizeInput(date),
      description: sanitizeInput(description),
      amount: sanitizeAmount(amount),
      type,
      category: sanitizeInput(category || 'Geral'),
      isRecurring,
      recurringId: recurringId ? sanitizeInput(recurringId) : undefined,
      source: sanitizeInput(source),
      createdAt: now,
      updatedAt: now
    };

    setTransactions(prev => [...prev, newTransaction]);
    
    // ✅ SINCRONIZAÇÃO REAL-TIME
    realTimeSync.syncTransaction('add', newTransaction);
    
    // Sincronizar com servidor se logado
    if (user && token && syncService.isOnline()) {
      syncService.createTransaction(newTransaction).catch(console.error);
    }
    
    return id;
  }, [transactions, generateId]);

  // Deletar transação
  const deleteTransaction = useCallback((id: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== id);
      deleted = filtered.length !== prev.length;
      return filtered;
    });
    
    // ✅ SINCRONIZAÇÃO REAL-TIME
    if (deleted) {
      realTimeSync.syncTransaction('delete', { id });
    }
    
    // Sincronizar com servidor se logado
    if (deleted && user && token && syncService.isOnline()) {
      syncService.deleteTransaction(id).catch(console.error);
    }

    return deleted;
  }, []);

  // Deletar apenas instância específica de recorrente
  const deleteRecurringInstance = useCallback((transactionId: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== transactionId);
      deleted = filtered.length !== prev.length;
      return filtered;
    });
    
    return deleted;
  }, []);
  
  // Deletar todas as transações de um recorrente
  const deleteAllRecurringTransactions = useCallback((recurringId: string): number => {
    let deletedCount = 0;
    
    setTransactions(prev => {
      const toDelete = prev.filter(t => t.recurringId === recurringId);
      deletedCount = toDelete.length;
      return prev.filter(t => t.recurringId !== recurringId);
    });
    
    return deletedCount;
  }, []);

  // Atualizar dados do dia
  const updateDayData = useCallback((
    year: number, 
    month: number, 
    day: number, 
    field: 'entrada' | 'saida' | 'diario', 
    value: string
  ): void => {
    const amount = parseCurrency(value);
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Remover transações manuais existentes para este dia/campo
    const existing = transactions.filter(t => 
      t.date === date && t.type === field && t.source === 'manual'
    );
    
    existing.forEach(transaction => {
      deleteTransaction(transaction.id);
    });
    
    // Adicionar nova transação se valor > 0
    if (amount > 0) {
      addTransaction(
        date, 
        `${field.charAt(0).toUpperCase() + field.slice(1)} - ${formatCurrency(amount)}`, 
        amount, 
        field, 
        undefined, 
        false, 
        undefined, 
        'manual'
      );
    }
  }, [transactions, addTransaction, deleteTransaction]);

  // ✅ Obter transações por data (otimizado)
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, TransactionEntry[]>();
    transactions.forEach(t => {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    });
    return map;
  }, [transactions]);

  const getTransactionsByDate = useCallback((date: string): TransactionEntry[] => {
    return transactionsByDate.get(date) || [];
  }, [transactionsByDate]);

  // ✅ Cache para totais mensais
  const monthlyTotalsCache = useMemo(() => {
    const cache = new Map<string, any>();
    return cache;
  }, [transactions]);

  // Calcular totais mensais (com cache)
  const getMonthlyTotals = useCallback((year: number, month: number) => {
    const cacheKey = `${year}-${month}`;
    if (monthlyTotalsCache.has(cacheKey)) {
      return monthlyTotalsCache.get(cacheKey);
    }
    const monthTransactions = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === year && tMonth === month + 1;
    });

    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;

    monthTransactions.forEach(t => {
      switch (t.type) {
        case 'entrada':
          totalEntradas += t.amount;
          break;
        case 'saida':
          totalSaidas += t.amount;
          break;
        case 'diario':
          totalDiario += t.amount;
          break;
      }
    });

    // Calcular saldo acumulado até este mês
    const allTransactionsUpToMonth = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear < year || (tYear === year && tMonth <= month + 1);
    });

    let saldoFinal = 0;
    allTransactionsUpToMonth.forEach(t => {
      switch (t.type) {
        case 'entrada': 
          saldoFinal += t.amount; 
          break;
        case 'saida': 
          saldoFinal -= t.amount; 
          break;
        case 'diario': 
          saldoFinal -= t.amount; 
          break;
      }
    });

    const result = { totalEntradas, totalSaidas, totalDiario, saldoFinal };
    monthlyTotalsCache.set(cacheKey, result);
    return result;
  }, [transactions, monthlyTotalsCache]);

  // Estrutura de dados para exibição
  const data = useMemo(() => {
    const result: any = {};
    
    // Anos com transações + ano atual + ano selecionado
    const yearsWithTransactions = [...new Set(
      transactions.map(t => parseInt(t.date.split('-')[0]))
    )];
    
    const yearsToProcess = [...new Set([
      ...yearsWithTransactions,
      new Date().getFullYear(),
      selectedYear
    ])].sort((a, b) => a - b);

    yearsToProcess.forEach(year => {
      result[year] = {};
      
      for (let month = 0; month < 12; month++) {
        result[year][month] = {};
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTransactions = getTransactionsByDate(date);
          
          let entrada = 0;
          let saida = 0;
          let diario = 0;
          
          dayTransactions.forEach(t => {
            switch (t.type) {
              case 'entrada':
                entrada += t.amount;
                break;
              case 'saida':
                saida += t.amount;
                break;
              case 'diario':
                diario += t.amount;
                break;
            }
          });
          
          // Saldo acumulado até este dia
          const allTransactionsUpToDay = transactions.filter(t => t.date <= date);
          let balance = 0;
          allTransactionsUpToDay.forEach(t => {
            switch (t.type) {
              case 'entrada': 
                balance += t.amount; 
                break;
              case 'saida': 
                balance -= t.amount; 
                break;
              case 'diario': 
                balance -= t.amount; 
                break;
            }
          });
          
          result[year][month][day] = {
            entrada: entrada === 0 ? 'R$ 0,00' : formatCurrency(entrada),
            saida: saida === 0 ? 'R$ 0,00' : formatCurrency(saida),
            diario: diario === 0 ? 'R$ 0,00' : formatCurrency(diario),
            balance: balance
          };
        }
      }
    });
    
    return result;
  }, [transactions, selectedYear, getTransactionsByDate]);

  return {
    // Estado
    transactions,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    data,
    
    // Funções principais
    addTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    deleteAllRecurringTransactions,
    updateDayData,
    
    // Funções de consulta
    getTransactionsByDate,
    getMonthlyTotals,
    
    // Utilitários
    formatCurrency,
    
    // Sincronização
    isSyncing,
    syncWithServer: async () => {
      if (user && token) {
        setIsSyncing(true);
        const success = await syncService.syncTransactions(transactions);
        setIsSyncing(false);
        return success;
      }
      return false;
    }
  };
};