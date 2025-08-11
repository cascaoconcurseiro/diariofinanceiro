/**
 * Utilitários de Data Seguros
 * Centraliza manipulação de datas para evitar problemas de timezone
 */

/**
 * Obtém a data atual de forma consistente
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * Obtém o ano atual de forma consistente
 */
export const getCurrentYear = (): number => {
  return getCurrentDate().getFullYear();
};

/**
 * Obtém o mês atual de forma consistente (0-based)
 */
export const getCurrentMonth = (): number => {
  return getCurrentDate().getMonth();
};

/**
 * Cria uma data segura evitando problemas de timezone
 */
export const createSafeDate = (year: number, month: number, day: number): Date => {
  // Usa UTC para evitar problemas de timezone
  return new Date(year, month - 1, day, 12, 0, 0, 0); // Meio-dia para evitar mudanças de DST
};

/**
 * Converte string de data para Date de forma segura
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  return createSafeDate(year, month, day);
};

/**
 * Formata data para string de forma consistente
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtém número de dias no mês de forma segura
 */
export const getDaysInMonth = (year: number, month: number): number => {
  // month é 0-based aqui
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Verifica se uma data é válida
 */
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Obtém timestamp seguro para IDs únicos
 */
export const getSecureTimestamp = (): string => {
  return Date.now().toString();
};

/**
 * Cria ISO string de forma consistente
 */
export const createISOString = (date?: Date): string => {
  const targetDate = date || getCurrentDate();
  return targetDate.toISOString();
};

/**
 * Compara duas datas de forma segura
 */
export const compareDates = (date1: Date, date2: Date): number => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return 0;
  }
  return date1.getTime() - date2.getTime();
};

/**
 * Verifica se uma data está dentro de um range válido
 */
export const isDateInValidRange = (date: Date, maxYearsBack: number = 50, maxYearsForward: number = 10): boolean => {
  if (!isValidDate(date)) {
    return false;
  }

  const currentYear = getCurrentYear();
  const dateYear = date.getFullYear();
  
  return dateYear >= (currentYear - maxYearsBack) && 
         dateYear <= (currentYear + maxYearsForward);
};