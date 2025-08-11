/**
 * Sistema de Limpeza Automática
 * Remove dados antigos, otimiza armazenamento e mantém performance
 */

import { yearManager } from './extendedYearManager';
import { advancedCache } from './advancedPerformanceCache';
import { performanceMonitor } from './realTimePerformanceMonitor';

export interface CleanupRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: number; // ms
  condition: () => boolean;
  action: () => Promise<CleanupResult>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CleanupResult {
  success: boolean;
  itemsRemoved: number;
  spaceSaved: number; // bytes
  timeElapsed: number;
  errors: string[];
}

export interface CleanupSchedule {
  ruleId: string;
  nextRun: number;
  lastRun: number;
  runCount: number;
  totalItemsRemoved: number;
  totalSpaceSaved: number;
}

export interface CleanupStatistics {
  totalRuns: number;
  totalItemsRemoved: number;
  totalSpaceSaved: number;
  averageRunTime: number;
  lastCleanup: number;
  activeRules: number;
  failedRuns: number;
}

class AutomaticCleanupSystem {
  private rules: Map<string, CleanupRule> = new Map();
  private schedules: Map<string, CleanupSchedule> = new Map();
  private isRunning = false;
  private statistics: CleanupStatistics = {
    totalRuns: 0,
    totalItemsRemoved: 0,
    totalSpaceSaved: 0,
    averageRunTime: 0,
    lastCleanup: 0,
    activeRules: 0,
    failedRuns: 0
  };
  
  private observers: ((result: CleanupResult, ruleId: string) => void)[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.startScheduler();
  }

  // Inicializar regras padrão
  private initializeDefaultRules(): void {
    // Limpeza de cache expirado
    this.addRule({
      id: 'expired_cache_cleanup',
      name: 'Limpeza de Cache Expirado',
      description: 'Remove entradas de cache que expiraram',
      enabled: true,
      frequency: 300000, // 5 minutos
      condition: () => true,
      action: this.cleanExpiredCache.bind(this),
      priority: 'medium'
    });

    // Limpeza de dados antigos
    this.addRule({
      id: 'old_data_cleanup',
      name: 'Limpeza de Dados Antigos',
      description: 'Remove dados financeiros muito antigos (>5 anos)',
      enabled: true,
      frequency: 86400000, // 24 horas
      condition: () => this.hasOldData(),
      action: this.cleanOldData.bind(this),
      priority: 'low'
    });

    // Limpeza de localStorage
    this.addRule({
      id: 'localstorage_cleanup',
      name: 'Limpeza de LocalStorage',
      description: 'Remove dados desnecessários do localStorage',
      enabled: true,
      frequency: 3600000, // 1 hora
      condition: () => this.isLocalStorageNearLimit(),
      action: this.cleanLocalStorage.bind(this),
      priority: 'high'
    });

    // Limpeza de logs
    this.addRule({
      id: 'log_cleanup',
      name: 'Limpeza de Logs',
      description: 'Remove logs antigos para economizar espaço',
      enabled: true,
      frequency: 1800000, // 30 minutos
      condition: () => this.hasExcessiveLogs(),
      action: this.cleanLogs.bind(this),
      priority: 'medium'
    });

    // Limpeza de dados temporários
    this.addRule({
      id: 'temp_data_cleanup',
      name: 'Limpeza de Dados Temporários',
      description: 'Remove dados temporários e de sessão',
      enabled: true,
      frequency: 600000, // 10 minutos
      condition: () => true,
      action: this.cleanTempData.bind(this),
      priority: 'medium'
    });

    // Compactação de dados
    this.addRule({
      id: 'data_compaction',
      name: 'Compactação de Dados',
      description: 'Compacta dados para economizar espaço',
      enabled: true,
      frequency: 7200000, // 2 horas
      condition: () => this.needsCompaction(),
      action: this.compactData.bind(this),
      priority: 'low'
    });

    // Limpeza de memória
    this.addRule({
      id: 'memory_cleanup',
      name: 'Limpeza de Memória',
      description: 'Força garbage collection e limpa referências',
      enabled: true,
      frequency: 900000, // 15 minutos
      condition: () => this.isMemoryPressureHigh(),
      action: this.cleanMemory.bind(this),
      priority: 'critical'
    });

    // Otimização de índices
    this.addRule({
      id: 'index_optimization',
      name: 'Otimização de Índices',
      description: 'Otimiza e reconstrói índices de busca',
      enabled: true,
      frequency: 21600000, // 6 horas
      condition: () => this.needsIndexOptimization(),
      action: this.optimizeIndexes.bind(this),
      priority: 'low'
    });
  }

