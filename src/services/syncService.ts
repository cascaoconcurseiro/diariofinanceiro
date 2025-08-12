/**
 * SINCRONIZAÇÃO REAL COM NEON.TECH
 * Banco PostgreSQL na nuvem com sync instantâneo
 */

import { neonDB } from './neonDatabase';

class SyncService {
  private userId: string | null = null;
  private syncInterval: number | null = null;
  private listeners: ((transactions: any[]) => void)[] = [];
  private lastSync: Date | null = null;

  async init() {
    await neonDB.init();
    console.log('🔄 Sync service with Neon initialized');
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.startRealTimeSync();
  }

  private startRealTimeSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    // Sincronização ultra-rápida a cada 1 segundo
    this.syncInterval = window.setInterval(async () => {
      await this.checkForUpdates();
    }, 1000);
  }

  private async checkForUpdates() {
    if (!this.userId) return;

    try {
      const lastUpdate = await neonDB.getLastUpdate(this.userId);
      
      if (!this.lastSync || (lastUpdate && new Date(lastUpdate) > this.lastSync)) {
        console.log('🔄 Syncing from Neon...');
        
        const transactions = await neonDB.getUserTransactions(this.userId);
        localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
        
        this.listeners.forEach(listener => listener(transactions));
        this.lastSync = new Date();
      }
    } catch (error) {
      console.error('Sync check error:', error);
    }
  }

  async addTransaction(transaction: any): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const success = await neonDB.addTransaction(this.userId, transaction);
      
      if (success) {
        // Atualizar cache local
        const allTransactions = await neonDB.getUserTransactions(this.userId);
        localStorage.setItem('unifiedFinancialData', JSON.stringify(allTransactions));
        this.notifyListeners(allTransactions);
        this.lastSync = new Date();
      }
      
      return success;
    } catch (error) {
      console.error('Add transaction error:', error);
      return false;
    }
  }

  async deleteTransaction(transactionId: string): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const success = await neonDB.deleteTransaction(this.userId, transactionId);
      
      if (success) {
        const allTransactions = await neonDB.getUserTransactions(this.userId);
        localStorage.setItem('unifiedFinancialData', JSON.stringify(allTransactions));
        this.notifyListeners(allTransactions);
        this.lastSync = new Date();
      }
      
      return success;
    } catch (error) {
      console.error('Delete transaction error:', error);
      return false;
    }
  }

  async loadUserTransactions(): Promise<any[]> {
    if (!this.userId) return [];
    
    try {
      const transactions = await neonDB.getUserTransactions(this.userId);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
      this.lastSync = new Date();
      return transactions;
    } catch (error) {
      console.error('Load transactions error:', error);
      return [];
    }
  }

  async syncAllTransactions(transactions: any[]): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const success = await neonDB.syncUserTransactions(this.userId, transactions);
      
      if (success) {
        localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
        this.notifyListeners(transactions);
        this.lastSync = new Date();
      }
      
      return success;
    } catch (error) {
      console.error('Sync all error:', error);
      return false;
    }
  }

  onDataChange(callback: (transactions: any[]) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners(transactions: any[]) {
    this.listeners.forEach(listener => listener(transactions));
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();