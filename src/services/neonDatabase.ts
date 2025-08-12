/**
 * NEON.TECH POSTGRESQL DATABASE
 * Banco real na nuvem com sincronização instantânea
 */

import { neon } from '@neondatabase/serverless';
import type { DatabaseTransaction, DatabaseUser, DatabaseRecurringTransaction, AuthResult, CreateUserResult } from '../types/database';
import { validateTransaction, validateRecurringTransaction, sanitizeInput, validateEmail, validatePassword, validateName } from '../utils/validation';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';
const HASH_SALT = import.meta.env.VITE_HASH_SALT || 'fallback_salt_2024';

class NeonDatabase {
  private sql: any;
  private initialized = false;

  constructor() {
    this.sql = neon(DATABASE_URL, {
      disableWarningInBrowsers: true
    });
  }

  async init() {
    if (this.initialized) return true;

    try {
      // Testar conexão primeiro
      await this.sql`SELECT 1`;
      
      // Criar tabela de usuários
      await this.sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_blocked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Criar tabela de transações se não existir
      await this.sql`
        CREATE TABLE IF NOT EXISTS user_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          is_recurring BOOLEAN DEFAULT FALSE,
          recurring_id TEXT,
          source TEXT DEFAULT 'manual',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Criar tabela de transações recorrentes
      await this.sql`
        CREATE TABLE IF NOT EXISTS recurring_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT NOT NULL,
          day_of_month INTEGER NOT NULL,
          frequency TEXT NOT NULL,
          remaining_count INTEGER,
          months_duration INTEGER,
          remaining_months INTEGER,
          start_date TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Criar tabela de configurações do usuário
      await this.sql`
        CREATE TABLE IF NOT EXISTS user_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          emergency_reserve_amount DECIMAL(10,2) DEFAULT 0,
          emergency_reserve_months INTEGER DEFAULT 6,
          fixed_expenses JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      // Criar índices para performance
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id 
        ON user_transactions(user_id)
      `;
      
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users(email)
      `;
      
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id 
        ON recurring_transactions(user_id)
      `;
      
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
        ON user_settings(user_id)
      `;

      // Inserir usuários de teste (sempre recriar para garantir hash correto)
      await this.createTestUsers();

      this.initialized = true;
      console.log('🐘 Neon PostgreSQL connected');
      return true;
    } catch (error) {
      console.error('Database init error:', error);
      return false;
    }
  }

  async addTransaction(userId: string, transaction: Partial<DatabaseTransaction>) {
    const connected = await this.init();
    if (!connected) return false;
    
    // Validação de entrada
    if (!validateTransaction(transaction)) {
      console.error('Invalid transaction data');
      return false;
    }
    
    try {
      const sanitizedDescription = sanitizeInput(transaction.description || '');
      
      await this.sql`
        INSERT INTO user_transactions (
          id, user_id, date, description, amount, type, 
          category, is_recurring, recurring_id, source, created_at, updated_at
        ) VALUES (
          ${transaction.id}, ${userId}, ${transaction.date}, ${sanitizedDescription},
          ${transaction.amount}, ${transaction.type}, ${transaction.category || 'Geral'},
          ${transaction.isRecurring || false}, ${transaction.recurringId || null},
          ${transaction.source || 'manual'}, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      console.log('✅ Transaction saved to Neon');
      return true;
    } catch (error) {
      console.error('Add transaction error:', error);
      return false;
    }
  }

  async getUserTransactions(userId: string) {
    await this.init();
    
    try {
      const result = await this.sql`
        SELECT * FROM user_transactions 
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
      `;

      const transactions = result.map(row => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        type: row.type,
        category: row.category,
        isRecurring: row.is_recurring,
        recurringId: row.recurring_id,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log(`📖 Loaded ${transactions.length} transactions from Neon`);
      return transactions;
    } catch (error) {
      console.error('Get transactions error:', error);
      return [];
    }
  }

  async deleteTransaction(userId: string, transactionId: string) {
    await this.init();
    
    try {
      await this.sql`
        DELETE FROM user_transactions 
        WHERE id = ${transactionId} AND user_id = ${userId}
      `;
      
      console.log('🗑️ Transaction deleted from Neon');
      return true;
    } catch (error) {
      console.error('Delete transaction error:', error);
      return false;
    }
  }

  async syncUserTransactions(userId: string, transactions: Partial<DatabaseTransaction>[]) {
    await this.init();
    
    try {
      // Limpar transações existentes do usuário
      await this.sql`DELETE FROM user_transactions WHERE user_id = ${userId}`;
      
      // Batch insert para melhor performance
      if (transactions.length > 0) {
        const values = transactions.map(t => [
          t.id, userId, t.date, t.description, t.amount, t.type,
          t.category || 'Geral', t.isRecurring || false, t.recurringId || null,
          t.source || 'manual'
        ]);
        
        // Inserir em lotes de 100
        for (let i = 0; i < values.length; i += 100) {
          const batch = values.slice(i, i + 100);
          await this.sql`
            INSERT INTO user_transactions (
              id, user_id, date, description, amount, type,
              category, is_recurring, recurring_id, source, created_at, updated_at
            )
            SELECT * FROM UNNEST(
              ${batch.map(v => v[0])}::text[],
              ${batch.map(v => v[1])}::text[],
              ${batch.map(v => v[2])}::text[],
              ${batch.map(v => v[3])}::text[],
              ${batch.map(v => v[4])}::decimal[],
              ${batch.map(v => v[5])}::text[],
              ${batch.map(v => v[6])}::text[],
              ${batch.map(v => v[7])}::boolean[],
              ${batch.map(v => v[8])}::text[],
              ${batch.map(v => v[9])}::text[]
            ) AS t(id, user_id, date, description, amount, type, category, is_recurring, recurring_id, source)
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }
      
      console.log(`🔄 Synced ${transactions.length} transactions to Neon`);
      return true;
    } catch (error) {
      console.error('Sync transactions error:', error);
      // Fallback para inserção individual
      for (const transaction of transactions) {
        await this.addTransaction(userId, transaction);
      }
      return true;
    }
  }

  async getLastUpdate(userId: string) {
    await this.init();
    
    try {
      const result = await this.sql`
        SELECT MAX(updated_at) as last_update 
        FROM user_transactions 
        WHERE user_id = ${userId}
      `;
      
      return result[0]?.last_update || null;
    } catch (error) {
      console.error('Get last update error:', error);
      return null;
    }
  }

  // Hash ULTRA SIMPLES - apenas para funcionar
  private hashPassword(password: string): string {
    // Hash mais simples possível
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash += password.charCodeAt(i) * (i + 1);
    }
    return hash.toString();
  }

  // Comparação time-safe para senhas
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  // Criar usuários de teste - LIMPAR E RECRIAR
  async createTestUsers() {
    const testUsers = [
      { id: 'wesley', name: 'Wesley', email: 'wesley@teste.com', password: '123456' },
      { id: 'joao', name: 'João Silva', email: 'joao@teste.com', password: 'MinhaSenh@123' },
      { id: 'maria', name: 'Maria Santos', email: 'maria@teste.com', password: 'OutraSenh@456' }
    ];

    // LIMPAR TODOS OS USUÁRIOS DE TESTE PRIMEIRO
    for (const user of testUsers) {
      try {
        await this.sql`DELETE FROM users WHERE email = ${user.email}`;
      } catch (error) {
        // Ignorar erros de deleção
      }
    }

    // RECRIAR COM HASH CORRETO
    for (const user of testUsers) {
      try {
        const hashedPassword = this.hashPassword(user.password);
        
        await this.sql`
          INSERT INTO users (id, name, email, password_hash, is_blocked)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, FALSE)
        `;
        
        console.log(`✅ Usuário teste criado: ${user.name}`);
      } catch (error) {
        console.error(`Erro ao criar ${user.email}:`, error);
      }
    }
  }

  // Forçar recriação de usuários de teste (para debug)
  async recreateTestUsers() {
    console.log('🔄 Forçando recriação de usuários de teste...');
    await this.createTestUsers();
    console.log('✅ Usuários de teste recriados com sucesso!');
  }

  // LIMPAR TUDO E RECOMEÇAR (para debug crítico)
  async resetDatabase() {
    try {
      console.log('🚨 RESETANDO BANCO COMPLETO...');
      
      // Deletar TODOS os usuários
      await this.sql`DELETE FROM users`;
      
      // Recriar usuários de teste
      await this.createTestUsers();
      
      console.log('✅ BANCO RESETADO COM SUCESSO!');
      return true;
    } catch (error) {
      console.error('Erro ao resetar banco:', error);
      return false;
    }
  }

  // Testar hash de senha (para debug)
  testPasswordHash(password: string): string {
    const hash1 = this.hashPassword(password);
    const hash2 = this.hashPassword(password);
    console.log(`🧪 Teste de consistência para '${password}':`);
    console.log(`Hash 1: ${hash1}`);
    console.log(`Hash 2: ${hash2}`);
    console.log(`Iguais: ${hash1 === hash2}`);
    
    // Testar com senhas dos usuários de teste
    console.log('\n🔑 Hashes dos usuários de teste:');
    console.log('123456 ->', this.hashPassword('123456'));
    console.log('MinhaSenh@123 ->', this.hashPassword('MinhaSenh@123'));
    console.log('OutraSenh@456 ->', this.hashPassword('OutraSenh@456'));
    
    return hash1;
  }

  // Criar usuário ULTRA SIMPLES
  async createUser(email: string, password: string, name: string): Promise<CreateUserResult> {
    await this.init();
    
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // Verificar duplicata de forma mais direta
      const existing = await this.sql`SELECT email FROM users WHERE email = ${cleanEmail}`;
      
      if (existing.length > 0) {
        return { success: false, error: 'Email já cadastrado' };
      }
      
      const userId = `user_${Date.now()}`;
      const hashedPassword = this.hashPassword(password);
      
      await this.sql`
        INSERT INTO users (id, name, email, password_hash, is_blocked)
        VALUES (${userId}, ${name}, ${cleanEmail}, ${hashedPassword}, false)
      `;
      
      return {
        success: true,
        user: { id: userId, name: name, email: cleanEmail }
      };
    } catch (error) {
      console.error('Erro criar usuário:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Autenticação com hash
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    await this.init();
    
    try {
      const hashedPassword = this.hashPassword(password);
      const cleanEmail = email.toLowerCase().trim();
      
      // Buscar usuário de forma simples
      const users = await this.sql`
        SELECT id, name, email, password_hash, is_blocked
        FROM users 
        WHERE email = ${cleanEmail}
      `;
      
      if (users.length === 0) {
        return { success: false, error: 'Email não cadastrado' };
      }
      
      const user = users[0];
      
      if (user.is_blocked) {
        return { success: false, error: 'Usuário bloqueado' };
      }
      
      if (user.password_hash === hashedPassword) {
        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email }
        };
      } else {
        return { success: false, error: 'Senha incorreta' };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // TRANSAÇÕES RECORRENTES NO NEON
  async addRecurringTransaction(userId: string, recurring: Partial<DatabaseRecurringTransaction>) {
    await this.init();
    
    // Validação de entrada
    if (!validateRecurringTransaction(recurring)) {
      console.error('Invalid recurring transaction data');
      return false;
    }
    
    try {
      const sanitizedDescription = sanitizeInput(recurring.description || '');
      
      await this.sql`
        INSERT INTO recurring_transactions (
          id, user_id, type, amount, description, day_of_month,
          frequency, remaining_count, months_duration, remaining_months,
          start_date, is_active, created_at, updated_at
        ) VALUES (
          ${recurring.id}, ${userId}, ${recurring.type}, ${recurring.amount},
          ${sanitizedDescription}, ${recurring.day_of_month}, ${recurring.frequency},
          ${recurring.remaining_count || null}, ${recurring.months_duration || null},
          ${recurring.remaining_months || null}, ${recurring.start_date},
          ${recurring.is_active}, NOW(), NOW()
        )
      `;
      return true;
    } catch (error) {
      console.error('Add recurring error:', error);
      return false;
    }
  }

  async getUserRecurringTransactions(userId: string) {
    await this.init();
    try {
      const result = await this.sql`
        SELECT * FROM recurring_transactions 
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY created_at DESC
      `;
      return result.map(row => ({
        id: row.id,
        type: row.type,
        amount: parseFloat(row.amount) || 0,
        description: row.description,
        dayOfMonth: row.day_of_month,
        frequency: row.frequency,
        remainingCount: row.remaining_count,
        monthsDuration: row.months_duration,
        remainingMonths: row.remaining_months,
        startDate: row.start_date,
        isActive: row.is_active,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get recurring error:', error);
      return [];
    }
  }

  async deleteRecurringTransaction(userId: string, recurringId: string) {
    await this.init();
    try {
      await this.sql`
        UPDATE recurring_transactions 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${recurringId} AND user_id = ${userId}
      `;
      return true;
    } catch (error) {
      console.error('Delete recurring error:', error);
      return false;
    }
  }

  // GERENCIAMENTO DE USUÁRIOS
  async getAllUsers() {
    await this.init();
    try {
      const result = await this.sql`
        SELECT id, name, email, is_blocked, created_at
        FROM users 
        ORDER BY created_at DESC
      `;
      return result;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    await this.init();
    try {
      const hashedPassword = this.hashPassword(newPassword);
      await this.sql`
        UPDATE users 
        SET password_hash = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${userId}
      `;
      console.log('✅ Senha atualizada para usuário:', userId);
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }

  async blockUser(userId: string, blocked: boolean): Promise<boolean> {
    await this.init();
    try {
      await this.sql`
        UPDATE users 
        SET is_blocked = ${blocked}, updated_at = NOW()
        WHERE id = ${userId}
      `;
      console.log(`✅ Usuário ${blocked ? 'bloqueado' : 'desbloqueado'}:`, userId);
      return true;
    } catch (error) {
      console.error('Block user error:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    await this.init();
    try {
      // Deletar transações do usuário
      await this.sql`DELETE FROM user_transactions WHERE user_id = ${userId}`;
      // Deletar transações recorrentes do usuário
      await this.sql`DELETE FROM recurring_transactions WHERE user_id = ${userId}`;
      // Deletar configurações do usuário
      await this.sql`DELETE FROM user_settings WHERE user_id = ${userId}`;
      // Deletar usuário
      await this.sql`DELETE FROM users WHERE id = ${userId}`;
      
      console.log('✅ Usuário excluído:', userId);
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  }

  // Verificar se usuário está bloqueado
  async isUserBlocked(email: string): Promise<boolean> {
    await this.init();
    try {
      const result = await this.sql`
        SELECT is_blocked FROM users WHERE email = ${email}
      `;
      return result.length > 0 && result[0].is_blocked;
    } catch (error) {
      console.error('Check user blocked error:', error);
      return false;
    }
  }
}

export const neonDB = new NeonDatabase();