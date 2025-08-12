/**
 * NEON.TECH POSTGRESQL DATABASE
 * Banco real na nuvem com sincronização instantânea
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_ALdt46Yrgpqw@ep-bitter-grass-ae94ah92-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

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

      // Criar índices para performance
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id 
        ON user_transactions(user_id)
      `;
      
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users(email)
      `;

      // Inserir usuários de teste se não existirem
      await this.createTestUsers();

      this.initialized = true;
      console.log('🐘 Neon PostgreSQL connected');
      return true;
    } catch (error) {
      console.error('Database init error:', error);
      return false;
    }
  }

  async addTransaction(userId: string, transaction: any) {
    const connected = await this.init();
    if (!connected) return false;
    
    try {
      await this.sql`
        INSERT INTO user_transactions (
          id, user_id, date, description, amount, type, 
          category, is_recurring, recurring_id, source, created_at, updated_at
        ) VALUES (
          ${transaction.id}, ${userId}, ${transaction.date}, ${transaction.description},
          ${transaction.amount}, ${transaction.type}, ${transaction.category || 'Geral'},
          ${transaction.isRecurring || false}, ${transaction.recurringId || null},
          ${transaction.source || 'manual'}, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      console.log('✅ Transaction saved to Neon:', transaction.description);
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
        amount: parseFloat(row.amount),
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

  async syncUserTransactions(userId: string, transactions: any[]) {
    await this.init();
    
    try {
      // Limpar transações existentes do usuário
      await this.sql`DELETE FROM user_transactions WHERE user_id = ${userId}`;
      
      // Inserir todas as transações
      for (const transaction of transactions) {
        await this.addTransaction(userId, transaction);
      }
      
      console.log(`🔄 Synced ${transactions.length} transactions to Neon`);
      return true;
    } catch (error) {
      console.error('Sync transactions error:', error);
      return false;
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

  // Criar usuários de teste
  async createTestUsers() {
    const testUsers = [
      { id: 'wesley', name: 'Wesley', email: 'wesley@teste.com', password: '123456' },
      { id: 'joao', name: 'João Silva', email: 'joao@teste.com', password: 'MinhaSenh@123' },
      { id: 'maria', name: 'Maria Santos', email: 'maria@teste.com', password: 'OutraSenh@456' }
    ];

    for (const user of testUsers) {
      try {
        await this.sql`
          INSERT INTO users (id, name, email, password_hash)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${user.password})
          ON CONFLICT (email) DO NOTHING
        `;
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }

  // Autenticação
  async authenticateUser(email: string, password: string) {
    await this.init();
    
    try {
      const result = await this.sql`
        SELECT id, name, email, password_hash
        FROM users 
        WHERE email = ${email} AND password_hash = ${password}
      `;
      
      if (result.length > 0) {
        const user = result[0];
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        };
      } else {
        return {
          success: false,
          error: 'Credenciais inválidas'
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }
}

export const neonDB = new NeonDatabase();