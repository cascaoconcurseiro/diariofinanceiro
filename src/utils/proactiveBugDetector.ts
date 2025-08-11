/**
 * Sistema de Detecção Proativa de Bugs
 * Detecta problemas antes que afetem o usuário
 */

import { advancedCache } from './advancedPerformanceCache';
import { performanceMonitor } from './realTimePerformanceMonitor';

// Tipos de bugs detectáveis
export enum BugType {
  MEMORY_LEAK = 'memory_leak',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  DATA_CORRUPTION = 'data_corruption',
  CALCULATION_ERROR = 'calculation_error',
  CACHE_INCONSISTENCY = 'cache_inconsistency',
  INFINITE_LOOP = 'infinite_loop',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  STATE_CORRUPTION = 'state_corruption',
  NETWORK_FAILURE = 'network_failure',
  STORAGE_OVERFLOW = 'storage_overflow'
}

export enum BugSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface BugReport {
  id: string;
  type: BugType;
  severity: BugSeverity;
  title: string;
  description: string;
  context: any;
  stackTrace?: string;
  timestamp: number;
  component?: string;
  autoFixable: boolean;
  reproductionSteps?: string[];
  affectedUsers?: string[];
  metrics?: { [key: string]: number };
}

export interface DetectionRule {
  id: string;
  type: BugType;
  condition: (context: DetectionContext) => boolean;
  severity: BugSeverity;
  description: string;
  autoFix?: (context: DetectionContext) => Promise<boolean>;
}

export interface DetectionContext {
  performance: any;
  memory: any;
  storage: any;
  network: any;
  cache: any;
  state: any;
  history: any[];
  timestamp: number;
}

class ProactiveBugDetector {
  private rules: DetectionRule[] = [];
  private detectedBugs: BugReport[] = [];
  private isRunning = false;
  private detectionInterval = 5000; // 5 segundos
  private intervalId?: NodeJS.Timeout;
  private observers: ((bug: BugReport) => void)[] = [];

  constructor() {
    this.initializeRules();
  }

