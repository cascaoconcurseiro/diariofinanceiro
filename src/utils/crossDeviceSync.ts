/**
 * SISTEMA DE SINCRONIZAÇÃO REAL ENTRE DISPOSITIVOS
 * Baseado em IndexedDB + Cloud Storage simulado
 */

interface SyncData {
  id: string;
  userId: string;
  deviceId: string;
  data: any;
  timestamp: number;
  version: number;
  checksum: string;
}

class CrossDeviceSync {
  private dbName = 'DiarioFinanceiroSync';
  private version = 1;
  private db: IDBDatabase | null = null;
  private deviceId: string;
  private userId: string | null = null;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.init();
  }

  private getOrCreateDeviceId(): string {
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
        
        // Store para dados sincronizados
        if (!db.objectStoreNames.contains('syncData')) {
          const store = db.createObjectStore('syncData', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
        
        // Store para conflitos
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private generateChecksum(data: any): string {
    return btoa(JSON.stringify(data)).substring(0, 16);
  }

  // Salvar dados com versionamento
  async saveData(key: string, data: any): Promise<void> {
    if (!this.db || !this.userId) return;

    const existing = await this.getData(key);
    const version = existing ? existing.version + 1 : 1;
    
    const syncData: SyncData = {
      id: `${this.userId}_${key}`,
      userId: this.userId,
      deviceId: this.deviceId,
      data,
      timestamp: Date.now(),
      version,
      checksum: this.generateChecksum(data)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncData'], 'readwrite');
      const store = transaction.objectStore('syncData');
      const request = store.put(syncData);
      
      request.onsuccess = () => {
        console.log(`✅ Dados salvos: ${key} v${version}`);
        this.broadcastChange(key, data);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar dados mais recentes
  async getData(key: string): Promise<SyncData | null> {
    if (!this.db || !this.userId) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncData'], 'readonly');
      const store = transaction.objectStore('syncData');
      const request = store.get(`${this.userId}_${key}`);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Sincronizar com outros dispositivos (simulado)
  async syncWithCloud(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      // Simular sincronização com nuvem
      const localData = await this.getAllUserData();
      
      // Em produção, aqui faria upload/download da nuvem
      console.log(`🔄 Sincronizando ${localData.length} registros para usuário ${this.userId}`);
      
      // Simular dados da nuvem (em produção viria do servidor)
      const cloudData = this.getSimulatedCloudData();
      
      // Resolver conflitos
      await this.resolveConflicts(localData, cloudData);
      
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  private async getAllUserData(): Promise<SyncData[]> {
    if (!this.db || !this.userId) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncData'], 'readonly');
      const store = transaction.objectStore('syncData');
      const index = store.index('userId');
      const request = index.getAll(this.userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getSimulatedCloudData(): SyncData[] {
    // Simular dados da nuvem (localStorage compartilhado)
    const cloudKey = `cloud_${this.userId}`;
    const saved = localStorage.getItem(cloudKey);
    return saved ? JSON.parse(saved) : [];
  }

  private async resolveConflicts(localData: SyncData[], cloudData: SyncData[]): Promise<void> {
    const conflicts: any[] = [];
    
    // Criar mapa dos dados locais
    const localMap = new Map(localData.map(item => [item.id, item]));
    
    // Verificar conflitos
    for (const cloudItem of cloudData) {
      const localItem = localMap.get(cloudItem.id);
      
      if (localItem) {
        // Verificar se há conflito
        if (localItem.version !== cloudItem.version && 
            localItem.checksum !== cloudItem.checksum) {
          
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            localData: localItem,
            cloudData: cloudItem,
            timestamp: Date.now()
          });
        } else if (cloudItem.version > localItem.version) {
          // Dados da nuvem são mais recentes
          await this.saveData(cloudItem.id.split('_')[1], cloudItem.data);
        }
      } else {
        // Novo item da nuvem
        await this.saveData(cloudItem.id.split('_')[1], cloudItem.data);
      }
    }
    
    // Salvar conflitos para resolução manual
    if (conflicts.length > 0) {
      await this.saveConflicts(conflicts);
      console.warn(`⚠️ ${conflicts.length} conflitos detectados`);
    }
  }

  private async saveConflicts(conflicts: any[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');
    
    for (const conflict of conflicts) {
      store.put(conflict);
    }
  }

  // Broadcast de mudanças para outros dispositivos
  private broadcastChange(key: string, data: any): void {
    // Simular broadcast (localStorage + eventos)
    const changeEvent = {
      type: 'data_change',
      key,
      data,
      deviceId: this.deviceId,
      userId: this.userId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('lastChange', JSON.stringify(changeEvent));
    window.dispatchEvent(new CustomEvent('dataSync', { detail: changeEvent }));
  }

  // Escutar mudanças de outros dispositivos
  onDataChange(callback: (key: string, data: any) => void): void {
    window.addEventListener('dataSync', (event: any) => {
      const change = event.detail;
      
      // Ignorar mudanças do próprio dispositivo
      if (change.deviceId !== this.deviceId && change.userId === this.userId) {
        callback(change.key, change.data);
      }
    });
  }

  // Obter estatísticas de sincronização
  async getSyncStats(): Promise<any> {
    if (!this.db || !this.userId) return null;

    const userData = await this.getAllUserData();
    const conflicts = await this.getConflicts();
    
    return {
      totalRecords: userData.length,
      lastSync: Math.max(...userData.map(d => d.timestamp)),
      conflicts: conflicts.length,
      deviceId: this.deviceId,
      userId: this.userId
    };
  }

  private async getConflicts(): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conflicts'], 'readonly');
      const store = transaction.objectStore('conflicts');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const crossDeviceSync = new CrossDeviceSync();