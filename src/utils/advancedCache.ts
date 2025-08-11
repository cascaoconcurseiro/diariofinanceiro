/**
 * SISTEMA DE CACHE AVANÇADO - OTIMIZAÇÃO DE PERFORMANCE
 * 
 * Cache multi-nível com estratégias LRU, LFU e FIFO
 * Otimizado para cálculos financeiros e dados de anos
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  ttl: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  oldestEntry: Date;
  newestEntry: Date;
}

export interface CacheConfig {
  maxSize: number;
  maxEntries: number;
  defaultTtl: number;
  strategy: 'LRU' | 'LFU' | 'FIFO';
  cleanupInterval: number;
}

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB
      maxEntries: config.maxEntries || 1000,
      defaultTtl: config.defaultTtl || 30 * 60 * 1000, // 30 minutos
      strategy: config.strategy || 'LRU',
      cleanupInterval: config.cleanupInterval || 5 * 60 * 1000 // 5 minutos
    };

    this.startCleanupTimer();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.stats.hits++;

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const size = this.calculateSize(value);
    const now = new Date();
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: ttl || this.config.defaultTtl,
      size
    };

    // Remover entrada existente se houver
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }

    // Verificar limites e fazer eviction se necessário
    this.ensureCapacity(size);

    this.cache.set(key, entry);
    this.stats.totalSize += size;
  }

  invalidate(pattern: string): number {
    const regex = new RegExp(pattern);
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        removed++;
      }
    }

    return removed;
  }

  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictions: this.stats.evictions,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : new Date(),
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : new Date()
    };
  }

  // Métodos específicos para dados financeiros
  cacheFinancialData(year: number, month: number, data: T, ttl?: number): void {
    const key = `financial_${year}_${month}`;
    this.set(key, data, ttl);
  }

  getFinancialData(year: number, month: number): T | null {
    const key = `financial_${year}_${month}`;
    return this.get(key);
  }

  cacheCalculation(calculationType: string, params: any, result: T): void {
    const key = `calc_${calculationType}_${JSON.stringify(params)}`;
    this.set(key, result, 10 * 60 * 1000); // 10 minutos para cálculos
  }

  getCalculation(calculationType: string, params: any): T | null {
    const key = `calc_${calculationType}_${JSON.stringify(params)}`;
    return this.get(key);
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp.getTime() > entry.ttl;
  }

  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Aproximação em bytes
    } catch {
      return 1024; // Fallback
    }
  }

  private ensureCapacity(newEntrySize: number): void {
    // Verificar se precisa fazer eviction
    while (
      (this.stats.totalSize + newEntrySize > this.config.maxSize) ||
      (this.cache.size >= this.config.maxEntries)
    ) {
      this.evictEntry();
    }
  }

  private evictEntry(): void {
    if (this.cache.size === 0) return;

    let entryToEvict: [string, CacheEntry<T>] | null = null;

    switch (this.config.strategy) {
      case 'LRU':
        entryToEvict = this.findLRUEntry();
        break;
      case 'LFU':
        entryToEvict = this.findLFUEntry();
        break;
      case 'FIFO':
        entryToEvict = this.findFIFOEntry();
        break;
    }

    if (entryToEvict) {
      const [key, entry] = entryToEvict;
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
    }
  }

  private findLRUEntry(): [string, CacheEntry<T>] | null {
    let oldest: [string, CacheEntry<T>] | null = null;
    let oldestTime = Date.now();

    for (const entry of this.cache.entries()) {
      const lastAccessed = entry[1].lastAccessed.getTime();
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldest = entry;
      }
    }

    return oldest;
  }

  private findLFUEntry(): [string, CacheEntry<T>] | null {
    let leastUsed: [string, CacheEntry<T>] | null = null;
    let lowestCount = Infinity;

    for (const entry of this.cache.entries()) {
      if (entry[1].accessCount < lowestCount) {
        lowestCount = entry[1].accessCount;
        leastUsed = entry;
      }
    }

    return leastUsed;
  }

  private findFIFOEntry(): [string, CacheEntry<T>] | null {
    let oldest: [string, CacheEntry<T>] | null = null;
    let oldestTime = Date.now();

    for (const entry of this.cache.entries()) {
      const timestamp = entry[1].timestamp.getTime();
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldest = entry;
      }
    }

    return oldest;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
      }
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache cleanup: Removed ${expiredKeys.length} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Cache global para o sistema financeiro
export const financialCache = new AdvancedCache({
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 2000,
  defaultTtl: 60 * 60 * 1000, // 1 hora
  strategy: 'LRU',
  cleanupInterval: 10 * 60 * 1000 // 10 minutos
});

// Cache para cálculos rápidos
export const calculationCache = new AdvancedCache({
  maxSize: 20 * 1024 * 1024, // 20MB
  maxEntries: 500,
  defaultTtl: 15 * 60 * 1000, // 15 minutos
  strategy: 'LFU',
  cleanupInterval: 5 * 60 * 1000 // 5 minutos
});

console.log('🚀 Sistema de Cache Avançado inicializado com sucesso!');