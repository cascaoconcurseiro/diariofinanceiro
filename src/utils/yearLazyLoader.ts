/**
 * Sistema de Lazy Loading para Anos
 * Carrega dados de anos sob demanda com pré-carregamento inteligente
 */

import { yearManager, YearMetadata } from './extendedYearManager';
import { advancedCache } from './advancedPerformanceCache';

export enum LoadPriority {
  IMMEDIATE = 'immediate',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  BACKGROUND = 'background'
}

export enum LoadStatus {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  CACHED = 'cached'
}

export interface YearLoadRequest {
  year: number;
  priority: LoadPriority;
  requestTime: number;
  requester: string;
  preload: boolean;
}

export interface YearLoadResult {
  year: number;
  status: LoadStatus;
  data: any;
  loadTime: number;
  fromCache: boolean;
  error?: string;
}

export interface LoadingProgress {
  year: number;
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining: number;
}

export interface PreloadStrategy {
  enabled: boolean;
  radius: number; // Quantos anos ao redor carregar
  maxConcurrent: number; // Máximo de carregamentos simultâneos
  delayBetweenLoads: number; // Delay entre carregamentos em ms
  prioritizeRecent: boolean; // Priorizar anos recentes
  backgroundOnly: boolean; // Apenas em background
}

class YearLazyLoader {
  private loadQueue: YearLoadRequest[] = [];
  private loadingYears: Set<number> = new Set();
  private loadedYears: Map<number, YearLoadResult> = new Map();
  private loadingProgress: Map<number, LoadingProgress> = new Map();
  
  private preloadStrategy: PreloadStrategy = {
    enabled: true,
    radius: 2,
    maxConcurrent: 3,
    delayBetweenLoads: 100,
    prioritizeRecent: true,
    backgroundOnly: true
  };
  
  private observers: {
    onLoadStart: ((year: number) => void)[];
    onLoadComplete: ((result: YearLoadResult) => void)[];
    onLoadProgress: ((progress: LoadingProgress) => void)[];
    onLoadError: ((year: number, error: string) => void)[];
  } = {
    onLoadStart: [],
    onLoadComplete: [],
    onLoadProgress: [],
    onLoadError: []
  };
  
  private isProcessingQueue = false;
  private loadStatistics = {
    totalLoads: 0,
    cacheHits: 0,
    loadErrors: 0,
    averageLoadTime: 0,
    totalLoadTime: 0
  };

  constructor() {
    this.startQueueProcessor();
    this.setupPreloadTriggers();
  }

  // Carregar ano específico
  async loadYear(
    year: number, 
    priority: LoadPriority = LoadPriority.MEDIUM,
    requester: string = 'user'
  ): Promise<YearLoadResult> {
    // Verificar se já está carregado
    const existing = this.loadedYears.get(year);
    if (existing && existing.status === LoadStatus.LOADED) {
      return existing;
    }

    // Verificar cache primeiro
    const cacheKey = `year_data_${year}`;
    const cached = await advancedCache.get(cacheKey);
    if (cached) {
      const result: YearLoadResult = {
        year,
        status: LoadStatus.CACHED,
        data: cached,
        loadTime: 0,
        fromCache: true
      };
      
      this.loadedYears.set(year, result);
      this.loadStatistics.cacheHits++;
      this.notifyLoadComplete(result);
      
      return result;
    }

    // Adicionar à fila se não estiver carregando
    if (!this.loadingYears.has(year)) {
      const request: YearLoadRequest = {
        year,
        priority,
        requestTime: Date.now(),
        requester,
        preload: false
      };
      
      this.addToQueue(request);
    }

    // Retornar promise que resolve quando o carregamento terminar
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.loadedYears.get(year);
        if (result) {
          if (result.status === LoadStatus.LOADED || result.status === LoadStatus.CACHED) {
            resolve(result);
          } else if (result.status === LoadStatus.ERROR) {
            reject(new Error(result.error || 'Erro no carregamento'));
          }
        } else {
          // Continuar verificando
          setTimeout(checkResult, 100);
        }
      };
      
