/**
 * Otimizador de Performance para Anos com Muitos Dados
 * Implementa virtualização, paginação e otimizações específicas para grandes volumes
 */

import { yearManager } from './extendedYearManager';
import { yearLazyLoader } from './yearLazyLoader';
import { advancedCache } from './advancedPerformanceCache';

export interface PerformanceMetrics {
  year: number;
  transactionCount: number;
  dataSize: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
  cacheHitRate: number;
}

export interface OptimizationStrategy {
  virtualization: boolean;
  pagination: boolean;
  compression: boolean;
  indexing: boolean;
  caching: boolean;
  lazyRendering: boolean;
  dataChunking: boolean;
}

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  threshold: number; // Número mínimo de itens para ativar virtualização
}

export interface PaginationConfig {
  pageSize: number;
  maxPages: number;
  preloadPages: number;
  infiniteScroll: boolean;
}

export interface DataChunk {
  id: string;
  year: number;
  month: number;
  startDay: number;
  endDay: number;
  data: any;
  size: number;
  compressed: boolean;
  lastAccessed: number;
}

export interface OptimizationResult {
  year: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  performanceGain: number;
  strategies: string[];
  metrics: PerformanceMetrics;
}

class YearPerformanceOptimizer {
  private optimizationStrategies: Map<number, OptimizationStrategy> = new Map();
  private performanceMetrics: Map<number, PerformanceMetrics> = new Map();
  private dataChunks: Map<string, DataChunk> = new Map();
  private indexes: Map<number, Map<string, any>> = new Map();
  
  private defaultVirtualizationConfig: VirtualizationConfig = {
    itemHeight: 60,
    containerHeight: 600,
    overscan: 5,
    threshold: 100
  };
  
  private defaultPaginationConfig: PaginationConfig = {
    pageSize: 50,
    maxPages: 20,
    preloadPages: 2,
    infiniteScroll: true
  };
  
  private performanceThresholds = {
    transactionCount: 1000,
    dataSize: 1024 * 1024, // 1MB
    renderTime: 100, // ms
    memoryUsage: 50 * 1024 * 1024 // 50MB
  };

  constructor() {
    this.initializeOptimizations();
  }

  // Inicializar otimizações
  private initializeOptimizations(): void {
    // Monitorar mudanças de ano para aplicar otimizações
    yearManager.subscribe((navigationState) => {
      this.optimizeYear(navigationState.currentYear);
    });
  }

  // Otimizar ano específico
  async optimizeYear(year: number): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    // Obter dados do ano
    const yearData = yearLazyLoader.getLoadedData(year);
    if (!yearData) {
      throw new Error(`Dados do ano ${year} não estão carregados`);
    }

    // Analisar dados para determinar estratégias
    const analysis = this.analyzeYearData(year, yearData);
    const strategy = this.determineOptimizationStrategy(analysis);
    
    // Aplicar otimizações
    const optimizedData = await this.applyOptimizations(year, yearData, strategy);
    
    // Calcular métricas de performance
    const metrics = this.calculatePerformanceMetrics(year, yearData, optimizedData);
    
    // Salvar estratégia e métricas
    this.optimizationStrategies.set(year, strategy);
    this.performanceMetrics.set(year, metrics);
    
    const endTime = performance.now();
    
    const result: OptimizationResult = {
      year,
      originalSize: JSON.stringify(yearData).length,
      optimizedSize: JSON.stringify(optimizedData).length,
      compressionRatio: this.calculateCompressionRatio(yearData, optimizedData),
      performanceGain: endTime - startTime,
      strategies: this.getAppliedStrategies(strategy),
      metrics
    };
    
