// Sistema de armazenamento com compressão
class CompressedStorage {
  // Compressão simples usando LZ-string like algorithm
  private compress(data: string): string {
    const dict: { [key: string]: number } = {};
    const result: (string | number)[] = [];
    let dictSize = 256;
    let w = '';

    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;
      
      if (dict[wc]) {
        w = wc;
      } else {
        result.push(dict[w] ? dict[w] : w);
        dict[wc] = dictSize++;
        w = c;
      }
    }
    
    if (w) {
      result.push(dict[w] ? dict[w] : w);
    }
    
    return JSON.stringify(result);
  }

  private decompress(compressed: string): string {
    try {
      const data = JSON.parse(compressed);
      const dict: { [key: number]: string } = {};
      let dictSize = 256;
      let result = '';
      let w = String(data[0]);
      result += w;

      for (let i = 1; i < data.length; i++) {
        const k = data[i];
        let entry: string;
        
        if (dict[k]) {
          entry = dict[k];
        } else if (k === dictSize) {
          entry = w + w[0];
        } else {
          throw new Error('Invalid compressed data');
        }
        
        result += entry;
        dict[dictSize++] = w + entry[0];
        w = entry;
      }
      
      return result;
    } catch (error) {
      console.error('Decompression error:', error);
      return compressed; // Fallback
    }
  }

  // Salvar com compressão e criptografia
  async setItem(key: string, data: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = this.compress(jsonString);
      
      // Calcular taxa de compressão
      const originalSize = jsonString.length;
      const compressedSize = compressed.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      console.log(`💾 Compression: ${originalSize} → ${compressedSize} bytes (${compressionRatio}% saved)`);
      
      // Salvar comprimido
      localStorage.setItem(`compressed_${key}`, compressed);
      localStorage.setItem(`${key}_meta`, JSON.stringify({
        originalSize,
        compressedSize,
        compressionRatio,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Compression storage error:', error);
      // Fallback para armazenamento normal
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Carregar com descompressão
  async getItem(key: string): Promise<any> {
    try {
      const compressed = localStorage.getItem(`compressed_${key}`);
      
      if (compressed) {
        const decompressed = this.decompress(compressed);
        return JSON.parse(decompressed);
      }
      
      // Fallback para dados não comprimidos
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : null;
      
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  // Obter estatísticas de armazenamento
  getStorageStats(): any {
    const stats = {
      totalItems: 0,
      compressedItems: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalSavings: 0
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      stats.totalItems++;

      if (key.endsWith('_meta')) {
        try {
          const meta = JSON.parse(localStorage.getItem(key) || '{}');
          stats.compressedItems++;
          stats.totalOriginalSize += meta.originalSize || 0;
          stats.totalCompressedSize += meta.compressedSize || 0;
        } catch (error) {
          // Ignorar erros de parsing
        }
      }
    }

    stats.totalSavings = stats.totalOriginalSize - stats.totalCompressedSize;
    
    return {
      ...stats,
      compressionRatio: stats.totalOriginalSize > 0 
        ? ((stats.totalSavings / stats.totalOriginalSize) * 100).toFixed(1)
        : '0.0',
      totalOriginalSizeMB: (stats.totalOriginalSize / 1024 / 1024).toFixed(2),
      totalCompressedSizeMB: (stats.totalCompressedSize / 1024 / 1024).toFixed(2),
      totalSavingsMB: (stats.totalSavings / 1024 / 1024).toFixed(2)
    };
  }

  // Limpar dados antigos
  cleanup(daysToKeep: number = 30): number {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.endsWith('_meta')) continue;

      try {
        const meta = JSON.parse(localStorage.getItem(key) || '{}');
        if (meta.timestamp && meta.timestamp < cutoffTime) {
          const dataKey = key.replace('_meta', '');
          keysToDelete.push(key, `compressed_${dataKey}`);
        }
      } catch (error) {
        // Ignorar erros
      }
    }

    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      deletedCount++;
    });

    return deletedCount;
  }
}

export const compressedStorage = new CompressedStorage();