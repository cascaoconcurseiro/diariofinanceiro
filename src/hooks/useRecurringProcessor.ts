import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida', amount: number, source?: string) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  ) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    const processedKey = `processed_${year}_${month}`;
    
    // Verificar se já processou este mês
    if (sessionStorage.getItem(processedKey)) {
      return;
    }
    
    // Verificar se existem transações já criadas para este mês
    const existingTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, remainingMonths, id } = transaction;
      
      // Ajustar dia para meses com menos dias
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // Verificar se já existe transação para esta data e recorrente
      const alreadyExists = existingTransactions.some(t => 
        t.recurringId === id && 
        t.date === targetDate &&
        t.type === type &&
        Math.abs(t.amount - amount) < 0.01
      );
      
      if (alreadyExists) {
        return; // Pular se já existe
      }
      
      // Só processar se for mês atual ou futuro
      const isCurrentOrFuture = year > currentYear || (year === currentYear && month >= currentMonth);
      
      if (isCurrentOrFuture) {
        addToDay(year, month, targetDay, type, amount, 'recurring');
        
        // Atualizar contadores apenas uma vez por mês
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

  const clearMonthCache = useCallback(() => {
    // Função vazia - não precisamos de cache complexo
  }, []);

  return { 
    processRecurringTransactions,
    clearMonthCache
  };
};