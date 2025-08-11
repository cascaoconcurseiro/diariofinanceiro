/**
 * Sistema de Cache Avançado Multi-Nível
 * Implementa cache L1 (memória), L2 (localStorage) e L3 (IndexedDB)
 * com estratégias inteligentes de invalidação e compressão
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  compressed?: boolean;
  size: number;
}

interface CacheStats {
  l1Hits: number;
  l2Hits: number;
  l3Hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
}

class AdvancedPerformanceCache {
  private l1Cache = new Map<string, CacheEntry<any>>();
  private l2Cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryUsage: 0
  };

  private readonly L1_MAX_SIZE = 50; // Itens em memória
  private readonly L2_MAX_SIZE = 200; // Itens no localStorage
  private readonly L3_MAX_SIZE = 1000; // Itens no IndexedDB
  private readonly COMPRESSION_THRESHOLD = 1024; // Bytes

  constructor() {
    this.loadL2Cache();
    this.initL3Cache();
    this.startCleanupTimer();
  }

  // Cache L1 - Memória (mais rápido)
  async get<T>(key: string): Promise<T | null> {
    this.stats.totalRequests++;
    
    // Tentar L1 primeiro
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && this.isValid(l1Entry)) {
      this.updateAccess(l1Entry);
      this.stats.l1Hits++;
      this.updateHitRate();
      return this.decompress(l1Entry.data);
    }

    // Tentar L2 (localStorage)
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && this.isValid(l2Entry)) {
      this.updateAccess(l2Entry);
      this.promoteToL1(key, l2Entry);
      this.stats.l2Hits++;
      this.updateHitRate();
      return this.decompress(l2Entry.data);
    }

    // Tentar L3 (IndexedDB)
    const l3Data = await this.getFromL3(key);
    if (l3Data) {
      this.promoteToL2(key, l3Data);
      this.stats.l3Hits++;
      this.updateHitRate();
      return this.decompress(l3Data.data);
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    const entry: CacheEntry<T> = {
      data: this.compress(data),
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      compressed: this.shouldCompress(data),
      size: this.calculateSize(data)
    };

    // Sempre armazenar em L1
    this.setL1(key, entry);
    
    // Armazenar em L2 se for importante
    if (ttl > 60000) {
      this.setL2(key, entry);
    }

    // Armazenar em L3 se for muito importante
    if (ttl > 300000) {
      await this.setL3(key, entry);
    }

    this.updateMemoryUsage();
  }

  // Invalidação inteligente por padrões
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    // L1
    for (const key of this.l1Cache.keys()) {
      if (regex.test(key)) {
        this.l1Cache.delete(key);
      }
    }

    // L2
    for (const key of this.l2Cache.keys()) {
      if (regex.test(key)) {
        this.l2Cache.delete(key);
        localStorage.removeItem(`cache_${key}`);
      }
    }

    // L3 - async
    this.invalidateL3Pattern(pattern);
    this.updateMemoryUsage();
  }

  // Pré-carregamento inteligente
  async preload(keys: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 10 : 50;
    
    for (const key of keys) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Verificar se já existe
      const exists = await this.get(key);
      if (!exists) {
        // Marcar para carregamento futuro
        this.markForPreload(key);
      }
    }
  }

  // Compressão automática
  private compress<T>(data: T): T | string {
    if (!this.shouldCompress(data)) return data;
    
    try {
      const json = JSON.stringify(data);
      // Simulação de compressão (em produção usar LZ-string ou similar)
      return btoa(json);
    } catch {
      return data;
    }
  }

  private decompress<T>(data: T | string): T {
    if (typeof data !== 'string') return data;
    
    try {
      const json = atob(data as string);
      return JSON.parse(json);
    } catch {
      return data as T;
    }
  }

  private shouldCompress<T>(data: T): boolean {
    const size = this.calculateSize(data);
    return size > this.COMPRESSION_THRESHOLD;
  }

  private calculateSize<T>(data: T): number {
    return JSON.stringify(data).length * 2; // Aproximação em bytes
  }

  // Gerenciamento L1
  private setL1<T>(key: string, entry: CacheEntry<T>): void {
    if (this.l1Cache.size >= this.L1_MAX_SIZE) {
      this.evictL1();
    }
    this.l1Cache.set(key, entry);
  }

  private evictL1(): void {
    // LRU eviction
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // Gerenciamento L2
  private loadL2Cache(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          const cacheKey = key.substring(6);
          const data = localStorage.getItem(key);
          if (data) {
            const entry = JSON.parse(data);
            if (this.isValid(entry)) {
              this.l2Cache.set(cacheKey, entry);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar L2 cache:', error);
    }
  }

  private setL2<T>(key: string, entry: CacheEntry<T>): void {
    if (this.l2Cache.size >= this.L2_MAX_SIZE) {
      this.evictL2();
    }
    
    this.l2Cache.set(key, entry);
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      // Storage cheio, fazer limpeza
      this.cleanupL2();
    }
  }

  private evictL2(): void {
    // LFU eviction (Least Frequently Used)
    let leastUsedKey = '';
    let leastCount = Infinity;
    
    for (const [key, entry] of this.l2Cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.l2Cache.delete(leastUsedKey);
      localStorage.removeItem(`cache_${leastUsedKey}`);
      this.stats.evictions++;
    }
  }

  // Gerenciamento L3 (IndexedDB)
  private async initL3Cache(): Promise<void> {
    // Implementação simplificada - em produção usar IndexedDB completo
    if (!('indexedDB' in window)) return;
    
    try {
      // Inicializar IndexedDB para cache L3
      this.l3Available = true;
    } catch (error) {
      console.warn('IndexedDB não disponível:', error);
      this.l3Available = false;
    }
  }

  private l3Available = false;

  private async getFromL3(key: string): Promise<CacheEntry<any> | null> {
    if (!this.l3Available) return null;
    
    try {
      // Implementação simplificada
      const stored = sessionStorage.getItem(`l3_${key}`);
      if (stored) {
        const entry = JSON.parse(stored);
        return this.isValid(entry) ? entry : null;
      }
    } catch (error) {
      console.warn('Erro ao acessar L3:', error);
    }
    
    return null;
  }

  private async setL3<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.l3Available) return;
    
    try {
      sessionStorage.setItem(`l3_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erro ao salvar em L3:', error);
    }
  }

  // Utilitários
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  private updateAccess(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccess = Date.now();
  }

  private promoteToL1(key: string, entry: CacheEntry<any>): void {
    this.setL1(key, { ...entry });
  }

  private promoteToL2(key: string, entry: CacheEntry<any>): void {
    this.setL2(key, { ...entry });
    this.promoteToL1(key, entry);
  }

  private updateHitRate(): void {
    const hits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits;
    this.stats.hitRate = (hits / this.stats.totalRequests) * 100;
  }

  private updateMemoryUsage(): void {
    let usage = 0;
    for (const entry of this.l1Cache.values()) {
      usage += entry.size;
    }
    this.stats.memoryUsage = usage;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Limpeza a cada minuto
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Limpar L1
    for (const [key, entry] of this.l1Cache.entries()) {
      if (!this.isValid(entry)) {
        this.l1Cache.delete(key);
      }
    }

    // Limpar L2
    for (const [key, entry] of this.l2Cache.entries()) {
      if (!this.isValid(entry)) {
        this.l2Cache.delete(key);
        localStorage.removeItem(`cache_${key}`);
      }
    }

    this.updateMemoryUsage();
  }

  private cleanupL2(): void {
    // Remover 25% dos itens menos usados
    const entries = Array.from(this.l2Cache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.l2Cache.delete(key);
      localStorage.removeItem(`cache_${key}`);
    }
  }

  private async invalidateL3Pattern(pattern: string): Promise<void> {
    // Implementação para IndexedDB
    if (!this.l3Available) return;
    
    try {
      const regex = new RegExp(pattern);
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('l3_')) {
          const cacheKey = key.substring(3);
          if (regex.test(cacheKey)) {
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao invalidar L3:', error);
    }
  }

  private markForPreload(key: string): void {
    // Marcar para carregamento futuro quando dados estiverem disponíveis
    const preloadMarkers = JSON.parse(localStorage.getItem('preload_markers') || '[]');
    if (!preloadMarkers.includes(key)) {
      preloadMarkers.push(key);
      localStorage.setItem('preload_markers', JSON.stringify(preloadMarkers));
    }
  }

  // API pública para estatísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Limpeza manual
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    
    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Limpar sessionStorage (L3)
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('l3_')) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Reset stats
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }
}

// Instância global do cache
export const advancedCache = new AdvancedPerformanceCache();

// Hook para usar o cache
export const useAdvancedCache = () => {
  return {
    get: advancedCache.get.bind(advancedCache),
    set: advancedCache.set.bind(advancedCache),
    invalidatePattern: advancedCache.invalidatePattern.bind(advancedCache),
    preload: advancedCache.preload.bind(advancedCache),
    getStats: advancedCache.getStats.bind(advancedCache),
    clear: advancedCache.clear.bind(advancedCache)
  };
};

export default advancedCache;