      checkResult();
    });
  }

  // Pré-carregar anos próximos
  async preloadNearbyYears(currentYear: number): Promise<void> {
    if (!this.preloadStrategy.enabled) return;

    const nearbyYears = yearManager.getNearbyYears(currentYear, this.preloadStrategy.radius);
    const yearsToPreload = nearbyYears.filter(year => 
      year !== currentYear && 
      !this.loadedYears.has(year) && 
      !this.loadingYears.has(year)
    );

    // Priorizar anos recentes se configurado
    if (this.preloadStrategy.prioritizeRecent) {
      const currentYearNum = new Date().getFullYear();
      yearsToPreload.sort((a, b) => {
        const distanceA = Math.abs(a - currentYearNum);
        const distanceB = Math.abs(b - currentYearNum);
        return distanceA - distanceB;
      });
    }

    // Adicionar à fila com prioridade baixa
    for (const year of yearsToPreload) {
      const request: YearLoadRequest = {
        year,
        priority: this.preloadStrategy.backgroundOnly ? LoadPriority.BACKGROUND : LoadPriority.LOW,
        requestTime: Date.now(),
        requester: 'preloader',
        preload: true
      };
      
      this.addToQueue(request);
    }
  }

  // Adicionar à fila de carregamento
  private addToQueue(request: YearLoadRequest): void {
    // Evitar duplicatas
    const existingIndex = this.loadQueue.findIndex(req => req.year === request.year);
    if (existingIndex >= 0) {
      // Atualizar prioridade se for maior
      const existing = this.loadQueue[existingIndex];
      if (this.getPriorityValue(request.priority) > this.getPriorityValue(existing.priority)) {
        this.loadQueue[existingIndex] = request;
      }
      return;
    }

    this.loadQueue.push(request);
    this.sortQueue();
  }

  // Ordenar fila por prioridade
  private sortQueue(): void {
    this.loadQueue.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Se mesma prioridade, ordenar por tempo de requisição
      return a.requestTime - b.requestTime;
    });
  }

  // Obter valor numérico da prioridade
  private getPriorityValue(priority: LoadPriority): number {
    const values = {
      [LoadPriority.IMMEDIATE]: 5,
      [LoadPriority.HIGH]: 4,
      [LoadPriority.MEDIUM]: 3,
      [LoadPriority.LOW]: 2,
      [LoadPriority.BACKGROUND]: 1
    };
    return values[priority];
  }

  // Processar fila de carregamento
  private startQueueProcessor(): void {
    const processQueue = async () => {
      if (this.isProcessingQueue || this.loadQueue.length === 0) {
        setTimeout(processQueue, 100);
        return;
      }

      this.isProcessingQueue = true;

      try {
        // Processar até o máximo de carregamentos simultâneos
        const concurrent = Math.min(
          this.preloadStrategy.maxConcurrent,
          this.loadQueue.length
        );

        const promises: Promise<void>[] = [];
        
        for (let i = 0; i < concurrent; i++) {
          const request = this.loadQueue.shift();
          if (request) {
            promises.push(this.processLoadRequest(request));
          }
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Erro no processamento da fila:', error);
      } finally {
        this.isProcessingQueue = false;
      }

      // Continuar processando
      setTimeout(processQueue, this.preloadStrategy.delayBetweenLoads);
    };

    processQueue();
  }

  // Processar requisição de carregamento
  private async processLoadRequest(request: YearLoadRequest): Promise<void> {
    const { year, priority, requester } = request;
    
    if (this.loadingYears.has(year)) return;
    
    this.loadingYears.add(year);
    this.notifyLoadStart(year);
    
    const startTime = performance.now();
    
    try {
      // Simular progresso de carregamento
      this.updateProgress(year, 0, 'Iniciando carregamento...');
      
      // Carregar dados do localStorage
      this.updateProgress(year, 25, 'Carregando dados...');
      const data = await this.loadYearData(year);
      
      // Processar dados
      this.updateProgress(year, 50, 'Processando dados...');
      const processedData = await this.processYearData(data, year);
      
      // Validar dados
      this.updateProgress(year, 75, 'Validando dados...');
      const validatedData = await this.validateYearData(processedData, year);
      
      // Salvar no cache
      this.updateProgress(year, 90, 'Salvando no cache...');
      const cacheKey = `year_data_${year}`;
      await advancedCache.set(cacheKey, validatedData, 300000); // 5 minutos
      
      this.updateProgress(year, 100, 'Concluído');
      
      const loadTime = performance.now() - startTime;
      
      const result: YearLoadResult = {
        year,
        status: LoadStatus.LOADED,
        data: validatedData,
        loadTime,
        fromCache: false
      };
      
      this.loadedYears.set(year, result);
      yearManager.markYearAsLoaded(year);
      
      // Atualizar estatísticas
      this.loadStatistics.totalLoads++;
      this.loadStatistics.totalLoadTime += loadTime;
      this.loadStatistics.averageLoadTime = 
        this.loadStatistics.totalLoadTime / this.loadStatistics.totalLoads;
      
      this.notifyLoadComplete(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      const result: YearLoadResult = {
        year,
        status: LoadStatus.ERROR,
        data: null,
        loadTime: performance.now() - startTime,
        fromCache: false,
        error: errorMessage
      };
      
      this.loadedYears.set(year, result);
      this.loadStatistics.loadErrors++;
      
      this.notifyLoadError(year, errorMessage);
      
    } finally {
      this.loadingYears.delete(year);
      this.loadingProgress.delete(year);
    }
  }

  // Carregar dados do ano do localStorage
  private async loadYearData(year: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
        const yearData = financialData.years?.[year] || null;
        
        // Simular delay de carregamento baseado no tamanho dos dados
        const dataSize = yearData ? JSON.stringify(yearData).length : 0;
        const delay = Math.min(dataSize / 1000, 500); // Máximo 500ms
        
        setTimeout(() => {
          resolve(yearData);
        }, delay);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Processar dados do ano
  private async processYearData(data: any, year: number): Promise<any> {
    if (!data) {
      // Criar estrutura vazia para anos sem dados
      return {
        months: {},
        metadata: {
          year,
          created: Date.now(),
          lastModified: Date.now(),
          transactionCount: 0,
          isEmpty: true
        }
      };
    }

    // Processar e enriquecer dados existentes
    const processedData = { ...data };
    
    // Adicionar metadados se não existirem
    if (!processedData.metadata) {
      let transactionCount = 0;
      const months = processedData.months || {};
      
      for (const monthData of Object.values(months)) {
        const days = (monthData as any)?.days || {};
        for (const dayData of Object.values(days)) {
          const transactions = (dayData as any)?.transactions || [];
          transactionCount += transactions.length;
        }
      }
      
      processedData.metadata = {
        year,
        transactionCount,
        lastModified: Date.now(),
        isEmpty: transactionCount === 0
      };
    }

    return processedData;
  }

  // Validar dados do ano
  private async validateYearData(data: any, year: number): Promise<any> {
    // Validações básicas
    if (!data || typeof data !== 'object') {
      throw new Error(`Dados inválidos para o ano ${year}`);
    }

    // Validar estrutura de meses
    if (data.months && typeof data.months === 'object') {
      for (const [month, monthData] of Object.entries(data.months)) {
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          console.warn(`Mês inválido encontrado: ${month} no ano ${year}`);
        }
      }
    }

    return data;
  }

  // Atualizar progresso de carregamento
  private updateProgress(year: number, progress: number, stage: string): void {
    const progressInfo: LoadingProgress = {
      year,
      progress,
      stage,
      estimatedTimeRemaining: this.estimateTimeRemaining(progress)
    };
    
    this.loadingProgress.set(year, progressInfo);
    this.notifyLoadProgress(progressInfo);
  }

  // Estimar tempo restante
  private estimateTimeRemaining(progress: number): number {
    if (progress >= 100) return 0;
    
    const avgLoadTime = this.loadStatistics.averageLoadTime || 1000;
    const remainingProgress = 100 - progress;
    return (avgLoadTime * remainingProgress) / 100;
  }

  // Configurar triggers de pré-carregamento
  private setupPreloadTriggers(): void {
    // Pré-carregar quando o usuário navegar
    yearManager.subscribe((navigationState) => {
      if (this.preloadStrategy.enabled) {
        this.preloadNearbyYears(navigationState.currentYear);
      }
    });
  }

  // Descarregar anos distantes
  async unloadDistantYears(currentYear: number): Promise<void> {
    const yearsToUnload = yearManager.getYearsToUnload(currentYear, this.preloadStrategy.radius + 1);
    
    for (const year of yearsToUnload) {
      this.unloadYear(year);
    }
  }

  // Descarregar ano específico
  unloadYear(year: number): void {
    this.loadedYears.delete(year);
    yearManager.unloadYear(year);
    
    // Remover do cache
    const cacheKey = `year_data_${year}`;
    advancedCache.invalidatePattern(cacheKey);
    
    console.log(`Ano ${year} descarregado da memória`);
  }

  // Obter status de carregamento
  getLoadStatus(year: number): LoadStatus {
    const result = this.loadedYears.get(year);
    if (result) return result.status;
    
    if (this.loadingYears.has(year)) return LoadStatus.LOADING;
    
    return LoadStatus.NOT_LOADED;
  }

  // Obter progresso de carregamento
  getLoadProgress(year: number): LoadingProgress | null {
    return this.loadingProgress.get(year) || null;
  }

  // Obter dados carregados
  getLoadedData(year: number): any {
    const result = this.loadedYears.get(year);
    return result?.data || null;
  }

  // Obter estatísticas de carregamento
  getLoadStatistics(): typeof this.loadStatistics {
    return { ...this.loadStatistics };
  }

  // Configurar estratégia de pré-carregamento
  setPreloadStrategy(strategy: Partial<PreloadStrategy>): void {
    this.preloadStrategy = { ...this.preloadStrategy, ...strategy };
  }

  // Obter estratégia atual
  getPreloadStrategy(): PreloadStrategy {
    return { ...this.preloadStrategy };
  }

  // Limpar cache de anos
  clearCache(): void {
    this.loadedYears.clear();
    this.loadingYears.clear();
    this.loadingProgress.clear();
    this.loadQueue.length = 0;
    
    // Limpar cache avançado
    advancedCache.invalidatePattern('year_data_.*');
  }

  // Forçar recarregamento de um ano
  async reloadYear(year: number): Promise<YearLoadResult> {
    // Remover do cache
    this.loadedYears.delete(year);
    const cacheKey = `year_data_${year}`;
    advancedCache.invalidatePattern(cacheKey);
    
    // Carregar novamente
    return await this.loadYear(year, LoadPriority.HIGH, 'reload');
  }

  // Pré-carregar anos com dados
  async preloadYearsWithData(): Promise<void> {
    const yearsWithData = yearManager.getYearsWithData();
    
    for (const year of yearsWithData) {
      if (!this.loadedYears.has(year)) {
        await this.loadYear(year, LoadPriority.LOW, 'bulk_preload');
        
        // Pequeno delay entre carregamentos
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  // Observadores
  onLoadStart(callback: (year: number) => void): () => void {
    this.observers.onLoadStart.push(callback);
    return () => {
      const index = this.observers.onLoadStart.indexOf(callback);
      if (index > -1) this.observers.onLoadStart.splice(index, 1);
    };
  }

  onLoadComplete(callback: (result: YearLoadResult) => void): () => void {
    this.observers.onLoadComplete.push(callback);
    return () => {
      const index = this.observers.onLoadComplete.indexOf(callback);
      if (index > -1) this.observers.onLoadComplete.splice(index, 1);
    };
  }

  onLoadProgress(callback: (progress: LoadingProgress) => void): () => void {
    this.observers.onLoadProgress.push(callback);
    return () => {
      const index = this.observers.onLoadProgress.indexOf(callback);
      if (index > -1) this.observers.onLoadProgress.splice(index, 1);
    };
  }

  onLoadError(callback: (year: number, error: string) => void): () => void {
    this.observers.onLoadError.push(callback);
    return () => {
      const index = this.observers.onLoadError.indexOf(callback);
      if (index > -1) this.observers.onLoadError.splice(index, 1);
    };
  }

  // Notificadores
  private notifyLoadStart(year: number): void {
    this.observers.onLoadStart.forEach(callback => {
      try {
        callback(year);
      } catch (error) {
        console.error('Erro no observer de início de carregamento:', error);
      }
    });
  }

  private notifyLoadComplete(result: YearLoadResult): void {
    this.observers.onLoadComplete.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Erro no observer de carregamento completo:', error);
      }
    });
  }

  private notifyLoadProgress(progress: LoadingProgress): void {
    this.observers.onLoadProgress.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Erro no observer de progresso:', error);
      }
    });
  }

  private notifyLoadError(year: number, error: string): void {
    this.observers.onLoadError.forEach(callback => {
      try {
        callback(year, error);
      } catch (error) {
        console.error('Erro no observer de erro:', error);
      }
    });
  }
}

