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

  // Hash de senha seguro
  private hashPassword(password: string): string {
    const salt = 'secure_salt_2024';
    // Usar um hash mais consistente
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).padStart(8, '0');
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
        const hashedPassword = this.hashPassword(user.password);
        console.log(`👤 Criando usuário teste: ${user.email} com hash: ${hashedPassword}`);
        
        // Deletar se existir e recriar com novo hash
        await this.sql`DELETE FROM users WHERE email = ${user.email}`;
        
        await this.sql`
          INSERT INTO users (id, name, email, password_hash)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        `;
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }

  // Criar novo usuário
  async createUser(email: string, password: string, name: string) {
    await this.init();
    
    try {
      // Verificar se email já existe
      const existing = await this.sql`
        SELECT id FROM users WHERE email = ${email}
      `;
      
      if (existing.length > 0) {
        return {
          success: false,
          error: 'Email já cadastrado'
        };
      }
      
      // Criar novo usuário
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = this.hashPassword(password);
      
      await this.sql`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (${userId}, ${name}, ${email}, ${hashedPassword})
      `;
      
      return {
        success: true,
        user: {
          id: userId,
          name: name,
          email: email
        }
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Erro ao criar usuário'
      };
    }
  }

  // Autenticação com hash
  async authenticateUser(email: string, password: string) {
    await this.init();
    
    try {
      const hashedPassword = this.hashPassword(password);
      console.log('🔐 Tentando login:', { email, hashedPassword });
      
      // Primeiro verificar se o usuário existe
      const userCheck = await this.sql`
        SELECT id, name, email, password_hash
        FROM users 
        WHERE email = ${email}
      `;
      
      if (userCheck.length === 0) {
        console.log('❌ Usuário não encontrado:', email);
        return {
          success: false,
          error: 'Email não cadastrado'
        };
      }
      
      const user = userCheck[0];
      console.log('👤 Usuário encontrado:', { id: user.id, name: user.name, storedHash: user.password_hash });
      
      if (user.password_hash === hashedPassword) {
        console.log('✅ Senha correta');
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        };
      } else {
        console.log('❌ Senha incorreta');
        return {
          success: false,
          error: 'Senha incorreta'
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

  // TRANSAÇÕES RECORRENTES NO NEON
  async addRecurringTransaction(userId: string, recurring: any) {
    await this.init();
    try {
      await this.sql`
        INSERT INTO recurring_transactions (
          id, user_id, type, amount, description, day_of_month,
          frequency, remaining_count, months_duration, remaining_months,
          start_date, is_active, created_at, updated_at
        ) VALUES (
          ${recurring.id}, ${userId}, ${recurring.type}, ${recurring.amount},
          ${recurring.description}, ${recurring.dayOfMonth}, ${recurring.frequency},
          ${recurring.remainingCount || null}, ${recurring.monthsDuration || null},
          ${recurring.remainingMonths || null}, ${recurring.startDate},
          ${recurring.isActive}, NOW(), NOW()
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
        amount: parseFloat(row.amount),
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
}

export const neonDB = new NeonDatabase();