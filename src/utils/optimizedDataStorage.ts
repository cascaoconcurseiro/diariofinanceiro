/**
 * Sistema de Armazenamento Otimizado
 * Compressão, backup incremental e estratégias eficientes de armazenamento
 */

export interface StorageStatistics {
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  backupCount: number;
  lastBackup: number;
  optimizations: number;
}

export interface CompressionConfig {
  enabled: boolean;
  threshold: number; // bytes
  algorithm: 'gzip' | 'lz' | 'simple';
}

class OptimizedDataStorage {
  private statistics: StorageStatistics = {
    totalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    backupCount: 0,
    lastBackup: 0,
    optimizations: 0
  };

  private compressionConfig: CompressionConfig = {
    enabled: true,
    threshold: 1024, // 1KB
    algorithm: 'simple'
  };

  // Compress data using simple algorithm
  compress(data: string): string {
    if (!this.compressionConfig.enabled || data.length < this.compressionConfig.threshold) {
      return data;
    }

    try {
      // Simple compression: remove extra whitespace and compress JSON
      const compressed = JSON.stringify(JSON.parse(data));
      this.updateCompressionStats(data.length, compressed.length);
      return compressed;
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  // Decompress data
  decompress(data: string): string {
    // For simple compression, no decompression needed
    return data;
  }

  // Create incremental backup
  createIncrementalBackup(key: string, data: any): void {
    try {
      const backupKey = `backup_${key}_${Date.now()}`;
      const compressedData = this.compress(JSON.stringify(data));
      
      localStorage.setItem(backupKey, compressedData);
      
      this.statistics.backupCount++;
      this.statistics.lastBackup = Date.now();
      
      // Keep only last 5 backups
      this.cleanupOldBackups(key);
      
    } catch (error) {
      console.error('Backup creation failed:', error);
    }
  }

  // Cleanup old backups
  private cleanupOldBackups(key: string): void {
    const backupKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(`backup_${key}_`)) {
        backupKeys.push(storageKey);
      }
    }
    
    // Sort by timestamp and keep only last 5
    backupKeys.sort().reverse();
    
    for (let i = 5; i < backupKeys.length; i++) {
      localStorage.removeItem(backupKeys[i]);
    }
  }

  // Update compression statistics
  private updateCompressionStats(originalSize: number, compressedSize: number): void {
    this.statistics.totalSize = originalSize;
    this.statistics.compressedSize = compressedSize;
    this.statistics.compressionRatio = originalSize > 0 ? 
      ((originalSize - compressedSize) / originalSize) * 100 : 0;
  }

  // Optimize storage
  optimizeStorage(): void {
    console.log('🗜️ Optimizing storage...');
    
    // Compress large items in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('backup_')) {
        const item = localStorage.getItem(key);
        if (item && item.length > this.compressionConfig.threshold) {
          const compressed = this.compress(item);
          if (compressed.length < item.length) {
            localStorage.setItem(key, compressed);
          }
        }
      }
    }
    
    this.statistics.optimizations++;
  }

  // Get storage statistics
  getStatistics(): StorageStatistics {
    return { ...this.statistics };
  }

  // Configure compression
  setCompressionConfig(config: Partial<CompressionConfig>): void {
    this.compressionConfig = { ...this.compressionConfig, ...config };
  }
}

export const optimizedDataStorage = new OptimizedDataStorage();
export default optimizedDataStorage;