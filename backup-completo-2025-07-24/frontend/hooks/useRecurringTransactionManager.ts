/**
 * HOOK PARA GERENCIAMENTO CORRETO DE LANÇAMENTOS RECORRENTES
 * 
 * Combina useRecurringTransactions com useUnifiedFinancialSystem
 * para garantir exclusão correta (mesma lógica do QuickEntry)
 */

import { useCallback } from 'react';
import { useRecurringTransactions, RecurringTransaction } from './useRecurringTransactions';
import { useUnifiedFinancialSystem } from './useUnifiedFinancialSystem';

export const useRecurringTransactionManager = () => {
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction: deleteRecurringOnly,
    getActiveRecurringTransactions,
    getNextExecutionDate
  } = useRecurringTransactions();

  const {
    deleteAllRecurringTransactions
  } = useUnifiedFinancialSystem();

  // CORREÇÃO: Exclusão correta que remove tanto o recorrente quanto os lançamentos gerados
  const deleteRecurringTransaction = useCallback((
    id: string, 
    deleteGeneratedTransactions: boolean = true
  ): { recurringDeleted: boolean; transactionsDeleted: number } => {
    
    console.log(`🗑️ MANAGER: Deleting recurring transaction ${id}, deleteGenerated: ${deleteGeneratedTransactions}`);
    
    let transactionsDeleted = 0;
    
    // 1. Se solicitado, remover todos os lançamentos gerados por este recorrente
    if (deleteGeneratedTransactions) {
      transactionsDeleted = deleteAllRecurringTransactions(id);
      console.log(`🧹 MANAGER: Deleted ${transactionsDeleted} generated transactions`);
    }
    
    // 2. Remover o lançamento recorrente em si
    deleteRecurringOnly(id, false); // false para não tentar deletar novamente
    console.log(`✅ MANAGER: Recurring transaction ${id} deleted successfully`);
    
    return {
      recurringDeleted: true,
      transactionsDeleted
    };
  }, [deleteRecurringOnly, deleteAllRecurringTransactions]);

  // CORREÇÃO: Função para pausar um recorrente (desativar sem deletar lançamentos)
  const pauseRecurringTransaction = useCallback((id: string): void => {
    console.log(`⏸️ MANAGER: Pausing recurring transaction ${id}`);
    updateRecurringTransaction(id, { isActive: false });
  }, [updateRecurringTransaction]);

  // CORREÇÃO: Função para reativar um recorrente
  const resumeRecurringTransaction = useCallback((id: string): void => {
    console.log(`▶️ MANAGER: Resuming recurring transaction ${id}`);
    updateRecurringTransaction(id, { isActive: true });
  }, [updateRecurringTransaction]);

  // Função para obter estatísticas de um lançamento recorrente
  const getRecurringTransactionStats = useCallback((id: string) => {
    // Esta função pode ser expandida para mostrar quantos lançamentos foram gerados
    const transaction = recurringTransactions.find(t => t.id === id);
    if (!transaction) return null;

    return {
      transaction,
      nextExecution: getNextExecutionDate(transaction),
      isActive: transaction.isActive
    };
  }, [recurringTransactions, getNextExecutionDate]);

  return {
    // Estado
    recurringTransactions,
    
    // Funções CRUD
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction, // CORRIGIDA
    
    // Funções de controle
    pauseRecurringTransaction,
    resumeRecurringTransaction,
    
    // Funções de consulta
    getActiveRecurringTransactions,
    getNextExecutionDate,
    getRecurringTransactionStats
  };
};