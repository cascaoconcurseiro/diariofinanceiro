
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';
import { 
  isRecurringProcessedForMonth, 
  markRecurringProcessedForMonth, 
  clearRecurringMonth 
} from '../utils/recurringTransactionControl';
import { logRecurringAttempt } from '../utils/recurringDebug';

export const useRecurringProcessor = () => {

  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number, source?: string) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  ) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // CRÍTICO: Verificação rigorosa de data para evitar processamento de meses passados
    const targetDate = new Date(year, month, 1);
    const currentDate = new Date(currentYear, currentMonth, 1);
    
    // NÃO processar meses passados (exceto o atual)
    if (targetDate < currentDate) {
      console.log(`⏭️ BLOCKED: Cannot process past month ${year}-${month + 1}`);
      return;
    }
    
    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    // CRÍTICO: Se não há transações ativas, não processar
    if (activeTransactions.length === 0) {
      console.log('⏭️ No active recurring transactions to process');
      return;
    }
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id } = transaction;
      
      // CRÍTICO: Verificar se transação recorrente já foi processada para este mês
      const alreadyProcessed = isRecurringProcessedForMonth(id, year, month, dayOfMonth, amount, type);
      
      // Log da tentativa
      logRecurringAttempt(id, year, month, dayOfMonth, amount, type, alreadyProcessed);
      
      if (alreadyProcessed) {
        console.log(`⏭️ Recurring transaction ${id} already processed for ${year}-${month + 1}-${dayOfMonth}`);
        return;
      }
      
      // Verificar se transação já deveria ter começado
      const startDateObj = new Date(startDate);
      if (targetDate < new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)) {
        console.log(`⏭️ Transaction ${id} hasn't started yet`);
        return;
      }
      
      // CORREÇÃO: Para mês atual, só processar dias futuros
      const isCurrentMonth = year === currentYear && month === currentMonth;
      if (isCurrentMonth && dayOfMonth <= currentDay) {
        console.log(`⏭️ BLOCKED: Day ${dayOfMonth} already passed in current month (today is ${currentDay})`);
        return;
      }
      
      // CORREÇÃO: Para meses passados, não processar nunca
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        console.log(`⏭️ BLOCKED: Cannot process past month ${year}-${month + 1}`);
        return;
      }
      
      // Check if monthly duration has expired
      if (frequency === 'monthly-duration' && monthsDuration && remainingMonths !== undefined) {
        if (remainingMonths <= 0) {
          updateRecurringTransaction(id, { isActive: false });
          console.log(`🔄 Deactivated recurring transaction ${id} - monthly duration expired`);
          return;
        }
      }
      
      // Check if fixed count has expired
      if (frequency === 'fixed-count' && remainingCount !== undefined && remainingCount <= 0) {
        updateRecurringTransaction(id, { isActive: false });
        console.log(`🔄 Deactivated recurring transaction ${id} - count expired`);
        return;
      }
      
      // CORRIGIDO: Ajustar dia para meses com menos dias
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      // CRÍTICO: Marcar como processada ANTES de adicionar (vinculada permanentemente)
      markRecurringProcessedForMonth(id, year, month, targetDay, amount, type);
      
      console.log(`💰 Processing recurring ${type}: ${amount} on ${year}-${month+1}-${targetDay} [PERMANENT LINK]`);
      addToDay(year, month, targetDay, type, amount, 'recurring');
      
      // Atualizar contadores apenas para meses futuros
      if (!isCurrentMonth) {
        if (frequency === 'fixed-count' && remainingCount !== undefined) {
          const newCount = Math.max(0, remainingCount - 1);
          const updates: Partial<RecurringTransaction> = { remainingCount: newCount };
          if (newCount <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
          console.log(`🔄 Updated remaining count for ${id}: ${newCount}`);
        } else if (frequency === 'monthly-duration' && remainingMonths !== undefined) {
          const newMonthsRemaining = Math.max(0, remainingMonths - 1);
          const updates: Partial<RecurringTransaction> = { remainingMonths: newMonthsRemaining };
          if (newMonthsRemaining <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
          console.log(`🔄 Updated remaining months for ${id}: ${newMonthsRemaining}`);
        }
      }
    });
  }, []);

  // Função para limpar cache de transações processadas (APENAS PARA REPROCESSAMENTO MANUAL)
  const clearProcessedCache = useCallback(() => {
    console.log('🧹 Cleared recurring transactions cache');
  }, []);

  // Função para limpar cache de um mês específico (APENAS PARA REPROCESSAMENTO MANUAL)
  const clearMonthCache = useCallback((year: number, month: number) => {
    clearRecurringMonth(year, month);
    console.log(`🧹 Cleared recurring cache for ${year}-${month + 1}`);
  }, []);

  return { 
    processRecurringTransactions,
    clearProcessedCache,
    clearMonthCache
  };
};
