// Interfaces para tipagem segura do banco de dados

export interface DatabaseTransaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category?: string;
  is_recurring?: boolean;
  recurring_id?: string;
  source?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseRecurringTransaction {
  id: string;
  user_id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  day_of_month: number;
  frequency: string;
  remaining_count?: number;
  months_duration?: number;
  remaining_months?: number;
  start_date: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

export interface CreateUserResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}