import { useCallback } from 'react';
import { useRecurringTransactions } from './useRecurringTransactions';
import { useUnifiedFinancialSystem } from './useUnifiedFinancialSystem';

// Hook principal que combina recorrentes + transações
export const useRecurringTransactionManager = () => {
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction: deleteRecurringConfig,
    getActiveRecurringTransactions
  } = useRecurringTransactions();

  const {
    transactions,
    addTransaction,
    deleteTransaction,
    getTransactionsByDate
  } = useUnifiedFinancialSystem();

  // ✅ EXCLUSÃO DE INSTÂNCIA ESPECÍFICA (só um mês)
  const deleteRecurringInstance = useCallback((transactionId: string): boolean => {
    // Encontrar a transação específica
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return false;

    // Deletar apenas esta instância
    const success = deleteTransaction(transactionId);
    
    if (success) {
      console.log(`✅ Deleted recurring instance: ${transaction.date} - ${transaction.description}`);
    }
    
    return success;
  }, [transactions, deleteTransaction]);

  // ✅ EXCLUSÃO COMPLETA (recorrente + todas as instâncias)
  const deleteRecurringComplete = useCallback((recurringId: string): { recurringDeleted: boolean; transactionsDeleted: number } => {
    // 1. Contar e deletar todas as transações geradas
    const generatedTransactions = transactions.filter(t => t.recurringId === recurringId);
    let deletedCount = 0;

    generatedTransactions.forEach(transaction => {
      if (deleteTransaction(transaction.id)) {
        deletedCount++;
        console.log(`🗑️ Deleted generated: ${transaction.date} - ${transaction.description}`);
      }
    });

    // 2. Deletar o recorrente original
    const recurringDeleted = deleteRecurringConfig(recurringId);

    console.log(`✅ Deleted recurring ${recurringId}: ${deletedCount} transactions removed`);
    
    return { recurringDeleted, transactionsDeleted: deletedCount };
  }, [transactions, deleteTransaction, deleteRecurringConfig]);

  // ✅ PAUSAR RECORRENTE (desativa sem deletar)
  const pauseRecurringTransaction = useCallback((recurringId: string): boolean => {
    updateRecurringTransaction(recurringId, { isActive: false });
    console.log(`⏸️ Paused recurring: ${recurringId}`);
    return true;
  }, [updateRecurringTransaction]);

  // ✅ REATIVAR RECORRENTE
  const resumeRecurringTransaction = useCallback((recurringId: string): boolean => {
    updateRecurringTransaction(recurringId, { isActive: true });
    console.log(`▶️ Resumed recurring: ${recurringId}`);
    return true;
  }, [updateRecurringTransaction]);

  // ✅ VERIFICAR SE TRANSAÇÃO É RECORRENTE
  const isRecurringTransaction = useCallback((transactionId: string): boolean => {
    const transaction = transactions.find(t => t.id === transactionId);
    return !!(transaction?.recurringId || transaction?.isRecurring);
  }, [transactions]);

  // ✅ OBTER RECORRENTE ORIGINAL DE UMA TRANSAÇÃO
  const getRecurringSource = useCallback((transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction?.recurringId) return null;
    
    return recurringTransactions.find(r => r.id === transaction.recurringId) || null;
  }, [transactions, recurringTransactions]);

  return {
    // Estados
    recurringTransactions,
    transactions,
    
    // Funções de recorrentes
    addRecurringTransaction,
    updateRecurringTransaction,
    getActiveRecurringTransactions,
    
    // Funções de exclusão (CORRIGIDAS)
    deleteRecurringInstance,      // Remove só um mês
    deleteRecurringComplete,      // Remove tudo
    pauseRecurringTransaction,    // Pausa sem deletar
    resumeRecurringTransaction,   // Reativa
    
    // Utilitários
    isRecurringTransaction,
    getRecurringSource,
    getTransactionsByDate,
    
    // Função original para compatibilidade
    addTransaction
  };
};