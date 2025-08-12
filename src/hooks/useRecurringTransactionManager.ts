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
    cancelRecurringFromDate,
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

  // ✅ EXCLUSÃO COMPLETA (recorrente + todas as instâncias) - OTIMIZADA
  const deleteRecurringComplete = useCallback((recurringId: string, deleteAll: boolean = true): { recurringDeleted: boolean; transactionsDeleted: number } => {
    return deleteRecurringConfig(recurringId, deleteAll);
  }, [deleteRecurringConfig]);

  // ✅ CANCELAR RECORRENTE (mantém lançamentos anteriores)
  const cancelRecurringTransaction = useCallback((recurringId: string): { recurringCancelled: boolean; futureTransactionsRemoved: number } => {
    const today = new Date().toISOString();
    return cancelRecurringFromDate(recurringId, today);
  }, [cancelRecurringFromDate]);

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
    
    // Funções de exclusão (OTIMIZADAS)
    deleteRecurringInstance,      // Remove só um mês
    deleteRecurringComplete,      // Remove tudo
    cancelRecurringTransaction,   // Cancela mantendo histórico
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