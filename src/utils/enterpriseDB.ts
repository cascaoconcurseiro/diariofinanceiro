// Sistema de banco de dados enterprise
class EnterpriseDB {
  private dbName = 'DiarioFinanceiroEnterprise';
  private version = 3;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Transações com índices otimizados
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          transactionStore.createIndex('userId', 'userId', { unique: false });
          transactionStore.createIndex('dateType', ['date', 'type'], { unique: false });
        }
        
        // Usuários com criptografia
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Configurações do sistema
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Logs de auditoria
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('userId', 'userId', { unique: false });
          auditStore.createIndex('action', 'action', { unique: false });
        }
        
        // Cache de performance
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Transações com performance otimizada
  async addTransaction(transaction: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const enrichedTransaction = {
      ...transaction,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    return new Promise((resolve, reject) => {
      const transaction_db = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction_db.objectStore('transactions');
      const request = store.add(enrichedTransaction);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Busca otimizada por índices
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Busca por tipo com performance
  async getTransactionsByType(type: string): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('type');
      const request = index.getAll(type);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Busca composta otimizada
  async getTransactionsByDateAndType(date: string, type: string): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('dateType');
      const request = index.getAll([date, type]);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Auditoria de ações
  async logAction(userId: string, action: string, details: any): Promise<void> {
    if (!this.db) return;
    
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId,
      action,
      details: JSON.stringify(details).substring(0, 1000), // Limitar tamanho
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const transaction = this.db.transaction(['audit_logs'], 'readwrite');
    const store = transaction.objectStore('audit_logs');
    store.add(logEntry);
  }

  // Limpeza automática de logs antigos
  async cleanOldLogs(daysToKeep: number = 30): Promise<number> {
    if (!this.db) return 0;
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audit_logs'], 'readwrite');
      const store = transaction.objectStore('audit_logs');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Estatísticas do banco
  async getDBStats(): Promise<any> {
    if (!this.db) return {};
    
    const stats = {
      transactions: 0,
      users: 0,
      auditLogs: 0,
      cacheEntries: 0,
      dbSize: 0
    };
    
    const storeNames = ['transactions', 'users', 'audit_logs', 'cache'];
    
    for (const storeName of storeNames) {
      const count = await this.getStoreCount(storeName);
      switch (storeName) {
        case 'transactions': stats.transactions = count; break;
        case 'users': stats.users = count; break;
        case 'audit_logs': stats.auditLogs = count; break;
        case 'cache': stats.cacheEntries = count; break;
      }
    }
    
    return stats;
  }

  private async getStoreCount(storeName: string): Promise<number> {
    if (!this.db) return 0;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Backup completo
  async exportData(): Promise<any> {
    if (!this.db) return {};
    
    const data: any = {};
    const storeNames = ['transactions', 'users', 'settings'];
    
    for (const storeName of storeNames) {
      data[storeName] = await this.getAllFromStore(storeName);
    }
    
    return data;
  }

  async getAllFromStore(storeName: string): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Atualizar usuário
  async updateUser(userId: string, updates: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      // Primeiro buscar o usuário
      const getRequest = store.get(userId);
      
      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (user) {
          const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
          const putRequest = store.put(updatedUser);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('User not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Excluir usuário
  async deleteUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(userId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Excluir transações do usuário
  async deleteUserTransactions(userId: string): Promise<number> {
    if (!this.db) return 0;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const index = store.index('userId');
      const request = index.openCursor(userId);
      
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const enterpriseDB = new EnterpriseDB();