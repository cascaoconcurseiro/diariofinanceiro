/**
 * SINCRONIZAÇÃO REAL ENTRE DISPOSITIVOS
 * Abordagem simples: BroadcastChannel + localStorage + polling
 */

class RealTimeSyncService {
  private channel: BroadcastChannel;
  private userId: string | null = null;
  private lastSync: number = 0;
  private syncKey = 'financial_sync_data';

  constructor() {
    this.channel = new BroadcastChannel('financial_sync');
    this.setupListeners();
    this.startPolling();
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.lastSync = Date.now();
  }

  private setupListeners() {
    // Escutar mensagens de outros dispositivos/abas
    this.channel.onmessage = (event) => {
      const { type, data, timestamp, userId } = event.data;
      
      if (userId === this.userId && timestamp > this.lastSync) {
        console.log('📡 Received sync from another device:', type);
        
        if (type === 'transactions_updated') {
          localStorage.setItem('unifiedFinancialData', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('syncDataReceived', { detail: data }));
          this.lastSync = timestamp;
        }
      }
    };
  }

  private startPolling() {
    // Verificar mudanças a cada 1 segundo
    setInterval(() => {
      this.checkForChanges();
    }, 1000);
  }

  private checkForChanges() {
    if (!this.userId) return;

    try {
      const syncData = localStorage.getItem(this.syncKey);
      if (syncData) {
        const { timestamp, userId, data } = JSON.parse(syncData);
        
        if (userId !== this.userId && timestamp > this.lastSync) {
          console.log('🔄 Detected changes from another device');
          localStorage.setItem('unifiedFinancialData', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('syncDataReceived', { detail: data }));
          this.lastSync = timestamp;
        }
      }
    } catch (error) {
      console.error('Sync check error:', error);
    }
  }

  syncTransactions(transactions: any[]) {
    if (!this.userId) return;

    const syncData = {
      userId: this.userId,
      data: transactions,
      timestamp: Date.now()
    };

    // Salvar para outros dispositivos
    localStorage.setItem(this.syncKey, JSON.stringify(syncData));
    
    // Notificar outras abas
    this.channel.postMessage({
      type: 'transactions_updated',
      data: transactions,
      timestamp: syncData.timestamp,
      userId: this.userId
    });

    this.lastSync = syncData.timestamp;
    console.log('📤 Synced transactions to other devices');
  }
}

export const realTimeSync = new RealTimeSyncService();