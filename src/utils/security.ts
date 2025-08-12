// Utilitários de segurança essenciais
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove eventos onclick, etc
    .replace(/[\r\n\t]/g, ' ') // Remove quebras de linha
    .trim()
    .substring(0, 1000); // Limita tamanho
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '');
};

export const sanitizeAmount = (amount: string | number): number => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
  return isNaN(num) ? 0 : Math.abs(num);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};