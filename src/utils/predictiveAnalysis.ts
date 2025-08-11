/**
 * Sistema de Análise Preditiva de Performance
 * Prediz problemas futuros e sugere otimizações proativas
 */

import { performanceMonitor } from './realTimePerformanceMonitor';
import { yearManager } from './extendedYearManager';
import { advancedCache } from './advancedPerformanceCache';
import { useEffect } from 'react';
import { useState } from 'react';
import { useState } from 'react';
import { useState } from 'react';

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  lastTrained: number;
  predictions: number;
  correctPredictions: number;
}

export interface PerformancePrediction {
  id: string;
  type: 'performance_degradation' | 'memory_overflow' | 'cache_miss' | 'slow_operation' | 'user_experience';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  timeframe: number; // ms até ocorrer
  description: string;
  impact: string;
  suggestedActions: string[];
  confidence: number; // 0-100
  basedOnMetrics: string[];
  timestamp: number;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading' | 'volatile';
  changeRate: number; // % por período
  confidence: number;
  dataPoints: number;
  timespan: number;
  projection: {
    nextValue: number;
    timeToThreshold: number | null;
    worstCase: number;
    bestCase: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  category: 'cache' | 'memory' | 'rendering' | 'data' | 'network';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedTimeToImplement: number; // horas
  potentialRisks: string[];
  prerequisites: string[];
  metrics: { [key: string]: number };
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  outcomes: { positive: number; negative: number };
  confidence: number;
  lastSeen: number;
}

class PredictiveAnalysisEngine {
  private models: Map<string, PredictionModel> = new Map();
  private predictions: PerformancePrediction[] = [];
  private trends: Map<string, TrendAnalysis> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private historicalData: any[] = [];
  private maxHistorySize = 10000;
  
  private observers: {
    onPrediction: ((prediction: PerformancePrediction) => void)[];
    onSuggestion: ((suggestion: OptimizationSuggestion) => void)[];
  } = {
    onPrediction: [],
    onSuggestion: []
  };

  constructor() {
    this.initializeModels();
    this.startAnalysis();
  }

  // Inicializar modelos preditivos
  private initializeModels(): void {
    // Modelo de degradação de performance
    this.models.set('performance_degradation', {
      id: 'performance_degradation',
      name: 'Degradação de Performance',
      description: 'Prediz quando a performance vai degradar baseado em tendências',
      accuracy: 0.75,
      lastTrained: Date.now(),
      predictions: 0,
      correctPredictions: 0
    });

    // Modelo de overflow de memória
    this.models.set('memory_overflow', {
      id: 'memory_overflow',
      name: 'Overflow de Memória',
      description: 'Prediz quando a memória vai esgotar',
      accuracy: 0.85,
      lastTrained: Date.now(),
      predictions: 0,
      correctPredictions: 0
    });

    // Modelo de cache miss
    this.models.set('cache_miss', {
      id: 'cache_miss',
      name: 'Cache Miss Rate',
      description: 'Prediz quando a taxa de cache miss vai aumentar',
      accuracy: 0.70,
      lastTrained: Date.now(),
      predictions: 0,
      correctPredictions: 0
    });

    // Modelo de operações lentas
    this.models.set('slow_operation', {
      id: 'slow_operation',
      name: 'Operações Lentas',
      description: 'Prediz quando operações vão ficar lentas',
      accuracy: 0.80,
      lastTrained: Date.now(),
      predictions: 0,
      correctPredictions: 0
    });

    // Modelo de experiência do usuário
    this.models.set('user_experience', {
      id: 'user_experience',
      name: 'Experiência do Usuário',
      description: 'Prediz impactos na experiência do usuário',
      accuracy: 0.65,
      lastTrained: Date.now(),
      predictions: 0,
      correctPredictions: 0
    });
  }

  // Iniciar análise contínua
  private startAnalysis(): void {
    // Coletar dados a cada 30 segundos
    setInterval(() => {
      this.collectData();
    }, 30000);

    // Analisar tendências a cada 2 minutos
    setInterval(() => {
      this.analyzeTrends();
    }, 120000);

    // Gerar predições a cada 5 minutos
    setInterval(() => {
      this.generatePredictions();
    }, 300000);

    // Aprender padrões a cada 10 minutos
    setInterval(() => {
      this.learnPatterns();
    }, 600000);
  }

