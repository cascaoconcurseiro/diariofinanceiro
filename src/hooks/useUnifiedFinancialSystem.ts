import { useState, useEffect, useCallback, useMemo } from 'react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { syncService } from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput, sanitizeAmount } from '../utils/security';
import { backupSystem } from '../utils/backup';

export const useUnifiedFinancialSystem = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  }, []);

  // Inicializar sistema e carregar dados do usuário
  useEffect(() => {
    const initSystem = async () => {
      try {
        if (user && token) {
          setIsSyncing(true);
          
          // Inicializar serviços
          await syncService.init();
          syncService.setUserId(user.id);
          
          // Carregar transações do usuário
          const userTransactions = await syncService.loadUserTransactions();
          setTransactions(userTransactions);
          
          // Escutar mudanças em tempo real
          syncService.onDataChange((updatedTransactions) => {
            console.log('🔄 Real-time update received');
            setTransactions(updatedTransactions);
          });
          
          setIsSyncing(false);
        } else {
          // Usuário não logado - usar localStorage
          const saved = localStorage.getItem('unifiedFinancialData');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
            }
          }
        }
      } catch (error) {
        console.error('System init error:', error);
        setIsSyncing(false);
        
        // Fallback para localStorage
        const saved = localStorage.getItem('unifiedFinancialData');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            setTransactions([]);
          }
        }
      }
    };

    initSystem();

    // Cleanup
    return () => {
      syncService.stop();
    };
  }, [user, token]);

  // Backup automático
  useEffect(() => {
    if (transactions.length > 0 && transactions.length % 10 === 0) {
      backupSystem.createBackup(transactions);
    }
  }, [transactions]);

  const generateId = useCallback((): string => {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

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
    
    // Verificar duplicatas para recorrentes com chave única
    if (isRecurring && recurringId) {
      const duplicateKey = `${recurringId}_${date}_${type}_${amount}`;
      const existing = transactions.find(t => 
        t.recurringId === recurringId && 
        t.date === date && 
        t.type === type &&
        Math.abs(t.amount - amount) < 0.01
      );
      
      if (existing) {
        return existing.id;
      }
      
      // Verificar se já foi processado nesta sessão
      const sessionKey = `recurring_${duplicateKey}`;
      if (sessionStorage.getItem(sessionKey)) {
        return '';
      }
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    // Verificar data futura para recorrentes
    if (isRecurring) {
      const targetDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate < today) {
        console.log(`⏭️ Skipping past recurring date: ${sanitizeInput(date)}`);
        return '';
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

    // Atualizar estado local imediatamente
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      
      // Sincronizar com banco se logado
      if (user && token) {
        syncService.addTransaction(newTransaction);
      } else {
        // Salvar localmente se não logado
        localStorage.setItem('unifiedFinancialData', JSON.stringify(updated));
      }
      
      return updated;
    });
    
    console.log('✅ Transaction added:', newTransaction.description);
    return id;
  }, [transactions, generateId, user, token]);

  const deleteTransaction = useCallback((id: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== id);
      deleted = filtered.length !== prev.length;
      
      if (deleted) {
        console.log('✅ Transaction deleted from state:', id);
        
        if (user && token) {
          syncService.deleteTransaction(id).catch(error => {
            console.error('Sync delete error:', error);
          });
        } else {
          localStorage.setItem('unifiedFinancialData', JSON.stringify(filtered));
        }
      }
      
      return filtered;
    });

    console.log('Delete result:', deleted ? 'SUCCESS' : 'NOT_FOUND');
    return deleted;
  }, [user, token]);

  const deleteRecurringInstance = useCallback((transactionId: string): boolean => {
    return deleteTransaction(transactionId);
  }, [deleteTransaction]);
  
  const deleteAllRecurringTransactions = useCallback((recurringId: string): number => {
    let deletedCount = 0;
    
    setTransactions(prev => {
      const toDelete = prev.filter(t => t.recurringId === recurringId);
      deletedCount = toDelete.length;
      const filtered = prev.filter(t => t.recurringId !== recurringId);
      
      if (deletedCount > 0) {
        if (user && token) {
          syncService.syncAllTransactions(filtered);
        } else {
          localStorage.setItem('unifiedFinancialData', JSON.stringify(filtered));
        }
      }
      
      return filtered;
    });
    
    return deletedCount;
  }, [user, token]);

  const updateDayData = useCallback((
    year: number, 
    month: number, 
    day: number, 
    field: 'entrada' | 'saida' | 'diario', 
    value: string
  ): void => {
    const amount = parseCurrency(value);
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Remover transações existentes para este dia/campo
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

  const monthlyTotalsCache = useMemo(() => {
    const cache = new Map<string, any>();
    return cache;
  }, [transactions]);

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

  const data = useMemo(() => {
    const result: any = {};
    
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
    transactions,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    data,
    addTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    deleteAllRecurringTransactions,
    updateDayData,
    getTransactionsByDate,
    getMonthlyTotals,
    formatCurrency,
    isSyncing,
    syncWithServer: async () => {
      if (user && token) {
        setIsSyncing(true);
        const success = await syncService.syncAllTransactions(transactions);
        setIsSyncing(false);
        return success;
      }
      return false;
    }
  };
};