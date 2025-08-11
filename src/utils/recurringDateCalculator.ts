/**
 * UTILITÁRIO PARA CÁLCULO DE DATAS DE LANÇAMENTOS RECORRENTES
 * 
 * Garante que lançamentos recorrentes sempre sejam criados para datas futuras
 */

export interface RecurringDateOptions {
  dayOfMonth: number;
  startDate?: Date;
  frequency?: 'monthly' | 'fixed-count' | 'monthly-duration';
}

/**
 * Calcula a próxima data válida para um lançamento recorrente
 * @param options Opções do lançamento recorrente
 * @returns Próxima data válida (sempre no futuro)
 */
export function calculateNextRecurringDate(options: RecurringDateOptions): Date {
  const { dayOfMonth, startDate } = options;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let nextDate: Date;
  
  // Se há uma data de início específica e ela é futura, usar ela
  if (startDate && startDate > today) {
    nextDate = new Date(startDate);
    nextDate.setDate(dayOfMonth);
  } else {
    // Calcular baseado no mês atual
    nextDate = new Date(currentYear, currentMonth, dayOfMonth);
    
    // Se o dia já passou no mês atual, ir para o próximo mês
    if (dayOfMonth <= currentDay) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      console.log(`📅 CORREÇÃO: Dia ${dayOfMonth} já passou este mês, próxima execução em ${nextDate.toLocaleDateString()}`);
    }
  }
  
  // Ajustar para meses que não têm o dia especificado (ex: 31 em fevereiro)
  if (nextDate.getDate() !== dayOfMonth) {
    // Usar o último dia do mês
    nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
    console.log(`📅 AJUSTE: Dia ${dayOfMonth} não existe no mês, usando último dia: ${nextDate.getDate()}`);
  }
  
  // Garantir que a data é futura
  if (nextDate <= today) {
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate = adjustDayOfMonth(nextDate, dayOfMonth);
    console.log(`📅 SEGURANÇA: Data ainda no passado, avançando para ${nextDate.toLocaleDateString()}`);
  }
  
  return nextDate;
}

/**
 * Ajusta o dia do mês para uma data específica
 * @param date Data base
 * @param dayOfMonth Dia desejado
 * @returns Data ajustada
 */
function adjustDayOfMonth(date: Date, dayOfMonth: number): Date {
  const adjusted = new Date(date.getFullYear(), date.getMonth(), dayOfMonth);
  
  // Se o dia não existe no mês, usar o último dia
  if (adjusted.getDate() !== dayOfMonth) {
    return new Date(adjusted.getFullYear(), adjusted.getMonth() + 1, 0);
  }
  
  return adjusted;
}

/**
 * Verifica se uma data de lançamento recorrente é válida (futura)
 * @param date Data a verificar
 * @returns true se a data é válida
 */
export function isValidRecurringDate(date: Date): boolean {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date >= todayStart;
}

/**
 * Calcula todas as próximas execuções de um lançamento recorrente
 * @param options Opções do lançamento
 * @param monthsAhead Quantos meses à frente calcular
 * @returns Array de datas futuras
 */
export function calculateUpcomingRecurringDates(
  options: RecurringDateOptions, 
  monthsAhead: number = 12
): Date[] {
  const dates: Date[] = [];
  let currentDate = calculateNextRecurringDate(options);
  
  for (let i = 0; i < monthsAhead; i++) {
    dates.push(new Date(currentDate));
    
    // Avançar para o próximo mês
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate = adjustDayOfMonth(currentDate, options.dayOfMonth);
  }
  
  return dates;
}

/**
 * Formata uma data de lançamento recorrente para exibição
 * @param date Data
 * @returns String formatada
 */
export function formatRecurringDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Amanhã';
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}