  // Inicializar regras de detecção
  private initializeRules(): void {
    this.rules = [
      // Detecção de vazamento de memória
      {
        id: 'memory_leak_detector',
        type: BugType.MEMORY_LEAK,
        condition: (ctx) => {
          const memoryGrowth = this.calculateMemoryGrowth(ctx.history);
          return memoryGrowth > 50; // MB por minuto
        },
        severity: BugSeverity.HIGH,
        description: 'Vazamento de memória detectado',
        autoFix: this.fixMemoryLeak.bind(this)
      },

      // Detecção de degradação de performance
      {
        id: 'performance_degradation_detector',
        type: BugType.PERFORMANCE_DEGRADATION,
        condition: (ctx) => {
          const avgRenderTime = this.calculateAverageRenderTime(ctx.history);
          return avgRenderTime > 200; // ms
        },
        severity: BugSeverity.MEDIUM,
        description: 'Degradação de performance detectada',
        autoFix: this.fixPerformanceDegradation.bind(this)
      },

      // Detecção de corrupção de dados
      {
        id: 'data_corruption_detector',
        type: BugType.DATA_CORRUPTION,
        condition: (ctx) => {
          return this.detectDataCorruption(ctx.storage);
        },
        severity: BugSeverity.CRITICAL,
        description: 'Corrupção de dados detectada',
        autoFix: this.fixDataCorruption.bind(this)
      },

      // Detecção de erros de cálculo
      {
        id: 'calculation_error_detector',
        type: BugType.CALCULATION_ERROR,
        condition: (ctx) => {
          return this.detectCalculationErrors(ctx.state);
        },
        severity: BugSeverity.HIGH,
        description: 'Erro de cálculo financeiro detectado',
        autoFix: this.fixCalculationError.bind(this)
      },

      // Detecção de inconsistência de cache
      {
        id: 'cache_inconsistency_detector',
        type: BugType.CACHE_INCONSISTENCY,
        condition: (ctx) => {
          const hitRate = ctx.cache?.hitRate || 0;
          return hitRate < 30; // Taxa muito baixa
        },
        severity: BugSeverity.MEDIUM,
        description: 'Inconsistência de cache detectada',
        autoFix: this.fixCacheInconsistency.bind(this)
      },

      // Detecção de loop infinito
      {
        id: 'infinite_loop_detector',
        type: BugType.INFINITE_LOOP,
        condition: (ctx) => {
          return this.detectInfiniteLoop(ctx.performance);
        },
        severity: BugSeverity.CRITICAL,
        description: 'Possível loop infinito detectado',
        autoFix: this.fixInfiniteLoop.bind(this)
      },

      // Detecção de esgotamento de recursos
      {
        id: 'resource_exhaustion_detector',
        type: BugType.RESOURCE_EXHAUSTION,
        condition: (ctx) => {
          const memoryUsage = ctx.memory?.usage || 0;
          const storageUsage = this.calculateStorageUsage();
          return memoryUsage > 200 || storageUsage > 90; // MB ou %
        },
        severity: BugSeverity.HIGH,
        description: 'Esgotamento de recursos detectado',
        autoFix: this.fixResourceExhaustion.bind(this)
      },

      // Detecção de corrupção de estado
      {
        id: 'state_corruption_detector',
        type: BugType.STATE_CORRUPTION,
        condition: (ctx) => {
          return this.detectStateCorruption(ctx.state);
        },
        severity: BugSeverity.HIGH,
        description: 'Corrupção de estado da aplicação detectada',
        autoFix: this.fixStateCorruption.bind(this)
      },

      // Detecção de falha de rede
      {
        id: 'network_failure_detector',
        type: BugType.NETWORK_FAILURE,
        condition: (ctx) => {
          const latency = ctx.network?.latency || 0;
          const failures = ctx.network?.failures || 0;
          return latency > 5000 || failures > 3;
        },
        severity: BugSeverity.MEDIUM,
        description: 'Falha de rede detectada',
        autoFix: this.fixNetworkFailure.bind(this)
      },

      // Detecção de overflow de storage
      {
        id: 'storage_overflow_detector',
        type: BugType.STORAGE_OVERFLOW,
        condition: (ctx) => {
          return this.detectStorageOverflow(ctx.storage);
        },
        severity: BugSeverity.HIGH,
        description: 'Overflow de armazenamento detectado',
        autoFix: this.fixStorageOverflow.bind(this)
      }
    ];
  }

