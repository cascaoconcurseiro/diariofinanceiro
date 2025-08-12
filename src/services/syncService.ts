// Serviço de sincronização simplificado (funciona offline)
class SyncService {
  private getApiUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    // ✅ Forçar HTTPS em produção
    if (import.meta.env.VITE_ENVIRONMENT === 'production' && apiUrl.startsWith('http:')) {
      return apiUrl.replace('http:', 'https:');
    }
    
    return apiUrl;
  }
  // Por enquanto, apenas funciona localmente
  async syncTransactions(localTransactions: any[]): Promise<boolean> {
    // Salvar localmente
    localStorage.setItem('unifiedFinancialData', JSON.stringify(localTransactions));
    return true;
  }

  async fetchTransactions(): Promise<any[]> {
    // Buscar do localStorage
    const saved = localStorage.getItem('unifiedFinancialData');
    return saved ? JSON.parse(saved) : [];
  }

  async createTransaction(transaction: any): Promise<any | null> {
    // Adicionar à lista local
    const transactions = await this.fetchTransactions();
    transactions.push(transaction);
    await this.syncTransactions(transactions);
    return transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    // Remover da lista local
    const transactions = await this.fetchTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await this.syncTransactions(filtered);
    return true;
  }

  isOnline(): boolean {
    return true; // Sempre "online" localmente
  }
}

export const syncService = new SyncService();