  // Coletar dados de performance
  private collectData(): void {
    try {
      const metrics = performanceMonitor.getLatestMetrics();
      const cacheStats = advancedCache.getStats();
      const yearStats = yearManager.getYearStatistics();

      const dataPoint = {
        timestamp: Date.now(),
        performance: metrics,
        cache: cacheStats,
        years: yearStats,
        memory: this.getMemoryInfo(),
        user: this.getUserActivityMetrics()
      };

      this.historicalData.push(dataPoint);

      // Manter apenas os dados mais recentes
      if (this.historicalData.length > this.maxHistorySize) {
        this.historicalData.shift();
      }

    } catch (error) {
      console.error('Erro ao coletar dados para análise preditiva:', error);
    }
  }

  // Analisar tendências
  private analyzeTrends(): void {
    if (this.historicalData.length < 10) return;

    const metrics = [
      'performance.renderTime',
      'performance.memoryUsage',
      'performance.fps',
      'cache.hitRate',
      'memory.usage',
      'user.actionsPerMinute'
    ];

    for (const metric of metrics) {
      const trend = this.calculateTrend(metric);
      if (trend) {
        this.trends.set(metric, trend);
      }
    }
  }

  // Calcular tendência para uma métrica
  private calculateTrend(metricPath: string): TrendAnalysis | null {
    const values = this.extractMetricValues(metricPath);
    if (values.length < 5) return null;

    // Calcular regressão linear simples
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcular R²
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    // Determinar tendência
    let trend: TrendAnalysis['trend'];
    const changeRate = (slope / yMean) * 100; // % de mudança

    if (Math.abs(changeRate) < 1) {
      trend = 'stable';
    } else if (Math.abs(changeRate) > 10) {
      trend = 'volatile';
    } else if (changeRate > 0) {
      trend = metricPath.includes('hitRate') || metricPath.includes('fps') ? 'improving' : 'degrading';
    } else {
      trend = metricPath.includes('hitRate') || metricPath.includes('fps') ? 'degrading' : 'improving';
    }

    // Projeções
    const nextValue = slope * n + intercept;
    const worstCase = nextValue + (Math.abs(slope) * 2);
    const bestCase = nextValue - (Math.abs(slope) * 2);

    // Tempo até threshold crítico
    let timeToThreshold: number | null = null;
    const thresholds = this.getMetricThresholds(metricPath);
    if (thresholds && slope !== 0) {
      const currentValue = y[y.length - 1];
      const threshold = trend === 'degrading' ? thresholds.critical : thresholds.optimal;
      const stepsToThreshold = (threshold - currentValue) / slope;
      if (stepsToThreshold > 0) {
        timeToThreshold = stepsToThreshold * 30000; // 30s por step
      }
    }

    return {
      metric: metricPath,
      trend,
      changeRate,
      confidence: Math.min(rSquared * 100, 100),
      dataPoints: n,
      timespan: (n - 1) * 30000, // 30s entre pontos
      projection: {
        nextValue,
        timeToThreshold,
        worstCase,
        bestCase
      }
    };
  }

  // Extrair valores de métrica do histórico
  private extractMetricValues(metricPath: string): number[] {
    return this.historicalData
      .map(dataPoint => this.getNestedValue(dataPoint, metricPath))
      .filter(value => typeof value === 'number' && !isNaN(value));
  }

  // Obter valor aninhado de objeto
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Obter thresholds para métricas
  private getMetricThresholds(metricPath: string): { optimal: number; warning: number; critical: number } | null {
    const thresholds: { [key: string]: { optimal: number; warning: number; critical: number } } = {
      'performance.renderTime': { optimal: 50, warning: 100, critical: 200 },
      'performance.memoryUsage': { optimal: 50, warning: 100, critical: 150 },
      'performance.fps': { optimal: 60, warning: 45, critical: 30 },
      'cache.hitRate': { optimal: 90, warning: 70, critical: 50 },
      'memory.usage': { optimal: 50, warning: 100, critical: 200 }
    };

    return thresholds[metricPath] || null;
  }