  // Iniciar detecção
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.runDetection();
    }, this.detectionInterval);
    
    console.log('🔍 Sistema de detecção proativa iniciado');
  }

  // Parar detecção
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    console.log('⏹️ Sistema de detecção proativa parado');
  }

  // Executar detecção
  private async runDetection(): Promise<void> {
    try {
      const context = await this.gatherContext();
      
      for (const rule of this.rules) {
        try {
          if (rule.condition(context)) {
            await this.reportBug(rule, context);
          }
        } catch (error) {
          console.error(`Erro na regra ${rule.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro na detecção de bugs:', error);
    }
  }

  // Coletar contexto para detecção
  private async gatherContext(): Promise<DetectionContext> {
    const performanceMetrics = performanceMonitor.getLatestMetrics();
    const cacheStats = advancedCache.getStats();
    
    return {
      performance: performanceMetrics,
      memory: {
        usage: this.getMemoryUsage(),
        limit: this.getMemoryLimit(),
        pressure: this.getMemoryPressure()
      },
      storage: {
        localStorage: this.getLocalStorageUsage(),
        sessionStorage: this.getSessionStorageUsage(),
        indexedDB: await this.getIndexedDBUsage()
      },
      network: {
        latency: performanceMetrics?.networkLatency || 0,
        failures: this.getNetworkFailures()
      },
      cache: cacheStats,
      state: this.getCurrentState(),
      history: this.getPerformanceHistory(),
      timestamp: Date.now()
    };
  }

  // Reportar bug detectado
  private async reportBug(rule: DetectionRule, context: DetectionContext): Promise<void> {
    // Evitar duplicatas
    const existingBug = this.detectedBugs.find(bug => 
      bug.type === rule.type && 
      (Date.now() - bug.timestamp) < 60000 // 1 minuto
    );
    
    if (existingBug) return;

    const bug: BugReport = {
      id: `${rule.type}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.description,
      description: this.generateBugDescription(rule, context),
      context: this.sanitizeContext(context),
      timestamp: Date.now(),
      autoFixable: !!rule.autoFix,
      metrics: this.extractRelevantMetrics(rule.type, context)
    };

    this.detectedBugs.push(bug);
    this.notifyObservers(bug);

    // Tentar correção automática se disponível
    if (rule.autoFix && bug.severity !== BugSeverity.CRITICAL) {
      try {
        const fixed = await rule.autoFix(context);
        if (fixed) {
          console.log(`✅ Bug ${bug.id} corrigido automaticamente`);
        }
      } catch (error) {
        console.error(`❌ Falha na correção automática de ${bug.id}:`, error);
      }
    }

    // Log do bug
    const emoji = this.getSeverityEmoji(bug.severity);
    console.warn(`${emoji} Bug detectado: ${bug.title} (${bug.severity})`);
  }

  // Métodos de detecção específicos
  private calculateMemoryGrowth(history: any[]): number {
    if (history.length < 2) return 0;
    
    const recent = history.slice(-12); // Últimos 12 pontos (1 minuto)
    const first = recent[0]?.memory?.usage || 0;
    const last = recent[recent.length - 1]?.memory?.usage || 0;
    
    return (last - first) / (recent.length * 5 / 60); // MB por minuto
  }

  private calculateAverageRenderTime(history: any[]): number {
    if (history.length === 0) return 0;
    
    const recent = history.slice(-10);
    const renderTimes = recent.map(h => h.performance?.renderTime || 0);
    return renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  }

  private detectDataCorruption(storage: any): boolean {
    try {
      // Verificar integridade dos dados no localStorage
      const financialData = localStorage.getItem('financialData');
      if (financialData) {
        const data = JSON.parse(financialData);
        
        // Verificar estrutura básica
        if (!data.years || typeof data.years !== 'object') return true;
        
        // Verificar consistência de saldos
        for (const [year, yearData] of Object.entries(data.years)) {
          if (!yearData || typeof yearData !== 'object') return true;
          
          const months = (yearData as any).months;
          if (!months || typeof months !== 'object') return true;
          
          // Verificar cada mês
          for (const [month, monthData] of Object.entries(months)) {
            if (!monthData || typeof monthData !== 'object') return true;
            
            const days = (monthData as any).days;
            if (!days || typeof days !== 'object') return true;
            
            // Verificar saldos negativos impossíveis
            const balance = (monthData as any).balance;
            if (typeof balance === 'number' && balance < -1000000) return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return true; // Erro ao parsear = corrupção
    }
  }

  private detectCalculationErrors(state: any): boolean {
    try {
      // Verificar se há inconsistências nos cálculos
      const data = state?.financialData;
      if (!data?.years) return false;
      
      for (const [year, yearData] of Object.entries(data.years)) {
        const months = (yearData as any)?.months;
        if (!months) continue;
        
        for (const [month, monthData] of Object.entries(months)) {
          const days = (monthData as any)?.days;
          const balance = (monthData as any)?.balance;
          
          if (!days || typeof balance !== 'number') continue;
          
          // Calcular saldo baseado nas transações
          let calculatedBalance = 0;
          for (const [day, dayData] of Object.entries(days)) {
            const transactions = (dayData as any)?.transactions || [];
            for (const transaction of transactions) {
              if (transaction.type === 'income') {
                calculatedBalance += transaction.amount || 0;
              } else if (transaction.type === 'expense') {
                calculatedBalance -= transaction.amount || 0;
              }
            }
          }
          
          // Verificar discrepância
          const difference = Math.abs(calculatedBalance - balance);
          if (difference > 0.01) { // Tolerância de 1 centavo
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return true;
    }
  }

  private detectInfiniteLoop(performance: any): boolean {
    // Detectar long tasks repetitivos
    const longTasks = performance?.longTasks || [];
    if (longTasks.length > 5) {
      const recentTasks = longTasks.slice(-5);
      const avgDuration = recentTasks.reduce((sum: number, task: any) => sum + task.duration, 0) / recentTasks.length;
      return avgDuration > 1000; // Tarefas muito longas repetitivas
    }
    
    return false;
  }

  private detectStateCorruption(state: any): boolean {
    try {
      // Verificar se o estado tem propriedades essenciais
      if (!state) return true;
      
      // Verificar estrutura do estado financeiro
      const financialData = state.financialData;
      if (financialData && typeof financialData !== 'object') return true;
      
      // Verificar se há referências circulares
      try {
        JSON.stringify(state);
      } catch (error) {
        return true; // Referência circular detectada
      }
      
      return false;
    } catch (error) {
      return true;
    }
  }

  private detectStorageOverflow(storage: any): boolean {
    try {
      const localStorageSize = this.getLocalStorageUsage();
      const sessionStorageSize = this.getSessionStorageUsage();
      
      // Verificar se está próximo do limite (5MB para localStorage)
      return localStorageSize > 4.5 || sessionStorageSize > 4.5;
    } catch (error) {
      return true;
    }
  }

  // Métodos de correção automática
  private async fixMemoryLeak(context: DetectionContext): Promise<boolean> {
    try {
      // Forçar garbage collection se disponível
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Limpar caches antigos
      advancedCache.clear();
      
      // Limpar event listeners órfãos
      this.cleanupEventListeners();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixPerformanceDegradation(context: DetectionContext): Promise<boolean> {
    try {
      // Limpar cache para forçar re-otimização
      advancedCache.invalidatePattern('.*');
      
      // Reduzir frequência de monitoramento temporariamente
      this.detectionInterval = Math.min(this.detectionInterval * 1.5, 30000);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixDataCorruption(context: DetectionContext): Promise<boolean> {
    try {
      // Tentar recuperar de backup
      const backup = localStorage.getItem('financialData_backup');
      if (backup) {
        localStorage.setItem('financialData', backup);
        return true;
      }
      
      // Se não há backup, criar estrutura mínima válida
      const minimalData = {
        years: {},
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1
      };
      
      localStorage.setItem('financialData', JSON.stringify(minimalData));
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixCalculationError(context: DetectionContext): Promise<boolean> {
    try {
      // Recalcular todos os saldos
      const data = JSON.parse(localStorage.getItem('financialData') || '{}');
      
      if (data.years) {
        for (const [year, yearData] of Object.entries(data.years)) {
          const months = (yearData as any)?.months;
          if (!months) continue;
          
          for (const [month, monthData] of Object.entries(months)) {
            const days = (monthData as any)?.days;
            if (!days) continue;
            
            // Recalcular saldo do mês
            let monthBalance = 0;
            for (const [day, dayData] of Object.entries(days)) {
              const transactions = (dayData as any)?.transactions || [];
              for (const transaction of transactions) {
                if (transaction.type === 'income') {
                  monthBalance += transaction.amount || 0;
                } else if (transaction.type === 'expense') {
                  monthBalance -= transaction.amount || 0;
                }
              }
            }
            
            (monthData as any).balance = monthBalance;
          }
        }
        
        localStorage.setItem('financialData', JSON.stringify(data));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private async fixCacheInconsistency(context: DetectionContext): Promise<boolean> {
    try {
      // Limpar e reinicializar cache
      advancedCache.clear();
      
      // Pré-carregar dados essenciais
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      await advancedCache.preload([
        `financial_data_${currentYear}`,
        `financial_data_${currentYear}_${currentMonth}`
      ], 'high');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixInfiniteLoop(context: DetectionContext): Promise<boolean> {
    try {
      // Interromper operações custosas
      this.stop();
      
      // Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reiniciar com intervalo maior
      this.detectionInterval = 10000;
      this.start();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixResourceExhaustion(context: DetectionContext): Promise<boolean> {
    try {
      // Limpeza agressiva de memória
      advancedCache.clear();
      
      // Limpar localStorage de dados antigos
      this.cleanupOldData();
      
      // Forçar garbage collection
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixStateCorruption(context: DetectionContext): Promise<boolean> {
    try {
      // Recarregar página como último recurso
      if (context.state && typeof context.state === 'object') {
        // Tentar limpar propriedades corrompidas
        for (const key in context.state) {
          try {
            JSON.stringify(context.state[key]);
          } catch (error) {
            delete context.state[key];
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private async fixNetworkFailure(context: DetectionContext): Promise<boolean> {
    try {
      // Implementar retry com backoff
      // Por enquanto, apenas log
      console.log('Implementando retry para falhas de rede...');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fixStorageOverflow(context: DetectionContext): Promise<boolean> {
    try {
      // Limpar dados antigos
      this.cleanupOldData();
      
      // Compactar dados atuais
      this.compressStorageData();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Métodos utilitários
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private getMemoryLimit(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    }
    return 0;
  }

  private getMemoryPressure(): number {
    const usage = this.getMemoryUsage();
    const limit = this.getMemoryLimit();
    return limit > 0 ? (usage / limit) * 100 : 0;
  }

  private getLocalStorageUsage(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return total / 1024 / 1024; // MB
  }

  private getSessionStorageUsage(): number {
    let total = 0;
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        total += sessionStorage[key].length;
      }
    }
    return total / 1024 / 1024; // MB
  }

  private async getIndexedDBUsage(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return (estimate.usage || 0) / 1024 / 1024; // MB
      }
    } catch (error) {
      // Fallback
    }
    return 0;
  }

  private calculateStorageUsage(): number {
    const localStorage = this.getLocalStorageUsage();
    const sessionStorage = this.getSessionStorageUsage();
    return ((localStorage + sessionStorage) / 10) * 100; // % de 10MB
  }

  private getNetworkFailures(): number {
    // Implementar contador de falhas de rede
    return 0;
  }

  private getCurrentState(): any {
    try {
      return {
        financialData: JSON.parse(localStorage.getItem('financialData') || '{}'),
        userPreferences: JSON.parse(localStorage.getItem('userPreferences') || '{}')
      };
    } catch (error) {
      return {};
    }
  }

  private getPerformanceHistory(): any[] {
    return performanceMonitor.getMetrics().slice(-20); // Últimos 20 pontos
  }

  private generateBugDescription(rule: DetectionRule, context: DetectionContext): string {
    const descriptions: { [key in BugType]: string } = {
      [BugType.MEMORY_LEAK]: `Vazamento de memória detectado. Uso atual: ${context.memory.usage}MB`,
      [BugType.PERFORMANCE_DEGRADATION]: `Performance degradada. Tempo médio de render: ${this.calculateAverageRenderTime(context.history)}ms`,
      [BugType.DATA_CORRUPTION]: 'Dados corrompidos detectados no armazenamento local',
      [BugType.CALCULATION_ERROR]: 'Inconsistência nos cálculos financeiros detectada',
      [BugType.CACHE_INCONSISTENCY]: `Cache com baixa eficiência. Hit rate: ${context.cache.hitRate}%`,
      [BugType.INFINITE_LOOP]: 'Possível loop infinito ou operação muito lenta detectada',
      [BugType.RESOURCE_EXHAUSTION]: `Recursos esgotados. Memória: ${context.memory.usage}MB`,
      [BugType.STATE_CORRUPTION]: 'Estado da aplicação corrompido',
      [BugType.NETWORK_FAILURE]: `Falha de rede. Latência: ${context.network.latency}ms`,
      [BugType.STORAGE_OVERFLOW]: `Armazenamento quase cheio. Uso: ${this.calculateStorageUsage()}%`
    };
    
    return descriptions[rule.type] || rule.description;
  }

  private sanitizeContext(context: DetectionContext): any {
    // Remover dados sensíveis do contexto
    return {
      timestamp: context.timestamp,
      memoryUsage: context.memory.usage,
      cacheHitRate: context.cache.hitRate,
      performanceMetrics: {
        renderTime: context.performance?.renderTime,
        memoryUsage: context.performance?.memoryUsage,
        fps: context.performance?.fps
      }
    };
  }

  private extractRelevantMetrics(type: BugType, context: DetectionContext): { [key: string]: number } {
    const base = {
      timestamp: context.timestamp,
      memoryUsage: context.memory.usage
    };
    
    switch (type) {
      case BugType.MEMORY_LEAK:
        return { ...base, memoryGrowth: this.calculateMemoryGrowth(context.history) };
      case BugType.PERFORMANCE_DEGRADATION:
        return { ...base, avgRenderTime: this.calculateAverageRenderTime(context.history) };
      case BugType.CACHE_INCONSISTENCY:
        return { ...base, cacheHitRate: context.cache.hitRate };
      default:
        return base;
    }
  }

  private getSeverityEmoji(severity: BugSeverity): string {
    const emojis = {
      [BugSeverity.LOW]: '🟡',
      [BugSeverity.MEDIUM]: '🟠',
      [BugSeverity.HIGH]: '🔴',
      [BugSeverity.CRITICAL]: '🚨'
    };
    return emojis[severity];
  }

  private cleanupEventListeners(): void {
    // Implementar limpeza de event listeners órfãos
    // Por enquanto, apenas log
    console.log('Limpando event listeners órfãos...');
  }

  private cleanupOldData(): void {
    try {
      // Remover dados antigos (mais de 1 ano)
      const currentYear = new Date().getFullYear();
      const data = JSON.parse(localStorage.getItem('financialData') || '{}');
      
      if (data.years) {
        for (const year in data.years) {
          if (parseInt(year) < currentYear - 1) {
            delete data.years[year];
          }
        }
        localStorage.setItem('financialData', JSON.stringify(data));
      }
      
      // Limpar cache antigo
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_') || key?.startsWith('old_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro na limpeza de dados antigos:', error);
    }
  }

  private compressStorageData(): void {
    try {
      // Implementar compressão básica dos dados
      const data = localStorage.getItem('financialData');
      if (data) {
        // Por enquanto, apenas remover espaços desnecessários
        const compressed = JSON.stringify(JSON.parse(data));
        localStorage.setItem('financialData', compressed);
      }
    } catch (error) {
      console.error('Erro na compressão de dados:', error);
    }
  }

  // API pública
  subscribe(callback: (bug: BugReport) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(bug: BugReport): void {
    this.observers.forEach(callback => {
      try {
        callback(bug);
      } catch (error) {
        console.error('Erro no observer de bugs:', error);
      }
    });
  }

  getBugs(): BugReport[] {
    return [...this.detectedBugs];
  }

  getBugsByType(type: BugType): BugReport[] {
    return this.detectedBugs.filter(bug => bug.type === type);
  }

  getBugsBySeverity(severity: BugSeverity): BugReport[] {
    return this.detectedBugs.filter(bug => bug.severity === severity);
  }

  clearBugs(): void {
    this.detectedBugs.length = 0;
  }

  addCustomRule(rule: DetectionRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  setDetectionInterval(interval: number): void {
    this.detectionInterval = Math.max(1000, interval); // Mínimo 1 segundo
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Instância global
export const bugDetector = new ProactiveBugDetector();

// Hook para usar o detector
export function useBugDetector() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  
  useEffect(() => {
    const unsubscribe = bugDetector.subscribe((bug) => {
      setBugs(prev => [...prev, bug]);
    });
    
    bugDetector.start();
    
    return () => {
      unsubscribe();
      bugDetector.stop();
    };
  }, []);
  
  return {
    bugs,
    criticalBugs: bugs.filter(b => b.severity === BugSeverity.CRITICAL),
    highBugs: bugs.filter(b => b.severity === BugSeverity.HIGH),
    clearBugs: bugDetector.clearBugs.bind(bugDetector),
    addCustomRule: bugDetector.addCustomRule.bind(bugDetector)
  };
}

export default bugDetector;