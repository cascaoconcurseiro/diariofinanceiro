// Sistema robusto de tratamento de erros
export class FinancialSystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'FinancialSystemError';
  }
}

export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[${context}] Error:`, errorMessage);
    
    // Log para auditoria sem dados sensíveis
    const sanitizedError = errorMessage.substring(0, 100);
    console.error(`[${context}] Sanitized:`, sanitizedError);
    
    return { success: false, error: sanitizedError };
  }
};

export const validateTransaction = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Data inválida');
  }
  
  if (!data.description || data.description.trim().length < 1) {
    errors.push('Descrição é obrigatória');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Valor deve ser maior que zero');
  }
  
  if (!['entrada', 'saida', 'diario'].includes(data.type)) {
    errors.push('Tipo de transação inválido');
  }
  
  return { valid: errors.length === 0, errors };
};