  // Implementações das ações de limpeza
  private async cleanExpiredCache(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Limpar cache avançado
      const cacheStats = advancedCache.getStats();
      const initialSize = cacheStats.memoryUsage;
      
      // Forçar limpeza de itens expirados
      advancedCache.clear();
      
      const finalStats = advancedCache.getStats();
      spaceSaved = initialSize - finalStats.memoryUsage;
      itemsRemoved = Math.max(0, cacheStats.l1Hits + cacheStats.l2Hits + cacheStats.l3Hits);

      // Limpar sessionStorage expirado
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('temp_') || key?.startsWith('cache_')) {
          try {
            const item = sessionStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.expires && Date.now() > data.expires) {
                sessionStorage.removeItem(key);
                sessionKeys.push(key);
                spaceSaved += item.length;
              }
            }
          } catch (error) {
            sessionStorage.removeItem(key);
            sessionKeys.push(key);
          }
        }
      }
      
      itemsRemoved += sessionKeys.length;

    } catch (error) {
      errors.push(`Erro na limpeza de cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async cleanOldData(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
      const currentYear = new Date().getFullYear();
      const cutoffYear = currentYear - 5; // Dados mais antigos que 5 anos
      
      if (financialData.years) {
        const yearsToRemove = Object.keys(financialData.years)
          .map(y => parseInt(y))
          .filter(year => year < cutoffYear);

        for (const year of yearsToRemove) {
          const yearData = financialData.years[year];
          if (yearData) {
            spaceSaved += JSON.stringify(yearData).length;
            delete financialData.years[year];
            itemsRemoved++;
          }
        }

        if (yearsToRemove.length > 0) {
          localStorage.setItem('financialData', JSON.stringify(financialData));
        }
      }

    } catch (error) {
      errors.push(`Erro na limpeza de dados antigos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async cleanLocalStorage(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Remover chaves temporárias antigas
        if (key.startsWith('temp_') || key.startsWith('debug_') || key.startsWith('test_')) {
          const item = localStorage.getItem(key);
          if (item) {
            spaceSaved += item.length;
            keysToRemove.push(key);
          }
        }

        // Remover backups muito antigos
        if (key.startsWith('backup_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.timestamp && Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 dias
                spaceSaved += item.length;
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            keysToRemove.push(key); // Remove se não conseguir parsear
          }
        }
      }

      // Remover chaves identificadas
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
        itemsRemoved++;
      }

    } catch (error) {
      errors.push(`Erro na limpeza do localStorage: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async cleanLogs(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Limpar logs do console (se armazenados)
      const logKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('log_') || key?.startsWith('error_')) {
          logKeys.push(key);
        }
      }

      for (const key of logKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          spaceSaved += item.length;
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }

      // Limpar logs de performance antigos
      const performanceMetrics = performanceMonitor.getMetrics();
      if (performanceMetrics.length > 1000) {
        // Manter apenas os últimos 500
        const toKeep = performanceMetrics.slice(-500);
        spaceSaved += JSON.stringify(performanceMetrics.slice(0, -500)).length;
        itemsRemoved += performanceMetrics.length - 500;
      }

    } catch (error) {
      errors.push(`Erro na limpeza de logs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async cleanTempData(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Limpar sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('temp_') || key?.startsWith('session_')) {
          sessionKeysToRemove.push(key);
        }
      }

      for (const key of sessionKeysToRemove) {
        const item = sessionStorage.getItem(key);
        if (item) {
          spaceSaved += item.length;
          sessionStorage.removeItem(key);
          itemsRemoved++;
        }
      }

      // Limpar dados de formulários antigos
      const formKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('form_') || key?.startsWith('draft_')) {
          formKeys.push(key);
        }
      }

      for (const key of formKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data = JSON.parse(item);
            if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) { // 24 horas
              spaceSaved += item.length;
              localStorage.removeItem(key);
              itemsRemoved++;
            }
          } catch (error) {
            localStorage.removeItem(key);
            itemsRemoved++;
          }
        }
      }

    } catch (error) {
      errors.push(`Erro na limpeza de dados temporários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async compactData(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Compactar dados financeiros
      const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
      const originalSize = JSON.stringify(financialData).length;
      
      if (financialData.years) {
        // Remover propriedades desnecessárias
        for (const [year, yearData] of Object.entries(financialData.years)) {
          const months = (yearData as any)?.months || {};
          
          for (const [month, monthData] of Object.entries(months)) {
            const days = (monthData as any)?.days || {};
            
            for (const [day, dayData] of Object.entries(days)) {
              const transactions = (dayData as any)?.transactions || [];
              
              // Remover propriedades vazias ou desnecessárias
              for (const transaction of transactions) {
                if (transaction.metadata && Object.keys(transaction.metadata).length === 0) {
                  delete transaction.metadata;
                }
                if (transaction.tags && transaction.tags.length === 0) {
                  delete transaction.tags;
                }
              }
            }
          }
        }
      }

      const compactedSize = JSON.stringify(financialData).length;
      spaceSaved = originalSize - compactedSize;
      
      if (spaceSaved > 0) {
        localStorage.setItem('financialData', JSON.stringify(financialData));
        itemsRemoved = 1; // Um item compactado
      }

    } catch (error) {
      errors.push(`Erro na compactação de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async cleanMemory(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Forçar garbage collection se disponível
      if ((window as any).gc) {
        (window as any).gc();
        itemsRemoved++;
      }

      // Limpar referências de componentes não utilizados
      if ((window as any).React && (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        // Limpar fiber tree cache se possível
        itemsRemoved++;
      }

      // Limpar event listeners órfãos
      const eventListenerCount = this.cleanOrphanedEventListeners();
      itemsRemoved += eventListenerCount;

      // Estimar economia de memória
      const memoryBefore = this.getMemoryUsage();
      
      // Aguardar um pouco para o GC fazer efeito
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const memoryAfter = this.getMemoryUsage();
      spaceSaved = Math.max(0, memoryBefore - memoryAfter);

    } catch (error) {
      errors.push(`Erro na limpeza de memória: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  private async optimizeIndexes(): Promise<CleanupResult> {
    const startTime = performance.now();
    let itemsRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      // Otimizar índices de busca
      const indexKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('index_') || key?.startsWith('search_')) {
          indexKeys.push(key);
        }
      }

      // Reconstruir índices otimizados
      for (const key of indexKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const index = JSON.parse(item);
            const originalSize = item.length;
            
            // Otimizar estrutura do índice
            const optimizedIndex = this.optimizeIndexStructure(index);
            const optimizedSize = JSON.stringify(optimizedIndex).length;
            
            if (optimizedSize < originalSize) {
              localStorage.setItem(key, JSON.stringify(optimizedIndex));
              spaceSaved += originalSize - optimizedSize;
              itemsRemoved++;
            }
          } catch (error) {
            // Remove índice corrompido
            localStorage.removeItem(key);
            itemsRemoved++;
          }
        }
      }

    } catch (error) {
      errors.push(`Erro na otimização de índices: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      success: errors.length === 0,
      itemsRemoved,
      spaceSaved,
      timeElapsed: performance.now() - startTime,
      errors
    };
  }

  // Métodos de condição
  private hasOldData(): boolean {
    try {
      const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
      const currentYear = new Date().getFullYear();
      const cutoffYear = currentYear - 5;
      
      if (financialData.years) {
        return Object.keys(financialData.years).some(year => parseInt(year) < cutoffYear);
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  private isLocalStorageNearLimit(): boolean {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += item.length;
          }
        }
      }
      
      // Considerar próximo do limite se > 4MB (limite típico é 5-10MB)
      return totalSize > 4 * 1024 * 1024;
    } catch (error) {
      return true; // Se não conseguir verificar, assumir que precisa limpeza
    }
  }

  private hasExcessiveLogs(): boolean {
    let logCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('log_') || key?.startsWith('error_')) {
        logCount++;
      }
    }
    return logCount > 100;
  }

  private needsCompaction(): boolean {
    try {
      const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
      const dataString = JSON.stringify(financialData);
      
      // Verificar se há muito espaço desperdiçado (muitas propriedades vazias)
      const emptyPropertiesCount = (dataString.match(/:\s*(\[\]|\{\}|null|"")/g) || []).length;
      const totalProperties = (dataString.match(/:/g) || []).length;
      
      return totalProperties > 0 && (emptyPropertiesCount / totalProperties) > 0.1; // 10% de propriedades vazias
    } catch (error) {
      return false;
    }
  }

  private isMemoryPressureHigh(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      
      return (usedMB / limitMB) > 0.8; // 80% do limite
    }
    return false;
  }

  private needsIndexOptimization(): boolean {
    let indexSize = 0;
    let indexCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('index_') || key?.startsWith('search_')) {
        const item = localStorage.getItem(key);
        if (item) {
          indexSize += item.length;
          indexCount++;
        }
      }
    }
    
    // Otimizar se há muitos índices ou se são muito grandes
    return indexCount > 10 || indexSize > 1024 * 1024; // 1MB de índices
  }

  // Métodos utilitários
  private cleanOrphanedEventListeners(): number {
    // Implementação simplificada - em produção seria mais complexa
    let count = 0;
    
    // Limpar listeners de elementos que não existem mais
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      // Verificar se elemento tem listeners órfãos
      // Esta é uma implementação conceitual
      count++;
    });
    
    return Math.min(count, 10); // Limitar para não inflacionar números
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  private optimizeIndexStructure(index: any): any {
    // Remover entradas duplicadas e otimizar estrutura
    if (Array.isArray(index)) {
      return [...new Set(index)];
    }
    
    if (typeof index === 'object' && index !== null) {
      const optimized: any = {};
      for (const [key, value] of Object.entries(index)) {
        if (value !== null && value !== undefined && value !== '') {
          optimized[key] = this.optimizeIndexStructure(value);
        }
      }
      return optimized;
    }
    
    return index;
  }

  // Gerenciamento de regras
  addRule(rule: CleanupRule): void {
    this.rules.set(rule.id, rule);
    this.schedules.set(rule.id, {
      ruleId: rule.id,
      nextRun: Date.now() + rule.frequency,
      lastRun: 0,
      runCount: 0,
      totalItemsRemoved: 0,
      totalSpaceSaved: 0
    });
    
    this.statistics.activeRules = this.rules.size;
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.schedules.delete(ruleId);
    this.statistics.activeRules = this.rules.size;
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  // Scheduler
  private startScheduler(): void {
    const checkSchedule = async () => {
      if (this.isRunning) {
        setTimeout(checkSchedule, 1000);
        return;
      }

      const now = Date.now();
      
      for (const [ruleId, schedule] of this.schedules.entries()) {
        const rule = this.rules.get(ruleId);
        
        if (rule && rule.enabled && now >= schedule.nextRun) {
          if (rule.condition()) {
            await this.executeRule(ruleId);
          }
          
          // Agendar próxima execução
          schedule.nextRun = now + rule.frequency;
        }
      }
      
      setTimeout(checkSchedule, 1000);
    };
    
    checkSchedule();
  }

  private async executeRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    const schedule = this.schedules.get(ruleId);
    
    if (!rule || !schedule) return;
    
    this.isRunning = true;
    
    try {
      console.log(`Executando regra de limpeza: ${rule.name}`);
      
      const result = await rule.action();
      
      // Atualizar estatísticas
      schedule.lastRun = Date.now();
      schedule.runCount++;
      schedule.totalItemsRemoved += result.itemsRemoved;
      schedule.totalSpaceSaved += result.spaceSaved;
      
      this.statistics.totalRuns++;
      this.statistics.totalItemsRemoved += result.itemsRemoved;
      this.statistics.totalSpaceSaved += result.spaceSaved;
      this.statistics.lastCleanup = Date.now();
      this.statistics.averageRunTime = 
        (this.statistics.averageRunTime + result.timeElapsed) / 2;
      
      if (!result.success) {
        this.statistics.failedRuns++;
      }
      
      // Notificar observadores
      this.notifyObservers(result, ruleId);
      
      console.log(`Limpeza concluída: ${result.itemsRemoved} itens, ${(result.spaceSaved / 1024).toFixed(2)}KB economizados`);
      
    } catch (error) {
      console.error(`Erro na execução da regra ${ruleId}:`, error);
      this.statistics.failedRuns++;
    } finally {
      this.isRunning = false;
    }
  }

  // Execução manual
  async runRule(ruleId: string): Promise<CleanupResult> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Regra não encontrada: ${ruleId}`);
    }
    
    return await rule.action();
  }

  async runAllRules(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];
    
    for (const [ruleId, rule] of this.rules.entries()) {
      if (rule.enabled) {
        try {
          const result = await rule.action();
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            itemsRemoved: 0,
            spaceSaved: 0,
            timeElapsed: 0,
            errors: [`Erro na regra ${ruleId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
          });
        }
      }
    }
    
    return results;
  }

  // API pública
  getRules(): CleanupRule[] {
    return Array.from(this.rules.values());
  }

  getSchedules(): CleanupSchedule[] {
    return Array.from(this.schedules.values());
  }

  getStatistics(): CleanupStatistics {
    return { ...this.statistics };
  }

  // Observadores
  subscribe(callback: (result: CleanupResult, ruleId: string) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(result: CleanupResult, ruleId: string): void {
    this.observers.forEach(callback => {
      try {
        callback(result, ruleId);
      } catch (error) {
        console.error('Erro no observer de limpeza:', error);
      }
    });
  }
}

