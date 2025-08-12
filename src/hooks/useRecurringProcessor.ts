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
    const currentDay = today.getDate();
    
    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, remainingMonths, id } = transaction;
      
      // Ajustar dia para meses com menos dias
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      // ✅ CORREÇÃO: Só gerar para datas futuras
      const targetDate = new Date(year, month, targetDay);
      const isToday = year === currentYear && month === currentMonth && targetDay === currentDay;
      const isFuture = targetDate > today || isToday;
      
      if (!isFuture) {
        console.log(`⏭️ Skipping past date: ${year}-${String(month+1).padStart(2,'0')}-${String(targetDay).padStart(2,'0')}`);
        return; // Pular datas passadas
      }
      
      console.log(`✅ Generating recurring for future date: ${year}-${String(month+1).padStart(2,'0')}-${String(targetDay).padStart(2,'0')}`);
      
      // Adicionar transação apenas para datas futuras
      addToDay(year, month, targetDay, type, amount, 'recurring');
      
      // Atualizar contadores apenas se gerou a transação
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
    });
  }, []);

  const clearMonthCache = useCallback(() => {
    // Função vazia - não precisamos de cache complexo
  }, []);

  return { 
    processRecurringTransactions,
    clearMonthCache
  };
};