  // Gerar predições
  private generatePredictions(): void {
    const predictions: PerformancePrediction[] = [];

    // Predição de degradação de performance
    const performancePrediction = this.predictPerformanceDegradation();
    if (performancePrediction) predictions.push(performancePrediction);

    // Predição de overflow de memória
    const memoryPrediction = this.predictMemoryOverflow();
    if (memoryPrediction) predictions.push(memoryPrediction);

    // Predição de problemas de cache
    const cachePrediction = this.predictCacheIssues();
    if (cachePrediction) predictions.push(cachePrediction);

    // Predição de operações lentas
    const slowOpPrediction = this.predictSlowOperations();
    if (slowOpPrediction) predictions.push(slowOpPrediction);

    // Predição de impacto na UX
    const uxPrediction = this.predictUserExperienceImpact();
    if (uxPrediction) predictions.push(uxPrediction);

    // Adicionar predições e notificar
    for (const prediction of predictions) {
      this.predictions.push(prediction);
      this.notifyPredictionObservers(prediction);
      
      // Atualizar estatísticas do modelo
      const model = this.models.get(prediction.type);
      if (model) {
        model.predictions++;
      }
    }

    // Manter apenas predições recentes
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 horas
    this.predictions = this.predictions.filter(p => p.timestamp > cutoff);
  }

  // Predizer degradação de performance
  private predictPerformanceDegradation(): PerformancePrediction | null {
    const renderTimeTrend = this.trends.get('performance.renderTime');
    const fpsTrend = this.trends.get('performance.fps');

    if (!renderTimeTrend && !fpsTrend) return null;

    let probability = 0;
    let timeframe = Infinity;
    const basedOnMetrics: string[] = [];

    if (renderTimeTrend && renderTimeTrend.trend === 'degrading') {
      probability += renderTimeTrend.confidence * 0.6;
      if (renderTimeTrend.projection.timeToThreshold) {
        timeframe = Math.min(timeframe, renderTimeTrend.projection.timeToThreshold);
      }
      basedOnMetrics.push('Tempo de renderização');
    }

    if (fpsTrend && fpsTrend.trend === 'degrading') {
      probability += fpsTrend.confidence * 0.4;
      if (fpsTrend.projection.timeToThreshold) {
        timeframe = Math.min(timeframe, fpsTrend.projection.timeToThreshold);
      }
      basedOnMetrics.push('FPS');
    }

    if (probability < 30) return null;

    return {
      id: `perf_deg_${Date.now()}`,
      type: 'performance_degradation',
      severity: probability > 80 ? 'critical' : probability > 60 ? 'high' : 'medium',
      probability: Math.min(probability, 100),
      timeframe: timeframe === Infinity ? 3600000 : timeframe, // 1 hora default
      description: 'Performance do sistema pode degradar baseado nas tendências atuais',
      impact: 'Usuários podem experimentar lentidão e travamentos',
      suggestedActions: [
        'Otimizar componentes com renderização pesada',
        'Implementar lazy loading adicional',
        'Revisar algoritmos de cálculo',
        'Aumentar cache de componentes'
      ],
      confidence: Math.min((renderTimeTrend?.confidence || 0) + (fpsTrend?.confidence || 0), 100),
      basedOnMetrics,
      timestamp: Date.now()
    };
  }

  // Predizer overflow de memória
  private predictMemoryOverflow(): PerformancePrediction | null {
    const memoryTrend = this.trends.get('performance.memoryUsage');
    if (!memoryTrend || memoryTrend.trend !== 'degrading') return null;

    const probability = memoryTrend.confidence;
    const timeframe = memoryTrend.projection.timeToThreshold || 7200000; // 2 horas

    return {
      id: `mem_overflow_${Date.now()}`,
      type: 'memory_overflow',
      severity: probability > 70 ? 'critical' : 'high',
      probability,
      timeframe,
      description: 'Uso de memória pode exceder limites seguros',
      impact: 'Aplicação pode travar ou ficar muito lenta',
      suggestedActions: [
        'Executar limpeza de memória',
        'Descarregar anos não utilizados',
        'Otimizar cache de dados',
        'Implementar garbage collection forçado'
      ],
      confidence: memoryTrend.confidence,
      basedOnMetrics: ['Uso de memória'],
      timestamp: Date.now()
    };
  }

  // Predizer problemas de cache
  private predictCacheIssues(): PerformancePrediction | null {
    const cacheTrend = this.trends.get('cache.hitRate');
    if (!cacheTrend || cacheTrend.trend !== 'degrading') return null;

    const probability = cacheTrend.confidence * 0.8;

    return {
      id: `cache_issues_${Date.now()}`,
      type: 'cache_miss',
      severity: probability > 60 ? 'high' : 'medium',
      probability,
      timeframe: 1800000, // 30 minutos
      description: 'Taxa de acerto do cache pode diminuir significativamente',
      impact: 'Operações podem ficar mais lentas devido a cache misses',
      suggestedActions: [
        'Revisar estratégia de cache',
        'Aumentar tamanho do cache',
        'Otimizar chaves de cache',
        'Implementar pré-carregamento'
      ],
      confidence: cacheTrend.confidence,
      basedOnMetrics: ['Taxa de acerto do cache'],
      timestamp: Date.now()
    };
  }

