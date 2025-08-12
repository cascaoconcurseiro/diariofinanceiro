// Validações robustas para entrada de dados

export const validateTransaction = (transaction: any): boolean => {
  if (!transaction || typeof transaction !== 'object') return false;
  
  const required = ['id', 'date', 'description', 'amount', 'type'];
  for (const field of required) {
    if (!transaction[field]) return false;
  }
  
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) return false;
  if (!['entrada', 'saida'].includes(transaction.type)) return false;
  if (transaction.description.length > 255) return false;
  
  return true;
};

export const validateRecurringTransaction = (recurring: any): boolean => {
  if (!recurring || typeof recurring !== 'object') return false;
  
  const required = ['type', 'amount', 'description', 'dayOfMonth', 'frequency'];
  for (const field of required) {
    if (recurring[field] === undefined || recurring[field] === null) return false;
  }
  
  if (typeof recurring.amount !== 'number' || isNaN(recurring.amount)) return false;
  if (!['entrada', 'saida'].includes(recurring.type)) return false;
  if (typeof recurring.dayOfMonth !== 'number' || recurring.dayOfMonth < 1 || recurring.dayOfMonth > 31) return false;
  if (!['until-cancelled', 'fixed-count', 'monthly-duration'].includes(recurring.frequency)) return false;
  if (recurring.description.length > 255) return false;
  
  return true;
};

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>\"'&]/g, '').trim().substring(0, 255);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePassword = (password: string): boolean => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
};

export const validateName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length >= 2 && name.length <= 100;
};