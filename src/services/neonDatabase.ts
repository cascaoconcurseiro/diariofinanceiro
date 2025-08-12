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

      // Criar índice para performance
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id 
        ON user_transactions(user_id)
      `;

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
}

export const neonDB = new NeonDatabase();