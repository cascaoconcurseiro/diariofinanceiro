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

  const deleteRecurringTransaction = useCallback((id: string, deleteGeneratedTransactions: boolean = true): { recurringDeleted: boolean; transactionsDeleted: number } => {
    let transactionsDeleted = 0;
    
    // Sempre deletar transações geradas por padrão
    if (deleteGeneratedTransactions) {
      try {
        const existingTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
        const initialCount = existingTransactions.length;
        
        const filteredTransactions = existingTransactions.filter(t => t.recurringId !== id);
        transactionsDeleted = initialCount - filteredTransactions.length;
        
        localStorage.setItem('unifiedFinancialData', JSON.stringify(filteredTransactions));
        window.dispatchEvent(new Event('storage'));
        
      } catch (error) {
        console.error('Erro ao deletar transações geradas:', error);
      }
    }
    
    // Deletar o recorrente
    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
    
    // Limpar cache de processamento
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(id) || key.startsWith('processed_') || key.startsWith('recurring_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    return { recurringDeleted: true, transactionsDeleted };
  }, []);

  const cancelRecurringFromDate = useCallback((id: string, fromDate: string): { recurringCancelled: boolean; futureTransactionsRemoved: number } => {
    let futureTransactionsRemoved = 0;
    
    console.log(`⏸️ Cancelando recorrente ${id} a partir de ${fromDate}`);
    
    try {
      // Remover apenas lançamentos futuros
      const existingTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      const fromDateObj = new Date(fromDate);
      const initialCount = existingTransactions.length;
      
      // Filtrar mantendo transações passadas e removendo futuras
      const filteredTransactions = existingTransactions.filter(transaction => {
        if (transaction.recurringId === id) {
          const transactionDate = new Date(transaction.date);
          // Manter apenas transações anteriores à data de cancelamento
          return transactionDate < fromDateObj;
        }
        // Manter todas as outras transações
        return true;
      });
      
      futureTransactionsRemoved = initialCount - filteredTransactions.length;
      
      console.log(`⏸️ Removendo ${futureTransactionsRemoved} lançamentos futuros`);
      
      // Salvar sempre para garantir sincronização
      localStorage.setItem('unifiedFinancialData', JSON.stringify(filteredTransactions));
      
      // Forçar atualização da interface
      window.dispatchEvent(new Event('storage'));
      
      // Desativar o recorrente (NÃO deletar)
      setRecurringTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, isActive: false } : t)
      );
      
      console.log(`⏸️ Recorrente ${id} desativado`);
      
    } catch (error) {
      console.error('Erro ao cancelar recorrente:', error);
    }
    
    return { recurringCancelled: true, futureTransactionsRemoved };
  }, []);

  const getActiveRecurringTransactions = useCallback((): RecurringTransaction[] => {
    return recurringTransactions.filter(t => t.isActive);
  }, [recurringTransactions]);

  const processRecurringTransactions = useCallback((
    activeTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida', amount: number, source?: string) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  ) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const processedKey = `processed_${year}_${month}`;
    
    // Verificar se já processou este mês
    if (sessionStorage.getItem(processedKey)) {
      return;
    }
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, remainingMonths, id } = transaction;
      
      // Ajustar dia para meses com menos dias
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      // Só processar se for mês atual ou futuro
      const isCurrentOrFuture = year > currentYear || (year === currentYear && month >= currentMonth);
      
      if (isCurrentOrFuture) {
        console.log(`✅ Creating recurring transaction: ${type} ${amount} on day ${targetDay}`);
        addToDay(year, month, targetDay, type, amount, 'recurring');
        
        // Atualizar contadores
        if (frequency === 'fixed-count' && remainingCount !== undefined) {
          const newCount = Math.max(0, remainingCount - 1);
          const updates: Partial<RecurringTransaction> = { remainingCount: newCount };
          if (newCount <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
        } else if (frequency === 'monthly-duration' && remainingMonths !== undefined) {
          const newMonthsRemaining = Math.max(0, remainingMonths - 1);
          const updates: Partial<RecurringTransaction> = { remainingMonths: newMonthsRemaining };
          if (newMonthsRemaining <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
        }
      }
    });
    
    // Marcar como processado
    sessionStorage.setItem(processedKey, 'true');
  }, []);

  return {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    cancelRecurringFromDate,
    getActiveRecurringTransactions,
    processRecurringTransactions
  };
};