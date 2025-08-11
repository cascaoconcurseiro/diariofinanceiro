/**
 * Sistema de Testes Automatizados de Performance
 * Executa testes contínuos de performance e detecta regressões
 */

import { performanceMonitor } from './realTimePerformanceMonitor';
import { advancedCache } from './advancedPerformanceCache';
import { webWorkerManager } from './webWorkerManager';

export interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  category: 'rendering' | 'memory' | 'cache' | 'network' | 'computation' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  setup?: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup?: () => Promise<void>;
  expectedMetrics: {
    maxRenderTime?: number;
    maxMemoryUsage?: number;
    minCacheHitRate?: number;
    maxNetworkLatency?: number;
    minFPS?: number;
  };
}

export interface TestResult {
  testId: string;
  success: boolean;
  executionTime: number;
  metrics: {
    renderTime?: number;
    memoryUsage?: number;
    cacheHitRate?: number;
    networkLatency?: number;
    fps?: number;
    [key: string]: number | undefined;
  };
  errors: string[];
  warnings: string[];
  details?: any;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: string[];
  parallel: boolean;
  schedule?: {
    interval: number;
    enabled: boolean;
  };
}

export interface TestReport {
  id: string;
  suiteId: string;
  timestamp: number;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    performanceScore: number;
    regressions: string[];
    improvements: string[];
  };
}

export interface PerformanceBenchmark {
  metric: string;
  baseline: number;
  current: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
  significance: number;
}

class AutomatedPerformanceTesting {
  private tests: Map<string, PerformanceTest> = new Map();
  private suites: Map<string, TestSuite> = new Map();
  private reports: TestReport[] = [];
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private isRunning = false;
  private observers: ((report: TestReport) => void)[] = [];

  constructor() {
    this.initializeDefaultTests();
    this.initializeDefaultSuites();
    this.startScheduledTesting();
  }

  // Inicializar testes padrão
  private initializeDefaultTests(): void {
    // Teste de renderização
    this.addTest({
      id: 'render_performance',
      name: 'Performance de Renderização',
      description: 'Testa tempo de renderização de componentes principais',
      category: 'rendering',
      priority: 'high',
      timeout: 10000,
      execute: this.testRenderPerformance.bind(this),
      expectedMetrics: {
        maxRenderTime: 100,
        minFPS: 45
      }
    });

    // Teste de memória
    this.addTest({
      id: 'memory_usage',
      name: 'Uso de Memória',
      description: 'Testa consumo de memória durante operações típicas',
      category: 'memory',
      priority: 'high',
      timeout: 15000,
      execute: this.testMemoryUsage.bind(this),
      expectedMetrics: {
        maxMemoryUsage: 150
      }
    });

    // Teste de cache
    this.addTest({
      id: 'cache_performance',
      name: 'Performance do Cache',
      description: 'Testa eficiência do sistema de cache',
      category: 'cache',
      priority: 'medium',
      timeout: 5000,
      execute: this.testCachePerformance.bind(this),
      expectedMetrics: {
        minCacheHitRate: 80
      }
    });

    // Teste de cálculos financeiros
    this.addTest({
      id: 'financial_calculations',
      name: 'Cálculos Financeiros',
      description: 'Testa performance de cálculos financeiros complexos',
      category: 'computation',
      priority: 'high',
      timeout: 8000,
      execute: this.testFinancialCalculations.bind(this),
      expectedMetrics: {
        maxRenderTime: 200
      }
    });

    // Teste de navegação entre anos
    this.addTest({
      id: 'year_navigation',
      name: 'Navegação Entre Anos',
      description: 'Testa performance de navegação entre diferentes anos',
      category: 'integration',
      priority: 'medium',
      timeout: 12000,
      execute: this.testYearNavigation.bind(this),
      expectedMetrics: {
        maxRenderTime: 150
      }
    });

    // Teste de carregamento de dados
    this.addTest({
      id: 'data_loading',
      name: 'Carregamento de Dados',
      description: 'Testa performance de carregamento de grandes volumes de dados',
      category: 'network',
      priority: 'medium',
      timeout: 10000,
      execute: this.testDataLoading.bind(this),
      expectedMetrics: {
        maxNetworkLatency: 1000
      }
    });

    // Teste de stress
    this.addTest({
      id: 'stress_test',
      name: 'Teste de Stress',
      description: 'Testa sistema sob carga pesada',
      category: 'integration',
      priority: 'low',
      timeout: 30000,
      execute: this.testStress.bind(this),
      expectedMetrics: {
        maxRenderTime: 300,
        maxMemoryUsage: 200
      }
    });
  }