// Instância global
export const yearLazyLoader = new YearLazyLoader();

// Hook para usar o lazy loader
export function useYearLazyLoader() {
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set());
  const [loadProgress, setLoadProgress] = useState<Map<number, LoadingProgress>>(new Map());
  const [loadErrors, setLoadErrors] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const unsubscribeStart = yearLazyLoader.onLoadStart((year) => {
      setLoadingYears(prev => new Set([...prev, year]));
    });

    const unsubscribeComplete = yearLazyLoader.onLoadComplete((result) => {
      setLoadingYears(prev => {
        const newSet = new Set(prev);
        newSet.delete(result.year);
        return newSet;
      });
      
      if (result.status === LoadStatus.ERROR) {
        setLoadErrors(prev => new Map(prev).set(result.year, result.error || 'Erro desconhecido'));
      } else {
        setLoadErrors(prev => {
          const newMap = new Map(prev);
          newMap.delete(result.year);
          return newMap;
        });
      }
    });

    const unsubscribeProgress = yearLazyLoader.onLoadProgress((progress) => {
      setLoadProgress(prev => new Map(prev).set(progress.year, progress));
    });

    const unsubscribeError = yearLazyLoader.onLoadError((year, error) => {
      setLoadErrors(prev => new Map(prev).set(year, error));
      setLoadingYears(prev => {
        const newSet = new Set(prev);
        newSet.delete(year);
        return newSet;
      });
    });

    return () => {
      unsubscribeStart();
      unsubscribeComplete();
      unsubscribeProgress();
      unsubscribeError();
    };
  }, []);

  const loadYear = useCallback(async (year: number, priority?: LoadPriority) => {
    return await yearLazyLoader.loadYear(year, priority);
  }, []);

  const preloadNearby = useCallback(async (currentYear: number) => {
    return await yearLazyLoader.preloadNearbyYears(currentYear);
  }, []);

  const getLoadStatus = useCallback((year: number) => {
    return yearLazyLoader.getLoadStatus(year);
  }, []);

  const getLoadedData = useCallback((year: number) => {
    return yearLazyLoader.getLoadedData(year);
  }, []);

  return {
    // Estado
    loadingYears: Array.from(loadingYears),
    loadProgress: Object.fromEntries(loadProgress),
    loadErrors: Object.fromEntries(loadErrors),
    
    // Métodos
    loadYear,
    preloadNearby,
    getLoadStatus,
    getLoadedData,
    reloadYear: yearLazyLoader.reloadYear.bind(yearLazyLoader),
    unloadYear: yearLazyLoader.unloadYear.bind(yearLazyLoader),
    
    // Configuração
    setPreloadStrategy: yearLazyLoader.setPreloadStrategy.bind(yearLazyLoader),
    getPreloadStrategy: yearLazyLoader.getPreloadStrategy.bind(yearLazyLoader),
    
    // Estatísticas
    getStatistics: yearLazyLoader.getLoadStatistics.bind(yearLazyLoader),
    
    // Utilitários
    clearCache: yearLazyLoader.clearCache.bind(yearLazyLoader),
    preloadYearsWithData: yearLazyLoader.preloadYearsWithData.bind(yearLazyLoader)
  };
}

export default yearLazyLoader;