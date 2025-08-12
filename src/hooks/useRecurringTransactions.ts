import { useState, useEffect, useCallback } from 'react';

export interface RecurringTransaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  dayOfMonth: number;
  frequency: 'until-cancelled' | 'fixed-count' | 'monthly-duration';
  remainingCount?: number;
  monthsDuration?: number;
  remainingMonths?: number;
  startDate: string;
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'recurringTransactions';

export const useRecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecurringTransactions(parsed);
        }
      } catch (error) {
        console.error('Erro ao carregar transações recorrentes:', error);
        setRecurringTransactions([]);
      }
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  const addRecurringTransaction = useCallback((
    transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>
  ): RecurringTransaction => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, transaction.dayOfMonth);
    
    const newTransaction: RecurringTransaction = {
      ...transaction,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now.toISOString(),
      startDate: nextMonth.toISOString()
    };
    
    setRecurringTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  }, []);

  const updateRecurringTransaction = useCallback((
    id: string, 
    updates: Partial<RecurringTransaction>
  ): void => {
    setRecurringTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, []);

  const deleteRecurringTransaction = useCallback((id: string, deleteGeneratedTransactions: boolean = false): { recurringDeleted: boolean; transactionsDeleted: number } => {
    let transactionsDeleted = 0;
    
    // Otimização: Deletar transações geradas de forma mais eficiente
    if (deleteGeneratedTransactions) {
      try {
        const existingTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
        const initialCount = existingTransactions.length;
        
        // Filtrar usando índices para melhor performance
        const filteredTransactions = [];
        for (let i = 0; i < existingTransactions.length; i++) {
          if (existingTransactions[i].recurringId !== id) {
            filteredTransactions.push(existingTransactions[i]);
          }
        }
        
        transactionsDeleted = initialCount - filteredTransactions.length;
        
        // Salvar apenas se houve mudanças
        if (transactionsDeleted > 0) {
          localStorage.setItem('unifiedFinancialData', JSON.stringify(filteredTransactions));
        }
      } catch (error) {
        console.error('Erro ao deletar transações geradas:', error);
      }
    }
    
    // Deletar o recorrente
    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
    
    return { recurringDeleted: true, transactionsDeleted };
  }, []);

  const cancelRecurringFromDate = useCallback((id: string, fromDate: string): { recurringCancelled: boolean; futureTransactionsRemoved: number } => {
    let futureTransactionsRemoved = 0;
    
    try {
      // Remover apenas lançamentos futuros
      const existingTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      const fromDateObj = new Date(fromDate);
      const initialCount = existingTransactions.length;
      
      const filteredTransactions = [];
      for (let i = 0; i < existingTransactions.length; i++) {
        const transaction = existingTransactions[i];
        if (transaction.recurringId === id) {
          const transactionDate = new Date(transaction.date);
          // Manter apenas transações anteriores à data de cancelamento
          if (transactionDate < fromDateObj) {
            filteredTransactions.push(transaction);
          }
        } else {
          filteredTransactions.push(transaction);
        }
      }
      
      futureTransactionsRemoved = initialCount - filteredTransactions.length;
      
      if (futureTransactionsRemoved > 0) {
        localStorage.setItem('unifiedFinancialData', JSON.stringify(filteredTransactions));
      }
      
      // Desativar o recorrente
      setRecurringTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, isActive: false } : t)
      );
      
    } catch (error) {
      console.error('Erro ao cancelar recorrente:', error);
    }
    
    return { recurringCancelled: true, futureTransactionsRemoved };
  }, []);

  const getActiveRecurringTransactions = useCallback((): RecurringTransaction[] => {
    return recurringTransactions.filter(t => t.isActive);
  }, [recurringTransactions]);

  return {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    cancelRecurringFromDate,
    getActiveRecurringTransactions
  };
};