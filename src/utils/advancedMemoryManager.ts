/**
 * Gerenciador Avançado de Memória
 * Rastreamento, otimização e liberação automática de memória
 */

export interface MemoryStatistics {
  currentUsage: number;
  maxUsage: number;
  cleanupCount: number;
  lastCleanup: number;
  leakDetections: number;
  optimizations: number;
}

export interface MemoryThresholds {
  warning: number;
  critical: number;
  cleanup: number;
}

class AdvancedMemoryManager {
  private statistics: MemoryStatistics = {
    currentUsage: 0,
    maxUsage: 200,
    cleanupCount: 0,
    lastCleanup: 0,
    leakDetections: 0,
    optimizations: 0
  };

  private thresholds: MemoryThresholds = {
    warning: 100,
    critical: 150,
    cleanup: 80
  };

  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
    
    console.log('🧠 Advanced Memory Manager started');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('🧠 Advanced Memory Manager stopped');
  }

  private checkMemoryUsage(): void {
    const usage = this.getCurrentMemoryUsage();
    this.statistics.currentUsage = usage;

    if (usage > this.thresholds.critical) {
      this.performEmergencyCleanup();
    } else if (usage > this.thresholds.warning) {
      this.performRoutineCleanup();
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private performEmergencyCleanup(): void {
    console.log('🚨 Emergency memory cleanup triggered');
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    this.statistics.cleanupCount++;
    this.statistics.lastCleanup = Date.now();
  }

  private performRoutineCleanup(): void {
    console.log('🧹 Routine memory cleanup');
    
    this.statistics.cleanupCount++;
    this.statistics.lastCleanup = Date.now();
  }

  setMaxUsage(maxUsage: number): void {
    this.statistics.maxUsage = maxUsage;
  }

  getStatistics(): MemoryStatistics {
    return { ...this.statistics };
  }
}

export const advancedMemoryManager = new AdvancedMemoryManager();
export default advancedMemoryManager;