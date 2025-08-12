/**
 * BANCO DE DADOS REAL POR USUÁRIO
 * Cada usuário tem seu próprio banco isolado
 */

interface UserDatabase {
  userId: string;
  transactions: any[];
  lastModified: number;
}

class DatabaseService {
  private dbName = 'FinancialSystemDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('userTransactions')) {
          const store = db.createObjectStore('userTransactions', { keyPath: 'userId' });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  async saveUserTransactions(userId: string, transactions: any[]): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userTransactions'], 'readwrite');
      const store = transaction.objectStore('userTransactions');
      
      const userData: UserDatabase = {
        userId,
        transactions,
        lastModified: Date.now()
      };

      const request = store.put(userData);
      
      request.onsuccess = () => {
        console.log(`💾 Saved ${transactions.length} transactions for user ${userId}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUserTransactions(userId: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userTransactions'], 'readonly');
      const store = transaction.objectStore('userTransactions');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.transactions) {
          console.log(`📖 Loaded ${result.transactions.length} transactions for user ${userId}`);
          resolve(result.transactions);
        } else {
          resolve([]);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addTransaction(userId: string, transaction: any): Promise<boolean> {
    const currentTransactions = await this.getUserTransactions(userId);
    
    // Verificar duplicata
    const exists = currentTransactions.find(t => t.id === transaction.id);
    if (exists) return true;

    const updatedTransactions = [...currentTransactions, transaction];
    return await this.saveUserTransactions(userId, updatedTransactions);
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const currentTransactions = await this.getUserTransactions(userId);
    const filteredTransactions = currentTransactions.filter(t => t.id !== transactionId);
    return await this.saveUserTransactions(userId, filteredTransactions);
  }
}

export const databaseService = new DatabaseService();