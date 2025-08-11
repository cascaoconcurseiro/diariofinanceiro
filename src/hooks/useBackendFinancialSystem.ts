import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services/transactionService';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  category: string;
}

export const useBackendFinancialSystem = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transactions from backend
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transações');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add transaction
  const addTransaction = useCallback(async (
    date: string,
    description: string,
    amount: number,
    type: 'entrada' | 'saida',
    category: string = 'Geral'
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const transactionData = {
        date,
        description,
        amount,
        type: type.toUpperCase() as 'ENTRADA' | 'SAIDA',
        category
      };

      const newTransaction = await transactionService.createTransaction(transactionData);
      setTransactions(prev => [...prev, newTransaction]);
      
      return newTransaction.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar transação');
      console.error('Error adding transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate balance
  const getBalance = useCallback(() => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'ENTRADA' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);
  }, [transactions]);

  // Get transactions by month
  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === year && 
             transactionDate.getMonth() === month;
    });
  }, [transactions]);

  // Load transactions on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadTransactions();
    }
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    loadTransactions,
    getBalance,
    getTransactionsByMonth
  };
};