    console.log(`Ano ${year} otimizado:`, result);
    return result;
  }

  // Analisar dados do ano
  private analyzeYearData(year: number, data: any): {
    transactionCount: number;
    dataSize: number;
    monthsWithData: number;
    averageTransactionsPerMonth: number;
    largestMonth: { month: number; transactions: number };
    dataDistribution: { [month: number]: number };
  } {
    let transactionCount = 0;
    let monthsWithData = 0;
    const dataDistribution: { [month: number]: number } = {};
    let largestMonth = { month: 1, transactions: 0 };
    
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      let monthTransactions = 0;
      
      for (const dayData of Object.values(days)) {
        const transactions = (dayData as any)?.transactions || [];
        monthTransactions += transactions.length;
      }
      
      if (monthTransactions > 0) {
        monthsWithData++;
        transactionCount += monthTransactions;
        dataDistribution[month] = monthTransactions;
        
        if (monthTransactions > largestMonth.transactions) {
          largestMonth = { month, transactions: monthTransactions };
        }
      }
    }
    
    return {
      transactionCount,
      dataSize: JSON.stringify(data).length,
      monthsWithData,
      averageTransactionsPerMonth: monthsWithData > 0 ? transactionCount / monthsWithData : 0,
      largestMonth,
      dataDistribution
    };
  }

  // Determinar estratégia de otimização
  private determineOptimizationStrategy(analysis: ReturnType<typeof this.analyzeYearData>): OptimizationStrategy {
    const strategy: OptimizationStrategy = {
      virtualization: false,
      pagination: false,
      compression: false,
      indexing: false,
      caching: true, // Sempre ativo
      lazyRendering: false,
      dataChunking: false
    };

    // Ativar virtualização para muitas transações
    if (analysis.transactionCount > this.performanceThresholds.transactionCount) {
      strategy.virtualization = true;
      strategy.lazyRendering = true;
    }

    // Ativar paginação para dados muito grandes
    if (analysis.dataSize > this.performanceThresholds.dataSize) {
      strategy.pagination = true;
      strategy.dataChunking = true;
    }

    // Ativar compressão para dados grandes
    if (analysis.dataSize > this.performanceThresholds.dataSize / 2) {
      strategy.compression = true;
    }

    // Ativar indexação para muitas transações
    if (analysis.transactionCount > 500) {
      strategy.indexing = true;
    }

    return strategy;
  }

  // Aplicar otimizações
  private async applyOptimizations(
    year: number, 
    data: any, 
    strategy: OptimizationStrategy
  ): Promise<any> {
    let optimizedData = { ...data };

    // Aplicar compressão
    if (strategy.compression) {
      optimizedData = await this.compressYearData(year, optimizedData);
    }

    // Criar chunks de dados
    if (strategy.dataChunking) {
      await this.createDataChunks(year, optimizedData);
    }

    // Criar índices
    if (strategy.indexing) {
      await this.createIndexes(year, optimizedData);
    }

    // Otimizar para cache
    if (strategy.caching) {
      await this.optimizeForCache(year, optimizedData);
    }

    return optimizedData;
  }

  // Comprimir dados do ano
  private async compressYearData(year: number, data: any): Promise<any> {
    const compressed = { ...data };
    
    // Comprimir transações repetitivas
    const months = compressed.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const days = (monthData as any)?.days || {};
      
      for (const [dayStr, dayData] of Object.entries(days)) {
        const transactions = (dayData as any)?.transactions || [];
        
        if (transactions.length > 0) {
          // Agrupar transações similares
          const groupedTransactions = this.groupSimilarTransactions(transactions);
          (dayData as any).transactions = groupedTransactions;
        }
      }
    }
    
    return compressed;
  }

  // Agrupar transações similares
  private groupSimilarTransactions(transactions: any[]): any[] {
    const groups = new Map<string, any[]>();
    
    for (const transaction of transactions) {
      const key = `${transaction.type}_${transaction.amount}_${transaction.description}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(transaction);
    }
    
    const compressed: any[] = [];
    
    for (const [key, group] of groups.entries()) {
      if (group.length === 1) {
        compressed.push(group[0]);
      } else {
        // Criar transação agrupada
        compressed.push({
          ...group[0],
          count: group.length,
          grouped: true,
          originalTransactions: group.map(t => ({ id: t.id, timestamp: t.timestamp }))
        });
      }
    }
    
    return compressed;
  }

  // Criar chunks de dados
  private async createDataChunks(year: number, data: any): Promise<void> {
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      const dayNumbers = Object.keys(days).map(d => parseInt(d)).sort((a, b) => a - b);
      
      // Dividir dias em chunks
      const chunkSize = 7; // Uma semana por chunk
      
      for (let i = 0; i < dayNumbers.length; i += chunkSize) {
        const chunkDays = dayNumbers.slice(i, i + chunkSize);
        const startDay = chunkDays[0];
        const endDay = chunkDays[chunkDays.length - 1];
        
        const chunkData: { [day: number]: any } = {};
        for (const day of chunkDays) {
          if (days[day]) {
            chunkData[day] = days[day];
          }
        }
        
        const chunk: DataChunk = {
          id: `${year}_${month}_${startDay}_${endDay}`,
          year,
          month,
          startDay,
          endDay,
          data: chunkData,
          size: JSON.stringify(chunkData).length,
          compressed: false,
          lastAccessed: Date.now()
        };
        
        this.dataChunks.set(chunk.id, chunk);
        
        // Salvar chunk no cache
        const cacheKey = `chunk_${chunk.id}`;
        await advancedCache.set(cacheKey, chunk, 600000); // 10 minutos
      }
    }
  }

  // Criar índices
  private async createIndexes(year: number, data: any): Promise<void> {
    const indexes = new Map<string, any>();
    
    // Índice por tipo de transação
    const typeIndex = new Map<string, any[]>();
    
    // Índice por valor
    const amountIndex = new Map<number, any[]>();
    
    // Índice por descrição
    const descriptionIndex = new Map<string, any[]>();
    
    // Índice temporal
    const dateIndex = new Map<string, any[]>();
    
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      
      for (const [dayStr, dayData] of Object.entries(days)) {
        const day = parseInt(dayStr);
        const transactions = (dayData as any)?.transactions || [];
        
        for (const transaction of transactions) {
          const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          // Índice por tipo
          if (!typeIndex.has(transaction.type)) {
            typeIndex.set(transaction.type, []);
          }
          typeIndex.get(transaction.type)!.push({ ...transaction, date: dateKey });
          
          // Índice por valor
          if (!amountIndex.has(transaction.amount)) {
            amountIndex.set(transaction.amount, []);
          }
          amountIndex.get(transaction.amount)!.push({ ...transaction, date: dateKey });
          
          // Índice por descrição
          const descKey = transaction.description?.toLowerCase() || '';
          if (!descriptionIndex.has(descKey)) {
            descriptionIndex.set(descKey, []);
          }
          descriptionIndex.get(descKey)!.push({ ...transaction, date: dateKey });
          
          // Índice temporal
          if (!dateIndex.has(dateKey)) {
            dateIndex.set(dateKey, []);
          }
          dateIndex.get(dateKey)!.push(transaction);
        }
      }
    }
    
    indexes.set('type', Object.fromEntries(typeIndex));
    indexes.set('amount', Object.fromEntries(amountIndex));
    indexes.set('description', Object.fromEntries(descriptionIndex));
    indexes.set('date', Object.fromEntries(dateIndex));
    
    this.indexes.set(year, indexes);
    
    // Salvar índices no cache
    const cacheKey = `indexes_${year}`;
    await advancedCache.set(cacheKey, Object.fromEntries(indexes), 1800000); // 30 minutos
  }

  // Otimizar para cache
  private async optimizeForCache(year: number, data: any): Promise<void> {
    // Pré-calcular dados frequentemente acessados
    const summary = this.calculateYearSummary(data);
    const monthSummaries = this.calculateMonthSummaries(data);
    
    // Salvar resumos no cache
    await advancedCache.set(`year_summary_${year}`, summary, 3600000); // 1 hora
    await advancedCache.set(`month_summaries_${year}`, monthSummaries, 1800000); // 30 minutos
    
    // Pré-calcular visualizações comuns
    const chartData = this.generateChartData(data);
    await advancedCache.set(`chart_data_${year}`, chartData, 1800000);
  }

  // Calcular resumo do ano
  private calculateYearSummary(data: any): any {
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    const monthlyBalances: { [month: number]: number } = {};
    
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      let monthIncome = 0;
      let monthExpenses = 0;
      
      for (const dayData of Object.values(days)) {
        const transactions = (dayData as any)?.transactions || [];
        
        for (const transaction of transactions) {
          transactionCount++;
          
          if (transaction.type === 'income') {
            totalIncome += transaction.amount || 0;
            monthIncome += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            totalExpenses += transaction.amount || 0;
            monthExpenses += transaction.amount || 0;
          }
        }
      }
      
      monthlyBalances[month] = monthIncome - monthExpenses;
    }
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount,
      monthlyBalances,
      averageMonthlyBalance: Object.values(monthlyBalances).reduce((a, b) => a + b, 0) / Object.keys(monthlyBalances).length
    };
  }

  // Calcular resumos mensais
  private calculateMonthSummaries(data: any): any {
    const summaries: { [month: number]: any } = {};
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      
      let income = 0;
      let expenses = 0;
      let transactionCount = 0;
      const dailyBalances: { [day: number]: number } = {};
      
      for (const [dayStr, dayData] of Object.entries(days)) {
        const day = parseInt(dayStr);
        const transactions = (dayData as any)?.transactions || [];
        let dayIncome = 0;
        let dayExpenses = 0;
        
        for (const transaction of transactions) {
          transactionCount++;
          
          if (transaction.type === 'income') {
            income += transaction.amount || 0;
            dayIncome += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            expenses += transaction.amount || 0;
            dayExpenses += transaction.amount || 0;
          }
        }
        
        dailyBalances[day] = dayIncome - dayExpenses;
      }
      
      summaries[month] = {
        income,
        expenses,
        balance: income - expenses,
        transactionCount,
        dailyBalances,
        averageDailyBalance: Object.values(dailyBalances).reduce((a, b) => a + b, 0) / Object.keys(dailyBalances).length
      };
    }
    
    return summaries;
  }

  // Gerar dados para gráficos
  private generateChartData(data: any): any {
    const monthlyData: any[] = [];
    const categoryData: { [category: string]: number } = {};
    const dailyTrends: any[] = [];
    
    const months = data.months || {};
    
    for (const [monthStr, monthData] of Object.entries(months)) {
      const month = parseInt(monthStr);
      const days = (monthData as any)?.days || {};
      
      let monthIncome = 0;
      let monthExpenses = 0;
      
      for (const dayData of Object.values(days)) {
        const transactions = (dayData as any)?.transactions || [];
        
        for (const transaction of transactions) {
          if (transaction.type === 'income') {
            monthIncome += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            monthExpenses += transaction.amount || 0;
            
            // Agrupar por categoria (baseado na descrição)
            const category = this.categorizeTransaction(transaction);
            categoryData[category] = (categoryData[category] || 0) + transaction.amount;
          }
        }
      }
      
      monthlyData.push({
        month,
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses
      });
    }
    
    return {
      monthly: monthlyData,
      categories: categoryData,
      trends: dailyTrends
    };
  }

  // Categorizar transação
  private categorizeTransaction(transaction: any): string {
    const description = (transaction.description || '').toLowerCase();
    
    if (description.includes('alimentação') || description.includes('comida') || description.includes('restaurante')) {
      return 'Alimentação';
    } else if (description.includes('transporte') || description.includes('combustível') || description.includes('uber')) {
      return 'Transporte';
    } else if (description.includes('casa') || description.includes('aluguel') || description.includes('condomínio')) {
      return 'Moradia';
    } else if (description.includes('saúde') || description.includes('médico') || description.includes('farmácia')) {
      return 'Saúde';
    } else if (description.includes('educação') || description.includes('curso') || description.includes('livro')) {
      return 'Educação';
    } else {
      return 'Outros';
    }
  }

  // Calcular métricas de performance
  private calculatePerformanceMetrics(year: number, originalData: any, optimizedData: any): PerformanceMetrics {
    const transactionCount = this.countTransactions(originalData);
    const dataSize = JSON.stringify(optimizedData).length;
    
    return {
      year,
      transactionCount,
      dataSize,
      renderTime: 0, // Será atualizado durante o render
      memoryUsage: 0, // Será atualizado durante o uso
      scrollPerformance: 0, // Será atualizado durante scroll
      cacheHitRate: 0 // Será atualizado pelo cache
    };
  }

  // Contar transações
  private countTransactions(data: any): number {
    let count = 0;
    const months = data.months || {};
    
    for (const monthData of Object.values(months)) {
      const days = (monthData as any)?.days || {};
      
      for (const dayData of Object.values(days)) {
        const transactions = (dayData as any)?.transactions || [];
        count += transactions.length;
      }
    }
    
    return count;
  }

  // Calcular taxa de compressão
  private calculateCompressionRatio(originalData: any, optimizedData: any): number {
    const originalSize = JSON.stringify(originalData).length;
    const optimizedSize = JSON.stringify(optimizedData).length;
    
    return originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0;
  }

  // Obter estratégias aplicadas
  private getAppliedStrategies(strategy: OptimizationStrategy): string[] {
    const applied: string[] = [];
    
    if (strategy.virtualization) applied.push('Virtualização');
    if (strategy.pagination) applied.push('Paginação');
    if (strategy.compression) applied.push('Compressão');
    if (strategy.indexing) applied.push('Indexação');
    if (strategy.caching) applied.push('Cache');
    if (strategy.lazyRendering) applied.push('Renderização Lazy');
    if (strategy.dataChunking) applied.push('Chunking de Dados');
    
    return applied;
  }

  // API pública
  getOptimizationStrategy(year: number): OptimizationStrategy | null {
    return this.optimizationStrategies.get(year) || null;
  }

  getPerformanceMetrics(year: number): PerformanceMetrics | null {
    return this.performanceMetrics.get(year) || null;
  }

  getDataChunk(chunkId: string): DataChunk | null {
    return this.dataChunks.get(chunkId) || null;
  }

  getYearIndex(year: number, indexType: string): any {
    const yearIndexes = this.indexes.get(year);
    return yearIndexes?.get(indexType) || null;
  }

  // Configuração de virtualização
  setVirtualizationConfig(config: Partial<VirtualizationConfig>): void {
    this.defaultVirtualizationConfig = { ...this.defaultVirtualizationConfig, ...config };
  }

  getVirtualizationConfig(): VirtualizationConfig {
    return { ...this.defaultVirtualizationConfig };
  }

  // Configuração de paginação
  setPaginationConfig(config: Partial<PaginationConfig>): void {
    this.defaultPaginationConfig = { ...this.defaultPaginationConfig, ...config };
  }

  getPaginationConfig(): PaginationConfig {
    return { ...this.defaultPaginationConfig };
  }

  // Busca otimizada
  async searchInYear(year: number, query: string, type?: 'type' | 'amount' | 'description'): Promise<any[]> {
    const indexes = this.indexes.get(year);
    if (!indexes) {
      throw new Error(`Índices não encontrados para o ano ${year}`);
    }

    const results: any[] = [];
    
    if (type) {
      const index = indexes.get(type);
      if (index) {
        const key = type === 'amount' ? parseFloat(query) : query.toLowerCase();
        results.push(...(index[key] || []));
      }
    } else {
      // Busca em todos os índices
      for (const [indexType, index] of indexes.entries()) {
        if (indexType === 'amount') {
          const amount = parseFloat(query);
          if (!isNaN(amount) && index[amount]) {
            results.push(...index[amount]);
          }
        } else {
          const lowerQuery = query.toLowerCase();
          for (const [key, items] of Object.entries(index)) {
            if (key.includes(lowerQuery)) {
              results.push(...(items as any[]));
            }
          }
        }
      }
    }
    
    // Remover duplicatas
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    return uniqueResults;
  }

  // Limpar otimizações
  clearOptimizations(year?: number): void {
    if (year) {
      this.optimizationStrategies.delete(year);
      this.performanceMetrics.delete(year);
      this.indexes.delete(year);
      
      // Limpar chunks do ano
      for (const [chunkId, chunk] of this.dataChunks.entries()) {
        if (chunk.year === year) {
          this.dataChunks.delete(chunkId);
        }
      }
    } else {
      this.optimizationStrategies.clear();
      this.performanceMetrics.clear();
      this.indexes.clear();
      this.dataChunks.clear();
    }
  }

  // Estatísticas de otimização
  getOptimizationStatistics(): {
    optimizedYears: number;
    totalDataChunks: number;
    totalIndexes: number;
    averageCompressionRatio: number;
    totalMemorySaved: number;
  } {
    const optimizedYears = this.optimizationStrategies.size;
    const totalDataChunks = this.dataChunks.size;
    const totalIndexes = Array.from(this.indexes.values()).reduce((sum, yearIndexes) => sum + yearIndexes.size, 0);
    
    // Calcular estatísticas de compressão
    let totalCompressionRatio = 0;
    let totalMemorySaved = 0;
    
    for (const metrics of this.performanceMetrics.values()) {
      // Estimativas baseadas nas métricas
      totalMemorySaved += metrics.dataSize * 0.3; // Estimativa de 30% de economia
    }
    
    const averageCompressionRatio = optimizedYears > 0 ? totalCompressionRatio / optimizedYears : 0;
    
    return {
      optimizedYears,
      totalDataChunks,
      totalIndexes,
      averageCompressionRatio,
      totalMemorySaved
    };
  }
}

// Instância global
export const yearPerformanceOptimizer = new YearPerformanceOptimizer();

// Hook para usar o otimizador
export function useYearPerformanceOptimizer() {
  const [optimizedYears, setOptimizedYears] = useState<Set<number>>(new Set());
  const [performanceMetrics, setPerformanceMetrics] = useState<Map<number, PerformanceMetrics>>(new Map());

  const optimizeYear = useCallback(async (year: number) => {
    try {
      const result = await yearPerformanceOptimizer.optimizeYear(year);
      
      setOptimizedYears(prev => new Set([...prev, year]));
      setPerformanceMetrics(prev => new Map(prev).set(year, result.metrics));
      
      return result;
    } catch (error) {
      console.error(`Erro ao otimizar ano ${year}:`, error);
      throw error;
    }
  }, []);

  const getStrategy = useCallback((year: number) => {
    return yearPerformanceOptimizer.getOptimizationStrategy(year);
  }, []);

  const getMetrics = useCallback((year: number) => {
    return yearPerformanceOptimizer.getPerformanceMetrics(year);
  }, []);

  const searchInYear = useCallback(async (year: number, query: string, type?: 'type' | 'amount' | 'description') => {
    return await yearPerformanceOptimizer.searchInYear(year, query, type);
  }, []);

  return {
    // Estado
    optimizedYears: Array.from(optimizedYears),
    performanceMetrics: Object.fromEntries(performanceMetrics),
    
    // Métodos
    optimizeYear,
    getStrategy,
    getMetrics,
    searchInYear,
    
    // Configuração
    setVirtualizationConfig: yearPerformanceOptimizer.setVirtualizationConfig.bind(yearPerformanceOptimizer),
    getVirtualizationConfig: yearPerformanceOptimizer.getVirtualizationConfig.bind(yearPerformanceOptimizer),
    setPaginationConfig: yearPerformanceOptimizer.setPaginationConfig.bind(yearPerformanceOptimizer),
    getPaginationConfig: yearPerformanceOptimizer.getPaginationConfig.bind(yearPerformanceOptimizer),
    
    // Utilitários
    clearOptimizations: yearPerformanceOptimizer.clearOptimizations.bind(yearPerformanceOptimizer),
    getStatistics: yearPerformanceOptimizer.getOptimizationStatistics.bind(yearPerformanceOptimizer),
    getDataChunk: yearPerformanceOptimizer.getDataChunk.bind(yearPerformanceOptimizer),
    getYearIndex: yearPerformanceOptimizer.getYearIndex.bind(yearPerformanceOptimizer)
  };
}

export default yearPerformanceOptimizer;