  // Predizer operações lentas
  private predictSlowOperations(): PerformancePrediction | null {
    const renderTrend = this.trends.get('performance.renderTime');
    const userActivity = this.getUserActivityMetrics();

    if (!renderTrend || userActivity.actionsPerMinute < 5) return null;

    const probability = renderTrend.confidence * 0.7;

    return {
      id: `slow_ops_${Date.now()}`,
      type: 'slow_operation',
      severity: probability > 70 ? 'high' : 'medium',
      probability,
      timeframe: 900000, // 15 minutos
      description: 'Operações podem ficar mais lentas com o aumento de atividade',
      impact: 'Usuário pode experimentar delays em ações',
      suggestedActions: [
        'Otimizar operações críticas',
        'Implementar debouncing',
        'Usar Web Workers para cálculos',
        'Melhorar algoritmos de busca'
      ],
      confidence: renderTrend.confidence,
      basedOnMetrics: ['Tempo de renderização', 'Atividade do usuário'],
      timestamp: Date.now()
    };
  }

  // Predizer impacto na experiência do usuário
  private predictUserExperienceImpact(): PerformancePrediction | null {
    const trends = Array.from(this.trends.values());
    const degradingTrends = trends.filter(t => t.trend === 'degrading');

    if (degradingTrends.length < 2) return null;

    const avgConfidence = degradingTrends.reduce((sum, t) => sum + t.confidence, 0) / degradingTrends.length;
    const probability = Math.min(avgConfidence * 0.9, 100);

    return {
      id: `ux_impact_${Date.now()}`,
      type: 'user_experience',
      severity: probability > 75 ? 'high' : 'medium',
      probability,
      timeframe: 1800000, // 30 minutos
      description: 'Múltiplas métricas degradando podem impactar a experiência do usuário',
      impact: 'Usuário pode perceber lentidão geral do sistema',
      suggestedActions: [
        'Priorizar otimizações críticas',
        'Implementar modo de performance reduzida',
        'Mostrar indicadores de progresso',
        'Otimizar fluxos principais'
      ],
      confidence: avgConfidence,
      basedOnMetrics: degradingTrends.map(t => t.metric),
      timestamp: Date.now()
    };
  }

  // Aprender padrões
  private learnPatterns(): void {
    if (this.historicalData.length < 50) return;

    // Identificar padrões de uso
    this.identifyUsagePatterns();
    
    // Identificar padrões de performance
    this.identifyPerformancePatterns();
    
    // Atualizar modelos baseado em padrões
    this.updateModelsFromPatterns();
  }

  // Identificar padrões de uso
  private identifyUsagePatterns(): void {
    const recentData = this.historicalData.slice(-100); // Últimos 100 pontos
    
    // Padrão de horário de pico
    const hourlyActivity = new Map<number, number>();
    for (const dataPoint of recentData) {
      const hour = new Date(dataPoint.timestamp).getHours();
      const activity = dataPoint.user?.actionsPerMinute || 0;
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + activity);
    }

    // Identificar horários de pico
    const peakHours = Array.from(hourlyActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    this.updatePattern('peak_hours', {
      pattern: `Horários de pico: ${peakHours.join(', ')}h`,
      frequency: peakHours.length,
      contexts: ['usage', 'timing'],
      outcomes: { positive: 0, negative: 0 },
      confidence: 70,
      lastSeen: Date.now()
    });
  }

  // Identificar padrões de performance
  private identifyPerformancePatterns(): void {
    const recentData = this.historicalData.slice(-50);
    
    // Padrão de degradação após atividade intensa
    let intensiveActivityCount = 0;
    let degradationAfterActivity = 0;

    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i];
      const previous = recentData[i - 1];

      const activityIncrease = (current.user?.actionsPerMinute || 0) > (previous.user?.actionsPerMinute || 0) * 1.5;
      const performanceDrop = (current.performance?.renderTime || 0) > (previous.performance?.renderTime || 0) * 1.2;

