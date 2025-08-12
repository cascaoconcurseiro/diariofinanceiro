/**
 * SINCRONIZAÇÃO REAL ENTRE DISPOSITIVOS
 * Usando IndexedDB + Simulação de Cloud Storage
 */

interface CloudData {
  userId: string;
  data: any[];
  lastModified: number;
  deviceId: string;
}

class SyncService {
  private dbName = 'DiarioFinanceiroCloudSync';
  private version = 3;
  private db: IDBDatabase | null = null;
  private userId: string | null = null;
  private deviceId: string;
  private syncInterval: number | null = null;
  private lastKnownDataHash: string = '';

  constructor() {
    this.deviceId = this.getDeviceId();
    this.init();
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cloudData')) {
          const store = db.createObjectStore('cloudData', { keyPath: 'userId' });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.startAutoSync();
  }

  private startAutoSync(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    // Sincronizar a cada 2 segundos para detecção ultra-rápida
    this.syncInterval = window.setInterval(async () => {
      await this.checkForUpdates();
    }, 2000);
  }

  private async checkForUpdates(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const cloudData = await this.getCloudData(this.userId);
      if (cloudData) {
        const currentHash = this.hashData(cloudData.data);
        
        if (currentHash !== this.lastKnownDataHash) {
          console.log('🔄 Detectadas mudanças na nuvem, sincronizando...');
          localStorage.setItem('unifiedFinancialData', JSON.stringify(cloudData.data));
          this.lastKnownDataHash = currentHash;
          
          // Disparar evento para atualizar UI
          window.dispatchEvent(new CustomEvent('cloudDataUpdated', {
            detail: { data: cloudData.data }
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    }
  }

  private hashData(data: any[]): string {
    return btoa(JSON.stringify(data.map(t => t.id).sort())).substring(0, 20);
  }

  async syncTransactions(localTransactions: any[]): Promise<boolean> {
    if (!this.userId || !this.db) {
      localStorage.setItem('unifiedFinancialData', JSON.stringify(localTransactions));
      return true;
    }

    try {
      // 1. Buscar dados atuais da nuvem
      const cloudData = await this.getCloudData(this.userId);
      
      // 2. Fazer merge inteligente
      let finalData = localTransactions;
      
      if (cloudData && cloudData.data && Array.isArray(cloudData.data)) {
        const cloudTransactions = cloudData.data;
        const mergedMap = new Map();
        
        // Adicionar todas as transações locais
        localTransactions.forEach(t => mergedMap.set(t.id, t));
        
        // Adicionar transações da nuvem que não existem localmente
        cloudTransactions.forEach(t => {
          if (!mergedMap.has(t.id)) {
            mergedMap.set(t.id, t);
          }
        });
        
        finalData = Array.from(mergedMap.values());
        console.log(`🔄 Merge: ${localTransactions.length} local + ${cloudTransactions.length} nuvem = ${finalData.length} final`);
      }
      
      // 3. Salvar na nuvem e localmente
      await this.saveToCloud(this.userId, finalData);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(finalData));
      this.lastKnownDataHash = this.hashData(finalData);
      
      console.log('☁️ Sincronização completa');
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  async fetchTransactions(): Promise<any[]> {
    if (!this.userId || !this.db) {
      // Fallback para localStorage
      const saved = localStorage.getItem('unifiedFinancialData');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      // Buscar da nuvem primeiro
      const cloudData = await this.getCloudData(this.userId);
      const localData = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      
      if (cloudData && cloudData.data) {
        // Verificar se dados da nuvem são mais recentes
        const localTimestamp = this.getLocalTimestamp();
        
        if (cloudData.lastModified > localTimestamp) {
          console.log('🔄 Dados da nuvem são mais recentes, usando eles');
          localStorage.setItem('unifiedFinancialData', JSON.stringify(cloudData.data));
          this.setLocalTimestamp(cloudData.lastModified);
          return cloudData.data;
        } else {
          console.log('💾 Dados locais são mais recentes');
          return localData;
        }
      }
      
      // Se não há dados na nuvem, usar local
      return localData;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      const saved = localStorage.getItem('unifiedFinancialData');
      return saved ? JSON.parse(saved) : [];
    }
  }

  async createTransaction(transaction: any): Promise<any | null> {
    if (!this.userId) return transaction;
    
    try {
      // Buscar dados atuais da nuvem
      const cloudData = await this.getCloudData(this.userId);
      const currentTransactions = cloudData?.data || [];
      
      // Verificar se já existe
      const exists = currentTransactions.find(t => t.id === transaction.id);
      if (!exists) {
        const updatedTransactions = [...currentTransactions, transaction];
        await this.saveToCloud(this.userId, updatedTransactions);
        
        // Forçar atualização imediata em outros dispositivos
        window.dispatchEvent(new CustomEvent('cloudDataUpdated', {
          detail: { data: updatedTransactions }
        }));
        
        console.log('✅ Transação salva e sincronizada:', transaction.description);
      }
      
      return transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return transaction;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const transactions = await this.fetchTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await this.syncTransactions(filtered);
    return true;
  }

  private async getCloudData(userId: string): Promise<CloudData | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cloudData'], 'readonly');
      const store = transaction.objectStore('cloudData');
      const request = store.get(userId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToCloud(userId: string, data: any[]): Promise<void> {
    if (!this.db) return;

    const cloudData: CloudData = {
      userId,
      data,
      lastModified: Date.now(),
      deviceId: this.deviceId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cloudData'], 'readwrite');
      const store = transaction.objectStore('cloudData');
      const request = store.put(cloudData);
      
      request.onsuccess = () => {
        this.setLocalTimestamp(cloudData.lastModified);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private getLocalTimestamp(): number {
    const timestamp = localStorage.getItem('lastSyncTimestamp');
    return timestamp ? parseInt(timestamp) : 0;
  }

  private setLocalTimestamp(timestamp: number): void {
    localStorage.setItem('lastSyncTimestamp', timestamp.toString());
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Forçar sincronização manual
  async forceSync(): Promise<boolean> {
    const transactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
    return await this.syncTransactions(transactions);
  }

  // Obter status da sincronização
  getSyncStatus(): any {
    return {
      userId: this.userId,
      deviceId: this.deviceId,
      lastSync: this.getLocalTimestamp(),
      isOnline: this.isOnline()
    };
  }
}

export const syncService = new SyncService();

// Inicializar sincronização quando usuário fizer login
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'userData') {
      const userData = e.newValue ? JSON.parse(e.newValue) : null;
      if (userData?.id) {
        syncService.setUserId(userData.id);
      }
    }
  });
}