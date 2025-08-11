import { useState, useEffect, useCallback } from 'react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { transactionService } from '../services/transactionService';

/**
 * ENHANCED UNIFIED FINANCIAL SYSTEM WITH BACKEND INTEGRATION
 * 
 * Extends the original system to sync with backend while maintaining all functionality
 */
export const useUnifiedFinancialSystemWithBackend = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load transactions from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        setIsLoading(true);
        setSyncError(null);
        
        const backendTransactions = await transactionService.getTransactions();
        
        // Convert backend format to internal format
        const convertedTransactions: TransactionEntry[] = backendTransactions.map(bt => ({
          id: bt.id,
          date: bt.date,
          description: bt.description,
          amount: bt.amount,
          type: bt.type === 'ENTRADA' ? 'entrada' : 'saida',
          category: bt.category,
          isRecurring: false,
          source: 'manual' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        setTransactions(convertedTransactions);
        
        // Also save to localStorage for offline access
        localStorage.setItem('unifiedFinancialData', JSON.stringify(convertedTransactions));
        
        console.log('✅ BACKEND: Loaded transactions:', convertedTransactions.length);
      } catch (error) {
        console.error('❌ BACKEND: Error loading transactions:', error);
        setSyncError('Erro ao carregar transações do servidor');
        
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('unifiedFinancialData');
          if (saved && saved.trim() !== '') {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
              console.log('💾 FALLBACK: Loaded from localStorage:', parsed.length);
            }
          }
        } catch (localError) {
          console.error('❌ FALLBACK: Error loading from localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFromBackend();
  }, []);

  // Save transactions to localStorage (for offline access)
  useEffect(() => {
    try {
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }, [transactions]);

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add transaction with backend sync
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
    const tempId = generateId();
    const now = new Date().toISOString();
    
    // Create transaction object
    const newTransaction: TransactionEntry = {
      id: tempId,
      date,
      description,
      amount,
      type,
      category,
      isRecurring,
      recurringId,
      source,
      createdAt: now,
      updatedAt: now
    };

    // Add to local state immediately (optimistic update)
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      console.log('✅ LOCAL: Added transaction:', description, formatCurrency(amount));
      return updated;
    });

    // Sync with backend asynchronously
    const token = localStorage.getItem('accessToken');
    if (token && (type === 'entrada' || type === 'saida')) {
      transactionService.createTransaction({
        date,
        description,
        amount,
        type: type.toUpperCase() as 'ENTRADA' | 'SAIDA',
        category: category || 'Geral'
      }).then(backendTransaction => {
        // Update local transaction with backend ID
        setTransactions(prev => prev.map(t => 
          t.id === tempId 
            ? { ...t, id: backendTransaction.id }
            : t
        ));
        console.log('✅ BACKEND: Synced transaction:', description);
      }).catch(error => {
        console.error('❌ BACKEND: Error syncing transaction:', error);
        setSyncError('Erro ao sincronizar com servidor');
      });
    }

    return tempId;
  }, [generateId]);

  // Update transaction
  const updateTransaction = useCallback((
    id: string,
    updates: Partial<Omit<TransactionEntry, 'id' | 'createdAt'>>
  ): boolean => {
    let updated = false;
    
    setTransactions(prev => {
      const newTransactions = prev.map(transaction => {
        if (transaction.id === id) {
          updated = true;
          return {
            ...transaction,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return transaction;
      });
      
      if (updated) {
        console.log('✅ Updated transaction:', id);
      }
      
      return newTransactions;
    });

    return updated;
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback((id: string): boolean => {
    console.log('🗑️ DELETING transaction:', id);
    
    let deleted = false;
    let deletedTransaction: TransactionEntry | null = null;
    
    setTransactions(prev => {
      const transactionToDelete = prev.find(t => t.id === id);
      if (!transactionToDelete) {
        console.warn('⚠️ Transaction not found:', id);
        return prev;
      }
      
      deletedTransaction = transactionToDelete;
      const filtered = prev.filter(t => t.id !== id);
      deleted = true;
      
      console.log('✅ DELETED transaction:', transactionToDelete.description, formatCurrency(transactionToDelete.amount));
      
      return filtered;
    });

    // TODO: Add backend delete sync here when needed

    return deleted;
  }, []);

  // Get transactions by date
  const getTransactionsByDate = useCallback((date: string): TransactionEntry[] => {
    return transactions.filter(t => t.date === date);
  }, [transactions]);

  // Get transaction by ID
  const getTransactionById = useCallback((id: string): TransactionEntry | undefined => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  // Calculate monthly totals
  const getMonthlyTotals = useCallback((year: number, month: number) => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });

    const totalEntradas = monthTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaidas = monthTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDiario = monthTransactions
      .filter(t => t.type === 'diario')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal: totalEntradas - totalSaidas + totalDiario,
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
      total: monthTransactions.length
    };
  }, [transactions]);

  // Calculate yearly totals
  const getYearlyTotals = useCallback((year: number) => {
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year;
    });

    const totalEntradas = yearTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaidas = yearTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDiario = yearTransactions
      .filter(t => t.type === 'diario')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal: totalEntradas - totalSaidas + totalDiario,
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
      total: yearTransactions.length
    };
  }, [transactions]);

  // Get days in month
  const getDaysInMonth = useCallback((year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  // Initialize month (compatibility with original system)
  const initializeMonth = useCallback((year: number, month: number) => {
    console.log('📅 Initializing month:', year, month);
    // This is mainly for compatibility - the new system doesn't need day-by-day initialization
  }, []);

  // Update day data (compatibility)
  const updateDayData = useCallback((date: string, field: string, value: number) => {
    console.log('📝 Update day data:', date, field, value);
    // This would be handled by individual transactions now
  }, []);

  // Add to day (compatibility)
  const addToDay = useCallback((date: string, field: string, value: number, description?: string) => {
    if (description) {
      addTransaction(date, description, value, field as 'entrada' | 'saida');
    }
  }, [addTransaction]);

  // Recalculate balances (compatibility)
  const recalculateBalances = useCallback(() => {
    console.log('🔄 Recalculating balances...');
    // Balances are calculated on-demand now
  }, []);

  // Delete recurring instance (compatibility)
  const deleteRecurringInstance = useCallback((id: string) => {
    return deleteTransaction(id);
  }, [deleteTransaction]);

  // Mock data structure for compatibility
  const data = {
    [selectedYear]: {
      [selectedMonth]: {}
    }
  };

  return {
    // State
    data,
    transactions,
    selectedYear,
    selectedMonth,
    isLoading,
    syncError,
    
    // Actions
    setSelectedYear,
    setSelectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    
    // Queries
    getTransactionsByDate,
    getTransactionById,
    getMonthlyTotals,
    getYearlyTotals,
    getDaysInMonth,
    
    // Compatibility methods
    initializeMonth,
    updateDayData,
    addToDay,
    recalculateBalances,
    
    // Utilities
    formatCurrency,
    parseCurrency
  };
};