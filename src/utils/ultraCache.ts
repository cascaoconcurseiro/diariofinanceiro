// Cache ultra-rápido com IndexedDB
class UltraCache {
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, any>();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DiarioFinanceiroCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  // Cache em memória (mais rápido)
  setMemory(key: string, data: any): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }

  getMemory(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    // Cache válido por 5 minutos
    if (Date.now() - cached.timestamp > 300000) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Cache persistente (IndexedDB)
  async set(key: string, data: any): Promise<void> {
    this.setMemory(key, data);
    
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    store.put({ key, data, timestamp: Date.now() });
  }

  async get(key: string): Promise<any | null> {
    // Tentar memória primeiro
    const memoryData = this.getMemory(key);
    if (memoryData) return memoryData;
    
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < 3600000) { // 1 hora
          this.setMemory(key, result.data);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }
}

export const ultraCache = new UltraCache();