  // Inicializar suítes padrão
  private initializeDefaultSuites(): void {
    this.addSuite({
      id: 'core_performance',
      name: 'Performance Principal',
      description: 'Testes essenciais de performance',
      tests: ['render_performance', 'memory_usage', 'cache_performance'],
      parallel: false,
      schedule: {
        interval: 300000, // 5 minutos
        enabled: true
      }
    });

    this.addSuite({
      id: 'financial_operations',
      name: 'Operações Financeiras',
      description: 'Testes específicos de funcionalidades financeiras',
      tests: ['financial_calculations', 'year_navigation', 'data_loading'],
      parallel: true,
      schedule: {
        interval: 600000, // 10 minutos
        enabled: true
      }
    });

    this.addSuite({
      id: 'stress_testing',
      name: 'Testes de Stress',
      description: 'Testes de carga e stress do sistema',
      tests: ['stress_test'],
      parallel: false,
      schedule: {
        interval: 1800000, // 30 minutos
        enabled: false
      }
    });
  }

  // Implementações dos testes
  private async testRenderPerformance(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      // Simular renderização de componente pesado
      const renderStart = performance.now();
      
      // Criar elementos DOM para teste
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // Renderizar múltiplos elementos
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.textContent = `Item ${i}`;
        element.style.padding = '10px';
        element.style.border = '1px solid #ccc';
        container.appendChild(element);
      }

      // Forçar reflow
      container.offsetHeight;

      const renderTime = performance.now() - renderStart;
      metrics.renderTime = renderTime;

      // Medir FPS durante animação
      const fpsStart = performance.now();
      let frameCount = 0;
      
      const measureFPS = () => {
        frameCount++;
        if (performance.now() - fpsStart < 1000) {
          requestAnimationFrame(measureFPS);
        } else {
          metrics.fps = frameCount;
        }
      };
      
      requestAnimationFrame(measureFPS);
      
      // Aguardar medição de FPS
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Limpar
      document.body.removeChild(container);

      // Verificar métricas
      if (renderTime > 100) {
        warnings.push(`Tempo de renderização alto: ${renderTime.toFixed(2)}ms`);
      }

