import { useState, useEffect, useCallback, useMemo } from 'react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

/**
 * SENIOR SOLUTION: UNIFIED FINANCIAL SYSTEM
 * 
 * Clean, simple, and functional implementation.
 * No over-engineering, just what works.
 */
export const useUnifiedFinancialSystem = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Load transactions with sync service
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Tentar carregar com sync service
        const { syncService } = await import('../services/syncService');
        const data = await syncService.loadData('unifiedFinancialData');
        
        if (data && Array.isArray(data)) {
          console.log('💾 UNIFIED: Loading transactions with sync:', data.length);
          setTransactions(data);
          return;
        }
      } catch (error) {
        console.warn('⚠️ UNIFIED: Sync service failed, using localStorage');
      }

      // Fallback para localStorage tradicional
      try {
        const saved = localStorage.getItem('unifiedFinancialData');
        if (saved && saved.trim() !== '') {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            console.log('💾 UNIFIED: Loading transactions from localStorage:', parsed.length);
            setTransactions(parsed);
          }
        }
      } catch (error) {
        console.error('❌ UNIFIED: Error loading data:', error);
        localStorage.removeItem('unifiedFinancialData');
        setTransactions([]);
      }
    };

    loadTransactions();
  }, []);

  // Save transactions with sync service
  useEffect(() => {
    try {
      // Importar dinamicamente para evitar problemas de build
      import('../services/syncService').then(({ syncService }) => {
        syncService.saveLocal('unifiedFinancialData', transactions);
        console.log('💾 UNIFIED: Saved transactions with sync:', transactions.length);
      });
    } catch (error) {
      // Fallback para localStorage tradicional
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
      console.log('💾 UNIFIED: Saved transactions locally:', transactions.length);
    }
  }, [transactions]);

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Add transaction - SINGLE SOURCE OF TRUTH
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
    
    // SENIOR APPROACH: Prevent duplicates for recurring transactions
    if (isRecurring && recurringId) {
      const existingRecurring = transactions.find(t => 
        t.recurringId === recurringId && 
        t.date === date && 
        t.type === type &&
        Math.abs(t.amount - amount) < 0.01 // Float comparison
      );
      
      if (existingRecurring) {
        console.log(`⚠️ RECURRING: Duplicate prevented for ${date}`);
        return existingRecurring.id;
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    const newTransaction: TransactionEntry = {
      id,
      date,
      description,
      amount,
      type,
      category: category || 'Geral',
      isRecurring,
      recurringId,
      source,
      createdAt: now,
      updatedAt: now
    };

    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      console.log(`✅ UNIFIED: Added transaction ${type} R$ ${amount} on ${date}`);
      return updated;
    });

    return id;
  }, [transactions, generateId]);

  // Delete transaction - CLEAN AND SIMPLE
  const deleteTransaction = useCallback((id: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const transactionToDelete = prev.find(t => t.id === id);
      if (!transactionToDelete) {
        console.warn(`⚠️ UNIFIED: Transaction ${id} not found for deletion`);
        return prev;
      }
      
      const filtered = prev.filter(t => t.id !== id);
      deleted = true;
      
      console.log(`🗑️ UNIFIED: Deleted transaction ${transactionToDelete.type} R$ ${transactionToDelete.amount}`);
      return filtered;
    });

    return deleted;
  }, []);

  // Delete recurring instance - USES SAME LOGIC AS NORMAL DELETE
  const deleteRecurringInstance = useCallback((recurringId: string, date: string): boolean => {
    const transactionToDelete = transactions.find(t => 
      (t.recurringId === recurringId || t.id === recurringId) && t.date === date
    );
    
    if (!transactionToDelete) {
      console.warn(`⚠️ UNIFIED: Recurring instance not found for ${recurringId} on ${date}`);
      return false;
    }
    
    // Use the same delete logic - SENIOR APPROACH: DRY principle
    return deleteTransaction(transactionToDelete.id);
  }, [transactions, deleteTransaction]);

  // CORREÇÃO: Delete all transactions generated by a recurring transaction
  const deleteAllRecurringTransactions = useCallback((recurringId: string): number => {
    let deletedCount = 0;
    
    setTransactions(prev => {
      const transactionsToDelete = prev.filter(t => t.recurringId === recurringId);
      deletedCount = transactionsToDelete.length;
      
      if (deletedCount > 0) {
        console.log(`🧹 UNIFIED: Deleting ${deletedCount} transactions generated by recurring ${recurringId}`);
        transactionsToDelete.forEach(t => {
          console.log(`  🗑️ Deleting: ${t.date} - ${t.description} - ${t.amount}`);
        });
        
        return prev.filter(t => t.recurringId !== recurringId);
      }
      
      return prev;
    });
    
    return deletedCount;
  }, []);

  // Update day data - CLEAN IMPLEMENTATION
  const updateDayData = useCallback((
    year: number, 
    month: number, 
    day: number, 
    field: 'entrada' | 'saida' | 'diario', 
    value: string
  ): void => {
    const amount = parseCurrency(value);
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Remove existing manual transactions for this day/field
    const existingTransactions = transactions.filter(t => 
      t.date === date && t.type === field && t.source === 'manual'
    );
    
    existingTransactions.forEach(transaction => {
      deleteTransaction(transaction.id);
    });
    
    // Add new transaction if amount > 0
    if (amount > 0) {
      addTransaction(
        date, 
        `${field.charAt(0).toUpperCase() + field.slice(1)} manual - ${formatCurrency(amount)}`, 
        amount, 
        field, 
        undefined, 
        false, 
        undefined, 
        'manual'
      );
    }
  }, [transactions, addTransaction, deleteTransaction]);

  // Get transactions by date
  const getTransactionsByDate = useCallback((date: string): TransactionEntry[] => {
    return transactions.filter(t => t.date === date);
  }, [transactions]);

  // Get transaction by ID
  const getTransactionById = useCallback((id: string): TransactionEntry | undefined => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  // Calculate monthly totals - OPTIMIZED WITH USEMEMO
  const getMonthlyTotals = useCallback((year: number, month: number) => {
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

    // Calculate balance from ALL transactions up to this month
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

    return { totalEntradas, totalSaidas, totalDiario, saldoFinal };
  }, [transactions]);

  // Calculate yearly totals
  const getYearlyTotals = useCallback((year: number) => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let saldoFinal = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthlyTotals = getMonthlyTotals(year, month);
      totalEntradas += monthlyTotals.totalEntradas;
      totalSaidas += monthlyTotals.totalSaidas;
      totalDiario += monthlyTotals.totalDiario;
      
      if (monthlyTotals.saldoFinal !== 0) {
        saldoFinal = monthlyTotals.saldoFinal;
      }
    }
    
    return { totalEntradas, totalSaidas, totalDiario, saldoFinal };
  }, [getMonthlyTotals]);

  // Build financial data structure for display - MEMOIZED FOR PERFORMANCE
  const data = useMemo(() => {
    const result: any = {};
    
    // Get all years that have transactions
    const yearsWithTransactions = [...new Set(
      transactions.map(t => parseInt(t.date.split('-')[0]))
    )].sort((a, b) => a - b);
    
    // Always include current year and selected year
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
          
          // Calculate running balance up to this day
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

  // Initialize month - SIMPLE IMPLEMENTATION
  const initializeMonth = useCallback((year: number, month: number) => {
    // Month is automatically initialized when data is accessed
    console.log(`📅 UNIFIED: Month ${year}-${month + 1} initialized`);
  }, []);

  // Get days in month
  const getDaysInMonth = useCallback((year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  // Dummy recalculate function - NOT NEEDED IN CLEAN IMPLEMENTATION
  const recalculateBalances = useCallback(() => {
    console.log('🧮 UNIFIED: Balance recalculation triggered (automatic via transactions)');
  }, []);

  return {
    // State
    transactions,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    data,
    
    // Core functions
    addTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    deleteAllRecurringTransactions,
    updateDayData,
    
    // Query functions
    getTransactionsByDate,
    getTransactionById,
    getMonthlyTotals,
    getYearlyTotals,
    
    // Utility functions
    initializeMonth,
    getDaysInMonth,
    formatCurrency,
    recalculateBalances
  };
};