import { useState, useEffect, useCallback } from 'react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

/**
 * SENIOR DEV SOLUTION: Unified Transaction Manager
 * 
 * This hook manages ALL transactions in a single source of truth,
 * eliminating sync issues between detailed transactions and financial data.
 */
export const useTransactionManager = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);

  // Load transactions from localStorage
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('unifiedTransactions');
      if (savedTransactions && savedTransactions.trim() !== '') {
        const parsed = JSON.parse(savedTransactions);
        if (Array.isArray(parsed)) {
          console.log('💾 Loading unified transactions from localStorage:', parsed.length);
          setTransactions(parsed);
        }
      }
    } catch (error) {
      console.error('❌ Error loading unified transactions:', error);
      localStorage.removeItem('unifiedTransactions');
      setTransactions([]);
    }
  }, []);

  // Save transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unifiedTransactions', JSON.stringify(transactions));
      console.log('💾 Unified transactions saved:', transactions.length);
    } catch (error) {
      console.error('❌ Error saving unified transactions:', error);
    }
  }, [transactions]);

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add transaction
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
    const id = generateId();
    const now = new Date().toISOString();
    
    const newTransaction: TransactionEntry = {
      id,
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

    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      console.log('✅ Added transaction:', newTransaction.description, formatCurrency(amount));
      return updated;
    });

    return id;
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

    if (!updated) {
      console.warn('⚠️ Transaction not found for update:', id);
    }

    return updated;
  }, []);

  // Delete transaction - SENIOR APPROACH: Simple and direct
  const deleteTransaction = useCallback((id: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const transactionToDelete = prev.find(t => t.id === id);
      if (!transactionToDelete) {
        console.warn('⚠️ Transaction not found for deletion:', id);
        return prev;
      }
      
      const filtered = prev.filter(t => t.id !== id);
      deleted = true;
      
      console.log('✅ Deleted transaction:', transactionToDelete.description, formatCurrency(transactionToDelete.amount));
      return filtered;
    });

    return deleted;
  }, []);

  // Delete recurring instance for specific day
  const deleteRecurringInstance = useCallback((recurringId: string, date: string): boolean => {
    let deleted = false;
    
    setTransactions(prev => {
      const transactionToDelete = prev.find(t => 
        (t.recurringId === recurringId || t.id === recurringId) && t.date === date
      );
      
      if (!transactionToDelete) {
        console.warn('⚠️ Recurring instance not found for deletion:', recurringId, date);
        return prev;
      }
      
      const filtered = prev.filter(t => t.id !== transactionToDelete.id);
      deleted = true;
      
      console.log('✅ Deleted recurring instance:', transactionToDelete.description, 'on', date);
      return filtered;
    });

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

  // Calculate financial data from transactions - SENIOR APPROACH: Single source of truth
  const getFinancialData = useCallback(() => {
    const data: any = {};
    
    transactions.forEach(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const monthIndex = month - 1;
      
      if (!data[year]) data[year] = {};
      if (!data[year][monthIndex]) data[year][monthIndex] = {};
      if (!data[year][monthIndex][day]) {
        data[year][monthIndex][day] = {
          entrada: 0,
          saida: 0,
          diario: 0,
          balance: 0
        };
      }
      
      data[year][monthIndex][day][transaction.type] += transaction.amount;
    });
    
    // Calculate balances
    Object.keys(data).forEach(yearStr => {
      const year = parseInt(yearStr);
      for (let month = 0; month < 12; month++) {
        if (!data[year][month]) continue;
        
        const days = Object.keys(data[year][month]).map(Number).sort((a, b) => a - b);
        let runningBalance = 0;
        
        // Get previous balance
        if (month === 0 && year > 2025) {
          // Get last balance from previous year
          const prevYear = year - 1;
          if (data[prevYear] && data[prevYear][11]) {
            const prevDays = Object.keys(data[prevYear][11]).map(Number).sort((a, b) => b - a);
            if (prevDays.length > 0) {
              runningBalance = data[prevYear][11][prevDays[0]].balance || 0;
            }
          }
        } else if (month > 0) {
          // Get last balance from previous month
          const prevMonth = month - 1;
          if (data[year][prevMonth]) {
            const prevDays = Object.keys(data[year][prevMonth]).map(Number).sort((a, b) => b - a);
            if (prevDays.length > 0) {
              runningBalance = data[year][prevMonth][prevDays[0]].balance || 0;
            }
          }
        }
        
        days.forEach(day => {
          const dayData = data[year][month][day];
          runningBalance = runningBalance + dayData.entrada - dayData.saida - dayData.diario;
          dayData.balance = runningBalance;
          
          // Format currency strings
          dayData.entrada = formatCurrency(dayData.entrada);
          dayData.saida = formatCurrency(dayData.saida);
          dayData.diario = formatCurrency(dayData.diario);
        });
      }
    });
    
    return data;
  }, [transactions]);

  // Get monthly totals
  const getMonthlyTotals = useCallback((year: number, month: number) => {
    const monthTransactions = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === year && tMonth === month + 1;
    });
    
    const totals = monthTransactions.reduce((acc, t) => {
      acc[`total${t.type.charAt(0).toUpperCase() + t.type.slice(1)}`] += t.amount;
      return acc;
    }, {
      totalEntrada: 0,
      totalSaida: 0,
      totalDiario: 0
    });
    
    // Calculate final balance
    const data = getFinancialData();
    let saldoFinal = 0;
    if (data[year] && data[year][month]) {
      const days = Object.keys(data[year][month]).map(Number).sort((a, b) => b - a);
      if (days.length > 0) {
        saldoFinal = data[year][month][days[0]].balance || 0;
      }
    }
    
    return { ...totals, saldoFinal };
  }, [transactions, getFinancialData]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    getTransactionsByDate,
    getTransactionById,
    getFinancialData,
    getMonthlyTotals
  };
};