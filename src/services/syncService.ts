/**
 * SINCRONIZAÇÃO AUTOMÁTICA ENTRE DISPOSITIVOS
 * Usando WebSocket simulado + Polling para sincronização real
 */

import { databaseService } from './databaseService';

class SyncService {
  private userId: string | null = null;
  private syncInterval: number | null = null;
  private listeners: ((transactions: any[]) => void)[] = [];

  async init() {
    await databaseService.init();
    console.log('🔄 Sync service initialized');
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.startAutoSync();
  }

  private startAutoSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    // Sincronizar a cada 2 segundos
    this.syncInterval = window.setInterval(async () => {
      await this.checkForUpdates();
    }, 2000);
  }

  private async checkForUpdates() {
    if (!this.userId) return;

    try {
      const dbTransactions = await databaseService.getUserTransactions(this.userId);
      const localTransactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      
      // Verificar se há diferenças
      if (dbTransactions.length !== localTransactions.length) {
        console.log('🔄 Syncing data between devices...');
        localStorage.setItem('unifiedFinancialData', JSON.stringify(dbTransactions));
        
        // Notificar listeners
        this.listeners.forEach(listener => listener(dbTransactions));
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  async addTransaction(transaction: any): Promise<boolean> {
    if (!this.userId) return false;

    try {
      // Salvar no banco
      await databaseService.addTransaction(this.userId, transaction);
      
      // Atualizar localStorage
      const allTransactions = await databaseService.getUserTransactions(this.userId);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(allTransactions));
      
      // Notificar outros dispositivos
      this.notifyListeners(allTransactions);
      
      console.log('✅ Transaction synced across devices');
      return true;
    } catch (error) {
      console.error('Add transaction error:', error);
      return false;
    }
  }

  async deleteTransaction(transactionId: string): Promise<boolean> {
    if (!this.userId) return false;

    try {
      await databaseService.deleteTransaction(this.userId, transactionId);
      
      const allTransactions = await databaseService.getUserTransactions(this.userId);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(allTransactions));
      
      this.notifyListeners(allTransactions);
      
      console.log('✅ Transaction deleted and synced');
      return true;
    } catch (error) {
      console.error('Delete transaction error:', error);
      return false;
    }
  }

  async syncAllTransactions(transactions: any[]): Promise<boolean> {
    if (!this.userId) return false;

    try {
      await databaseService.saveUserTransactions(this.userId, transactions);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
      this.notifyListeners(transactions);
      return true;
    } catch (error) {
      console.error('Sync all error:', error);
      return false;
    }
  }

  async loadUserTransactions(): Promise<any[]> {
    if (!this.userId) return [];
    
    try {
      const transactions = await databaseService.getUserTransactions(this.userId);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
      return transactions;
    } catch (error) {
      console.error('Load transactions error:', error);
      return [];
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