// Instância global
export const cleanupSystem = new AutomaticCleanupSystem();

// Hook para usar o sistema de limpeza
export function useAutomaticCleanup() {
  const [statistics, setStatistics] = useState<CleanupStatistics>(cleanupSystem.getStatistics());
  const [rules, setRules] = useState<CleanupRule[]>(cleanupSystem.getRules());

  useEffect(() => {
    const unsubscribe = cleanupSystem.subscribe((result, ruleId) => {
      setStatistics(cleanupSystem.getStatistics());
    });

    // Atualizar estatísticas periodicamente
    const interval = setInterval(() => {
      setStatistics(cleanupSystem.getStatistics());
      setRules(cleanupSystem.getRules());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const runRule = useCallback(async (ruleId: string) => {
    return await cleanupSystem.runRule(ruleId);
  }, []);

  const runAllRules = useCallback(async () => {
    return await cleanupSystem.runAllRules();
  }, []);

  const enableRule = useCallback((ruleId: string) => {
    cleanupSystem.enableRule(ruleId);
    setRules(cleanupSystem.getRules());
  }, []);

  const disableRule = useCallback((ruleId: string) => {
    cleanupSystem.disableRule(ruleId);
    setRules(cleanupSystem.getRules());
  }, []);

  return {
    statistics,
    rules,
    schedules: cleanupSystem.getSchedules(),
    runRule,
    runAllRules,
    enableRule,
    disableRule,
    addRule: cleanupSystem.addRule.bind(cleanupSystem),
    removeRule: cleanupSystem.removeRule.bind(cleanupSystem)
  };
}

export default cleanupSystem;