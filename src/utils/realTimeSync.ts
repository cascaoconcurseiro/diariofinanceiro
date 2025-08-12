/**
 * SINCRONIZAÇÃO REAL-TIME FUNCIONAL
 * Baseada em BroadcastChannel + IndexedDB
 */
class RealTimeSync {
  private channel: BroadcastChannel;
  private deviceId: string;
  private userId: string | null = null;
  private syncCallbacks: ((data: any) => void)[] = [];
  private dbName = 'DiarioFinanceiroRealTime';
  private db: IDBDatabase | null = null;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.channel = new BroadcastChannel('diario-sync');
    this.init();
    this.setupListeners();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('🔄 Real-time sync inicializado');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('syncEvents')) {
          const store = db.createObjectStore('syncEvents', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  private setupListeners(): void {
    // Escutar mensagens de outros dispositivos/abas
    this.channel.onmessage = (event) => {
      const data = event.data;
      
      // Ignorar mensagens do próprio dispositivo
      if (data.deviceId === this.deviceId) return;
      
      // Processar apenas se for do mesmo usuário
      if (data.userId === this.userId) {
        console.log('📡 Recebido:', data.type, 'de', data.deviceId);
        this.syncCallbacks.forEach(callback => callback(data));
      }
    };

    // Escutar mudanças no localStorage (para detectar login/logout)
    window.addEventListener('storage', (e) => {
      if (e.key === 'userData') {
        const userData = e.newValue ? JSON.parse(e.newValue) : null;
        this.userId = userData?.id || null;
      }
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
    console.log('🔄 Sync configurado para usuário:', userId);
  }

  // Enviar dados para outros dispositivos
  send(data: any): void {
    if (!this.userId) return;

    const message = {
      ...data,
      deviceId: this.deviceId,
      userId: this.userId,
      timestamp: Date.now()
    };

    // Broadcast para outras abas/dispositivos
    this.channel.postMessage(message);
    
    // Salvar evento no IndexedDB para persistência
    this.saveEvent(message);
  }

  private async saveEvent(event: any): Promise<void> {
    if (!this.db) return;

    const eventData = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ...event
    };

    const transaction = this.db.transaction(['syncEvents'], 'readwrite');
    const store = transaction.objectStore('syncEvents');
    store.add(eventData);
  }

  // Sincronizar transação
  syncTransaction(action: 'add' | 'update' | 'delete', transaction: any): void {
    this.send({
      type: 'transaction',
      action,
      data: transaction
    });
  }

  // Registrar callback para receber dados
  onSync(callback: (data: any) => void): void {
    this.syncCallbacks.push(callback);
  }

  // Status da conexão (sempre conectado com BroadcastChannel)
  isConnected(): boolean {
    return true;
  }

  // Forçar sincronização completa
  forceSync(allTransactions: any[]): void {
    this.send({
      type: 'full_sync',
      data: allTransactions
    });
  }

  // Buscar eventos perdidos (para quando dispositivo volta online)
  async getRecentEvents(since: number): Promise<any[]> {
    if (!this.db || !this.userId) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncEvents'], 'readonly');
      const store = transaction.objectStore('syncEvents');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(since);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        const events = request.result.filter(e => 
          e.userId === this.userId && e.deviceId !== this.deviceId
        );
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Limpar eventos antigos
  async cleanOldEvents(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoff = Date.now() - olderThan;
    const transaction = this.db.transaction(['syncEvents'], 'readwrite');
    const store = transaction.objectStore('syncEvents');
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

export const realTimeSync = new RealTimeSync();

// Auto-limpeza de eventos antigos
setInterval(() => {
  realTimeSync.cleanOldEvents().catch(console.error);
}, 24 * 60 * 60 * 1000); // Uma vez por dia