      if (activityIncrease) {
        intensiveActivityCount++;
        if (performanceDrop) {
          degradationAfterActivity++;
        }
      }
    }

    if (intensiveActivityCount > 0) {
      const correlation = degradationAfterActivity / intensiveActivityCount;
      
      this.updatePattern('activity_performance_correlation', {
        pattern: 'Performance degrada após atividade intensa',
        frequency: degradationAfterActivity,
        contexts: ['performance', 'activity'],
        outcomes: { positive: intensiveActivityCount - degradationAfterActivity, negative: degradationAfterActivity },
        confidence: correlation * 100,
        lastSeen: Date.now()
      });
    }
  }

  // Atualizar padrão
  private updatePattern(id: string, pattern: Partial<LearningPattern>): void {
    const existing = this.patterns.get(id);
    if (existing) {
      this.patterns.set(id, { ...existing, ...pattern });
    } else {
      this.patterns.set(id, {
        pattern: pattern.pattern || '',
        frequency: pattern.frequency || 0,
        contexts: pattern.contexts || [],
        outcomes: pattern.outcomes || { positive: 0, negative: 0 },
        confidence: pattern.confidence || 0,
        lastSeen: pattern.lastSeen || Date.now()
      });
    }
  }

  // Atualizar modelos baseado em padrões
  private updateModelsFromPatterns(): void {
    for (const [patternId, pattern] of this.patterns.entries()) {
      // Ajustar accuracy dos modelos baseado nos padrões aprendidos
      if (pattern.confidence > 80 && pattern.frequency > 5) {
        for (const context of pattern.contexts) {
          const relatedModels = Array.from(this.models.values())
            .filter(model => model.description.toLowerCase().includes(context));
          
          for (const model of relatedModels) {
            const successRate = pattern.outcomes.positive / (pattern.outcomes.positive + pattern.outcomes.negative);
            model.accuracy = (model.accuracy + successRate) / 2;
          }
        }
      }
    }
  }

  // Gerar sugestões de otimização
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Sugestões baseadas em tendências
    for (const [metric, trend] of this.trends.entries()) {
      if (trend.trend === 'degrading' && trend.confidence > 60) {
        const suggestion = this.createSuggestionForTrend(metric, trend);
        if (suggestion) suggestions.push(suggestion);
      }
    }

    // Sugestões baseadas em padrões
    for (const [patternId, pattern] of this.patterns.entries()) {
      if (pattern.confidence > 70) {
        const suggestion = this.createSuggestionForPattern(patternId, pattern);
        if (suggestion) suggestions.push(suggestion);
      }
    }

    // Ordenar por prioridade
    suggestions.sort((a, b) => {
      const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    return suggestions.slice(0, 10); // Top 10 sugestões
  }

  // Criar sugestão para tendência
  private createSuggestionForTrend(metric: string, trend: TrendAnalysis): OptimizationSuggestion | null {
    const suggestions: { [key: string]: Partial<OptimizationSuggestion> } = {
      'performance.renderTime': {
        category: 'rendering',
        title: 'Otimizar Tempo de Renderização',
        description: 'Implementar memoização e lazy loading para reduzir tempo de render',
        expectedImprovement: `Redução de ${Math.abs(trend.changeRate).toFixed(1)}% no tempo de render`,
        implementationEffort: 'medium',
        estimatedTimeToImplement: 4
      },
      'performance.memoryUsage': {
        category: 'memory',
        title: 'Otimizar Uso de Memória',
        description: 'Implementar limpeza automática e gerenciamento de memória',
        expectedImprovement: `Redução de ${Math.abs(trend.changeRate).toFixed(1)}% no uso de memória`,
        implementationEffort: 'high',
        estimatedTimeToImplement: 8
      },
      'cache.hitRate': {
        category: 'cache',
        title: 'Melhorar Estratégia de Cache',
        description: 'Otimizar algoritmos de cache e aumentar taxa de acerto',
        expectedImprovement: `Aumento de ${Math.abs(trend.changeRate).toFixed(1)}% na taxa de acerto`,
        implementationEffort: 'medium',
        estimatedTimeToImplement: 6
      }
    };

    const template = suggestions[metric];
    if (!template) return null;

    return {
      id: `trend_${metric}_${Date.now()}`,
      priority: trend.confidence > 80 ? 'high' : 'medium',
      potentialRisks: ['Pode afetar funcionalidades existentes'],
      prerequisites: ['Backup dos dados', 'Testes de performance'],
      metrics: {
        confidence: trend.confidence,
        changeRate: trend.changeRate,
        dataPoints: trend.dataPoints
      },
      ...template
    } as OptimizationSuggestion;
  }

  // Criar sugestão para padrão
  private createSuggestionForPattern(patternId: string, pattern: LearningPattern): OptimizationSuggestion | null {
    if (patternId === 'activity_performance_correlation') {
      return {
        id: `pattern_${patternId}_${Date.now()}`,
        category: 'performance',
        priority: 'high',
        title: 'Otimizar Performance Durante Picos de Atividade',
        description: 'Implementar throttling e otimizações para períodos de alta atividade',
        expectedImprovement: 'Manter performance estável durante picos de uso',
        implementationEffort: 'medium',
        estimatedTimeToImplement: 6,
        potentialRisks: ['Pode limitar responsividade em alguns casos'],
        prerequisites: ['Análise de padrões de uso'],
        metrics: {
          confidence: pattern.confidence,
          frequency: pattern.frequency
        }
      };
    }

    return null;
  }

  // Métodos utilitários
  private getMemoryInfo(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      };
    }
    return { usage: 0, limit: 0, total: 0 };
  }

  private getUserActivityMetrics(): any {
    // Simular métricas de atividade do usuário
    return {
      actionsPerMinute: Math.random() * 20,
      clicksPerMinute: Math.random() * 15,
      scrollsPerMinute: Math.random() * 10,
      navigationPerMinute: Math.random() * 2
    };
  }

  // API pública
  getPredictions(): PerformancePrediction[] {
    return [...this.predictions];
  }

  getActivePredictions(): PerformancePrediction[] {
    const now = Date.now();
    return this.predictions.filter(p => p.timestamp + p.timeframe > now);
  }

  getTrends(): TrendAnalysis[] {
    return Array.from(this.trends.values());
  }

  getPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values());
  }

  getModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  // Observadores
  subscribeToPredictions(callback: (prediction: PerformancePrediction) => void): () => void {
    this.observers.onPrediction.push(callback);
    return () => {
      const index = this.observers.onPrediction.indexOf(callback);
      if (index > -1) this.observers.onPrediction.splice(index, 1);
    };
  }

  subscribeToSuggestions(callback: (suggestion: OptimizationSuggestion) => void): () => void {
    this.observers.onSuggestion.push(callback);
    return () => {
      const index = this.observers.onSuggestion.indexOf(callback);
      if (index > -1) this.observers.onSuggestion.splice(index, 1);
    };
  }

  private notifyPredictionObservers(prediction: PerformancePrediction): void {
    this.observers.onPrediction.forEach(callback => {
      try {
        callback(prediction);
      } catch (error) {
        console.error('Erro no observer de predições:', error);
      }
    });
  }

  private notifySuggestionObservers(suggestion: OptimizationSuggestion): void {
    this.observers.onSuggestion.forEach(callback => {
      try {
        callback(suggestion);
      } catch (error) {
        console.error('Erro no observer de sugestões:', error);
      }
    });
  }
}

// Instância global
export const predictiveAnalysis = new PredictiveAnalysisEngine();

// Hook para usar análise preditiva
export function usePredictiveAnalysis() {
  const [predictions, setPredictions] = useState<PerformancePrediction[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  useEffect(() => {
    const unsubscribePredictions = predictiveAnalysis.subscribeToPredictions((prediction) => {
      setPredictions(prev => [...prev, prediction]);
    });

    const unsubscribeSuggestions = predictiveAnalysis.subscribeToSuggestions((suggestion) => {
      setSuggestions(prev => [...prev, suggestion]);
    });

    // Atualizar dados periodicamente
    const interval = setInterval(() => {
      setTrends(predictiveAnalysis.getTrends());
      setSuggestions(predictiveAnalysis.generateOptimizationSuggestions());
    }, 60000); // A cada minuto

    return () => {
      unsubscribePredictions();
      unsubscribeSuggestions();
      clearInterval(interval);
    };
  }, []);

  return {
    predictions,
    activePredictions: predictions.filter(p => p.timestamp + p.timeframe > Date.now()),
    trends,
    suggestions,
    patterns: predictiveAnalysis.getPatterns(),
    models: predictiveAnalysis.getModels()
  };
}

export default predictiveAnalysis;