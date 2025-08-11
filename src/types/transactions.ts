export interface TransactionEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  description: string;
  amount: number;
  type: 'entrada' | 'saida' | 'diario';
  category?: string;
  isRecurring: boolean;
  recurringId?: string; // ID da transação recorrente pai
  source: 'manual' | 'recurring' | 'quick-entry';
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface TransactionDeletionContext {
  transactionId: string;
  isRecurring: boolean;
  recurringId?: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida' | 'diario';
}

export interface DayTransactions {
  date: string;
  transactions: TransactionEntry[];
  totalEntrada: number;
  totalSaida: number;
  totalDiario: number;
}

export interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  type?: 'entrada' | 'saida' | 'diario';
  isRecurring?: boolean;
  source?: 'manual' | 'recurring' | 'quick-entry';
}

export interface TransactionSummary {
  totalTransactions: number;
  totalEntrada: number;
  totalSaida: number;
  totalDiario: number;
  recurringCount: number;
  manualCount: number;
}