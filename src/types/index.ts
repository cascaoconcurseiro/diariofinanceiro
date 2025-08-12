// Tipos centralizados para melhor type safety
export interface EditingTransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida' | 'diario';
  category?: string;
  isRecurring?: boolean;
  recurringId?: string;
  source?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: ValidationError[];
}