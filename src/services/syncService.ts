/**
 * SERVIÇO DE SINCRONIZAÇÃO INTELIGENTE
 * 
 * Detecta automaticamente se há backend disponível
 * e sincroniza dados entre dispositivos
 */

interface SyncConfig {
  apiUrl?: string;
  enableSync: boolean;
  fallbackToLocal: boolean;
}

interface SyncData {
  transactions: any[];
  recurringTransactions: any[];
  lastSync: string;
  deviceId: string;
}

class SyncService {
  private config: SyncConfig;
  private deviceId: string;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL,
      enableSync: !!import.meta.env.VITE_API_URL,
      fallbackToLocal: true
    };

    // Detectar mudanças de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    console.log('🔄 SYNC: Service initialized', {
      enableSync: this.config.enableSync,
      apiUrl: this.config.apiUrl,
      deviceId: this.deviceId
    });
  }

  /**
   * Gera ou recupera ID único do dispositivo
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Verifica se o backend está disponível
   */
  async checkBackendAvailability(): Promise<boolean> {
    if (!this.config.apiUrl || !this.isOnline) return false;

    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('🔄 SYNC: Backend not available, using local storage');
      return false;
    }
  }

  /**
   * Salva dados localmente
   */
  saveLocal(key: string, data: any): void {
    try {
      const syncData = {
        data,
        lastModified: new Date().toISOString(),
        deviceId: this.deviceId,
        synced: false
      };
      localStorage.setItem(key, JSON.stringify(syncData));
      console.log(`💾 SYNC: Saved locally: ${key}`);

      // Tentar sincronizar se possível
      if (this.config.enableSync && this.isOnline) {
        this.syncToCloud(key, data);
      }
    } catch (error) {
      console.error('❌ SYNC: Error saving locally:', error);
    }
  }

  /**
   * Carrega dados (local ou nuvem)
   */
  async loadData(key: string): Promise<any> {
    // Tentar carregar da nuvem primeiro
    if (this.config.enableSync && this.isOnline) {
      const cloudData = await this.loadFromCloud(key);
      if (cloudData) {
        // Salvar localmente como backup
        localStorage.setItem(key, JSON.stringify({
          data: cloudData,
          lastModified: new Date().toISOString(),
          deviceId: this.deviceId,
          synced: true
        }));
        return cloudData;
      }
    }

    // Fallback para dados locais
    try {
      const localData = localStorage.getItem(key);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log(`📱 SYNC: Loaded from local: ${key}`);
        return parsed.data || parsed;
      }
    } catch (error) {
      console.error('❌ SYNC: Error loading local data:', error);
    }

    return null;
  }

  /**
   * Sincroniza dados para a nuvem
   */
  private async syncToCloud(key: string, data: any): Promise<boolean> {
    if (!this.config.apiUrl) return false;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.config.apiUrl}/sync/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          data,
          deviceId: this.deviceId,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`☁️ SYNC: Synced to cloud: ${key}`);
        // Marcar como sincronizado
        const localData = localStorage.getItem(key);
        if (localData) {
          const parsed = JSON.parse(localData);
          parsed.synced = true;
          localStorage.setItem(key, JSON.stringify(parsed));
        }
        return true;
      }
    } catch (error) {
      console.warn('⚠️ SYNC: Failed to sync to cloud:', error);
    }

    return false;
  }

  /**
   * Carrega dados da nuvem
   */
  private async loadFromCloud(key: string): Promise<any> {
    if (!this.config.apiUrl) return null;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.config.apiUrl}/sync/${key}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`☁️ SYNC: Loaded from cloud: ${key}`);
        return result.data;
      }
    } catch (error) {
      console.warn('⚠️ SYNC: Failed to load from cloud:', error);
    }

    return null;
  }

  /**
   * Sincroniza quando volta online
   */
  private async syncWhenOnline(): Promise<void> {
    if (!this.config.enableSync) return;

    console.log('🔄 SYNC: Device back online, syncing...');

    // Sincronizar dados não sincronizados
    const keys = ['unifiedFinancialData', 'recurringTransactions'];
    
    for (const key of keys) {
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (!parsed.synced) {
            await this.syncToCloud(key, parsed.data || parsed);
          }
        } catch (error) {
          console.error(`❌ SYNC: Error syncing ${key}:`, error);
        }
      }
    }
  }

  /**
   * Força sincronização completa
   */
  async forcSync(): Promise<void> {
    if (!this.config.enableSync || !this.isOnline) {
      console.log('🔄 SYNC: Cannot sync - offline or disabled');
      return;
    }

    console.log('🔄 SYNC: Force sync started...');
    await this.syncWhenOnline();
  }

  /**
   * Obtém status da sincronização
   */
  getSyncStatus(): { enabled: boolean; online: boolean; lastSync?: string } {
    const lastSync = localStorage.getItem('lastSyncTime');
    return {
      enabled: this.config.enableSync,
      online: this.isOnline,
      lastSync: lastSync || undefined
    };
  }
}

// Instância global
export const syncService = new SyncService();

// Hook para React
export const useSyncService = () => {
  return {
    saveData: (key: string, data: any) => syncService.saveLocal(key, data),
    loadData: (key: string) => syncService.loadData(key),
    forcSync: () => syncService.forcSync(),
    getSyncStatus: () => syncService.getSyncStatus()
  };
};