      if (metrics.fps && metrics.fps < 45) {
        warnings.push(`FPS baixo: ${metrics.fps}`);
      }

    } catch (error) {
      errors.push(`Erro no teste de renderização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'render_performance',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testMemoryUsage(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      const initialMemory = this.getMemoryUsage();
      
      // Criar objetos para consumir memória
      const largeArray: any[] = [];
      for (let i = 0; i < 100000; i++) {
        largeArray.push({
          id: i,
          data: new Array(100).fill(Math.random()),
          timestamp: Date.now()
        });
      }

      const peakMemory = this.getMemoryUsage();
      metrics.memoryUsage = peakMemory - initialMemory;

      // Limpar referências
      largeArray.length = 0;

      // Forçar garbage collection se disponível
      if ((window as any).gc) {
        (window as any).gc();
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMemory = this.getMemoryUsage();
      const memoryLeak = finalMemory - initialMemory;

      if (memoryLeak > 10) {
        warnings.push(`Possível vazamento de memória: ${memoryLeak.toFixed(2)}MB`);
      }

      if (metrics.memoryUsage > 150) {
        warnings.push(`Uso de memória alto: ${metrics.memoryUsage.toFixed(2)}MB`);
      }

    } catch (error) {
      errors.push(`Erro no teste de memória: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'memory_usage',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testCachePerformance(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      // Limpar cache para teste limpo
      advancedCache.clear();

      // Teste de escrita no cache
      const writeStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        await advancedCache.set(`test_key_${i}`, { data: `test_data_${i}` }, 60000);
      }
      const writeTime = performance.now() - writeStart;

      // Teste de leitura do cache
      const readStart = performance.now();
      let hits = 0;
      for (let i = 0; i < 1000; i++) {
        const result = await advancedCache.get(`test_key_${i}`);
        if (result) hits++;
      }
      const readTime = performance.now() - readStart;

      const hitRate = (hits / 1000) * 100;
      metrics.cacheHitRate = hitRate;

      // Limpar cache de teste
      for (let i = 0; i < 1000; i++) {
        advancedCache.invalidatePattern(`test_key_${i}`);
      }

      if (hitRate < 80) {
        warnings.push(`Taxa de acerto do cache baixa: ${hitRate.toFixed(2)}%`);
      }

      if (writeTime > 1000) {
        warnings.push(`Tempo de escrita no cache alto: ${writeTime.toFixed(2)}ms`);
      }

      if (readTime > 500) {
        warnings.push(`Tempo de leitura do cache alto: ${readTime.toFixed(2)}ms`);
      }

    } catch (error) {
      errors.push(`Erro no teste de cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'cache_performance',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testFinancialCalculations(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      // Gerar dados de teste
      const transactions = [];
      for (let i = 0; i < 10000; i++) {
        transactions.push({
          id: i,
          type: Math.random() > 0.5 ? 'income' : 'expense',
          amount: Math.random() * 1000,
          description: `Transaction ${i}`,
          date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        });
      }

      // Teste usando Web Worker
      const calcStart = performance.now();
      const result = await webWorkerManager.calculateBalance(transactions);
      const calcTime = performance.now() - calcStart;

      metrics.renderTime = calcTime;

      if (calcTime > 200) {
        warnings.push(`Cálculo financeiro lento: ${calcTime.toFixed(2)}ms`);
      }

      // Validar resultado
      if (!result || typeof result.balance !== 'number') {
        errors.push('Resultado de cálculo inválido');
      }

    } catch (error) {
      errors.push(`Erro no teste de cálculos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'financial_calculations',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testYearNavigation(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      // Simular navegação entre anos
      const years = [2024, 2025, 2026, 2027, 2028];
      let totalNavigationTime = 0;

      for (let i = 0; i < years.length - 1; i++) {
        const navStart = performance.now();
        
        // Simular carregamento de dados do ano
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        const navTime = performance.now() - navStart;
        totalNavigationTime += navTime;
      }

      const avgNavigationTime = totalNavigationTime / (years.length - 1);
      metrics.renderTime = avgNavigationTime;

      if (avgNavigationTime > 150) {
        warnings.push(`Navegação entre anos lenta: ${avgNavigationTime.toFixed(2)}ms`);
      }

    } catch (error) {
      errors.push(`Erro no teste de navegação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'year_navigation',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testDataLoading(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      // Simular carregamento de dados
      const loadStart = performance.now();
      
      // Simular requisição de rede
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      
      const loadTime = performance.now() - loadStart;
      metrics.networkLatency = loadTime;

      if (loadTime > 1000) {
        warnings.push(`Carregamento de dados lento: ${loadTime.toFixed(2)}ms`);
      }

      // Simular processamento de dados
      const processStart = performance.now();
      const largeDataSet = new Array(50000).fill(0).map((_, i) => ({
        id: i,
        value: Math.random() * 1000
      }));
      
      // Processar dados
      const processed = largeDataSet.filter(item => item.value > 500).length;
      const processTime = performance.now() - processStart;

      if (processTime > 200) {
        warnings.push(`Processamento de dados lento: ${processTime.toFixed(2)}ms`);
      }

    } catch (error) {
      errors.push(`Erro no teste de carregamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'data_loading',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  private async testStress(): Promise<TestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: TestResult['metrics'] = {};

    try {
      const initialMemory = this.getMemoryUsage();

      // Stress test com múltiplas operações simultâneas
      const promises = [];
      
      // Múltiplos cálculos
      for (let i = 0; i < 10; i++) {
        const transactions = new Array(1000).fill(0).map((_, j) => ({
          id: j,
          type: Math.random() > 0.5 ? 'income' : 'expense',
          amount: Math.random() * 100
        }));
        
        promises.push(webWorkerManager.calculateBalance(transactions));
      }

      // Múltiplas operações de cache
      for (let i = 0; i < 100; i++) {
        promises.push(advancedCache.set(`stress_${i}`, { data: new Array(100).fill(i) }));
      }

      const stressStart = performance.now();
      await Promise.all(promises);
      const stressTime = performance.now() - stressStart;

      metrics.renderTime = stressTime;
      
      const peakMemory = this.getMemoryUsage();
      metrics.memoryUsage = peakMemory - initialMemory;

      if (stressTime > 300) {
        warnings.push(`Teste de stress lento: ${stressTime.toFixed(2)}ms`);
      }

      if (metrics.memoryUsage > 200) {
        warnings.push(`Alto uso de memória no stress test: ${metrics.memoryUsage.toFixed(2)}MB`);
      }

      // Limpar dados de teste
      for (let i = 0; i < 100; i++) {
        advancedCache.invalidatePattern(`stress_${i}`);
      }

    } catch (error) {
      errors.push(`Erro no teste de stress: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      testId: 'stress_test',
      success: errors.length === 0,
      executionTime: performance.now() - startTime,
      metrics,
      errors,
      warnings
    };
  }

  // Executar teste individual
  async runTest(testId: string): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Teste não encontrado: ${testId}`);
    }

    console.log(`Executando teste: ${test.name}`);

    try {
      // Setup
      if (test.setup) {
        await test.setup();
      }

      // Executar com timeout
      const result = await Promise.race([
        test.execute(),
        new Promise<TestResult>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), test.timeout)
        )
      ]);

      // Cleanup
      if (test.cleanup) {
        await test.cleanup();
      }

      // Validar métricas esperadas
      this.validateExpectedMetrics(result, test.expectedMetrics);

      return result;

    } catch (error) {
      return {
        testId,
        success: false,
        executionTime: 0,
        metrics: {},
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        warnings: []
      };
    }
  }

  // Executar suíte de testes
  async runSuite(suiteId: string): Promise<TestReport> {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Suíte não encontrada: ${suiteId}`);
    }

    console.log(`Executando suíte: ${suite.name}`);

    const startTime = performance.now();
    const results: TestResult[] = [];

    try {
      if (suite.parallel) {
        // Executar testes em paralelo
        const promises = suite.tests.map(testId => this.runTest(testId));
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
      } else {
        // Executar testes sequencialmente
        for (const testId of suite.tests) {
          const result = await this.runTest(testId);
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Erro na execução da suíte ${suiteId}:`, error);
    }

    const duration = performance.now() - startTime;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.length - passedTests;

    const report: TestReport = {
      id: `report_${Date.now()}`,
      suiteId,
      timestamp: Date.now(),
      duration,
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      summary: this.generateSummary(results)
    };

    this.reports.push(report);
    this.updateBenchmarks(results);
    this.notifyObservers(report);

    return report;
  }

  // Validar métricas esperadas
  private validateExpectedMetrics(result: TestResult, expected: PerformanceTest['expectedMetrics']): void {
    for (const [metric, expectedValue] of Object.entries(expected)) {
      const actualValue = result.metrics[metric];
      
      if (actualValue !== undefined) {
        if (metric.startsWith('max') && actualValue > expectedValue) {
          result.warnings.push(`${metric} excedeu o esperado: ${actualValue} > ${expectedValue}`);
        } else if (metric.startsWith('min') && actualValue < expectedValue) {
          result.warnings.push(`${metric} abaixo do esperado: ${actualValue} < ${expectedValue}`);
        }
      }
    }
  }

  // Gerar resumo do relatório
  private generateSummary(results: TestResult[]): TestReport['summary'] {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let overallHealth: TestReport['summary']['overallHealth'];
    if (successRate >= 95) overallHealth = 'excellent';
    else if (successRate >= 85) overallHealth = 'good';
    else if (successRate >= 70) overallHealth = 'fair';
    else if (successRate >= 50) overallHealth = 'poor';
    else overallHealth = 'critical';

    const performanceScore = this.calculatePerformanceScore(results);
    const regressions = this.detectRegressions(results);
    const improvements = this.detectImprovements(results);

    return {
      overallHealth,
      performanceScore,
      regressions,
      improvements
    };
  }

  // Calcular score de performance
  private calculatePerformanceScore(results: TestResult[]): number {
    let totalScore = 0;
    let validResults = 0;

    for (const result of results) {
      if (result.success) {
        let score = 100;
        
        // Penalizar por warnings
        score -= result.warnings.length * 5;
        
        // Penalizar por métricas ruins
        if (result.metrics.renderTime && result.metrics.renderTime > 100) {
          score -= Math.min((result.metrics.renderTime - 100) / 10, 30);
        }
        
        if (result.metrics.memoryUsage && result.metrics.memoryUsage > 100) {
          score -= Math.min((result.metrics.memoryUsage - 100) / 10, 20);
        }
        
        if (result.metrics.cacheHitRate && result.metrics.cacheHitRate < 80) {
          score -= (80 - result.metrics.cacheHitRate) / 2;
        }

        totalScore += Math.max(score, 0);
        validResults++;
      }
    }

    return validResults > 0 ? totalScore / validResults : 0;
  }

  // Detectar regressões
  private detectRegressions(results: TestResult[]): string[] {
    const regressions: string[] = [];

    for (const result of results) {
      const benchmark = this.benchmarks.get(result.testId);
      if (benchmark) {
        const metricValue = result.metrics[benchmark.metric];
        if (metricValue !== undefined) {
          const degradation = ((metricValue - benchmark.baseline) / benchmark.baseline) * 100;
          
          if (degradation > benchmark.threshold) {
            regressions.push(`${result.testId}: ${benchmark.metric} degradou ${degradation.toFixed(1)}%`);
          }
        }
      }
    }

    return regressions;
  }

  // Detectar melhorias
  private detectImprovements(results: TestResult[]): string[] {
    const improvements: string[] = [];

    for (const result of results) {
      const benchmark = this.benchmarks.get(result.testId);
      if (benchmark) {
        const metricValue = result.metrics[benchmark.metric];
        if (metricValue !== undefined) {
          const improvement = ((benchmark.baseline - metricValue) / benchmark.baseline) * 100;
          
          if (improvement > 10) {
            improvements.push(`${result.testId}: ${benchmark.metric} melhorou ${improvement.toFixed(1)}%`);
          }
        }
      }
    }

    return improvements;
  }

  // Atualizar benchmarks
  private updateBenchmarks(results: TestResult[]): void {
    for (const result of results) {
      if (result.success) {
        for (const [metric, value] of Object.entries(result.metrics)) {
          if (typeof value === 'number') {
            const benchmarkKey = `${result.testId}_${metric}`;
            const existing = this.benchmarks.get(benchmarkKey);
            
            if (existing) {
              existing.current = value;
              
              // Atualizar tendência
              const change = ((value - existing.baseline) / existing.baseline) * 100;
              if (Math.abs(change) < 5) {
                existing.trend = 'stable';
              } else if (change > 0) {
                existing.trend = metric.includes('hitRate') || metric.includes('fps') ? 'improving' : 'degrading';
              } else {
                existing.trend = metric.includes('hitRate') || metric.includes('fps') ? 'degrading' : 'improving';
              }
            } else {
              this.benchmarks.set(benchmarkKey, {
                metric,
                baseline: value,
                current: value,
                threshold: 20, // 20% de degradação
                trend: 'stable',
                significance: 0
              });
            }
          }
        }
      }
    }
  }

  // Iniciar testes agendados
  private startScheduledTesting(): void {
    for (const [suiteId, suite] of this.suites.entries()) {
      if (suite.schedule?.enabled) {
        setInterval(async () => {
          if (!this.isRunning) {
            this.isRunning = true;
            try {
              await this.runSuite(suiteId);
            } catch (error) {
              console.error(`Erro no teste agendado ${suiteId}:`, error);
            } finally {
              this.isRunning = false;
            }
          }
        }, suite.schedule.interval);
      }
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

  // API pública
  addTest(test: PerformanceTest): void {
    this.tests.set(test.id, test);
  }

  addSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
  }

  getTests(): PerformanceTest[] {
    return Array.from(this.tests.values());
  }

  getSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  getReports(): TestReport[] {
    return [...this.reports];
  }

  getLatestReport(suiteId?: string): TestReport | null {
    const filtered = suiteId ? 
      this.reports.filter(r => r.suiteId === suiteId) : 
      this.reports;
    
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  // Observadores
  subscribe(callback: (report: TestReport) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) this.observers.splice(index, 1);
    };
  }

  private notifyObservers(report: TestReport): void {
    this.observers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Erro no observer de testes:', error);
      }
    });
  }
}

// Instância global
export const performanceTesting = new AutomatedPerformanceTesting();

// Hook para usar testes de performance
export function usePerformanceTesting() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = performanceTesting.subscribe((report) => {
      setReports(prev => [...prev, report]);
    });

    // Carregar relatórios existentes
    setReports(performanceTesting.getReports());

    return unsubscribe;
  }, []);

  const runTest = useCallback(async (testId: string) => {
    setIsRunning(true);
    try {
      return await performanceTesting.runTest(testId);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const runSuite = useCallback(async (suiteId: string) => {
    setIsRunning(true);
    try {
      return await performanceTesting.runSuite(suiteId);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    reports,
    isRunning,
    tests: performanceTesting.getTests(),
    suites: performanceTesting.getSuites(),
    benchmarks: performanceTesting.getBenchmarks(),
    runTest,
    runSuite,
    getLatestReport: performanceTesting.getLatestReport.bind(performanceTesting)
  };
}

export default performanceTesting;