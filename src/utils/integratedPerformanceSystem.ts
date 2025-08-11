/**
 * Sistema Integrado de Performance Avançada
 * Orquestra todos os sistemas de otimização em uma solução unificada
 */

import { advancedCache } from './advancedPerformanceCache';
import { performanceMonitor } from './realTimePerformanceMonitor';
import { bugDetector } from './proactiveBugDetector';
import { autoCorrectionSystem } from './autoCorrectionSystem';
import { dataValidator } from './advancedDataValidator';
import { yearManager } from './extendedYearManager';
import { yearLazyLoader } from './yearLazyLoader';
import { yearPerformanceOptimizer } from './yearPerformanceOptimizer';
import { advancedMemoryManager } from './advancedMemoryManager';
import { optimizedDataStorage } from './optimizedDataStorage';
import { cleanupSystem } from './automaticCleanupSystem';
import { webWorkerManager } from './webWorkerManager';
import { predictiveAnalysis } from './predictiveAnalysis';
import { performanceTesting } from './automatedPerformanceTesting';

export interface SystemConfiguration {
  // Cache Configuration
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    compressionEnabled: boolean;
    multiLevelEnabled: boolean;
  };
  
  // Performance Monitoring
  monitoring: {
    enabled: boolean;
    interval: number;
    alertThresholds: {
      renderTime: number;
      memoryUsage: number;
      cacheHitRate: number;
      fps: number;
    };
  };
  
  // Bug Detection
  bugDetection: {
    enabled: boolean;
    detectionInterval: number;
    autoCorrection: boolean;
    severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Data Validation
  validation: {
    enabled: boolean;
    level: 'basic' | 'standard' | 'comprehensive' | 'paranoid';
    autoFix: boolean;
    scheduleInterval: number;
  };
  
  // Year Management
  yearManagement: {
    lazyLoading: boolean;
    preloadRadius: number;
    optimizationEnabled: boolean;
    compressionThreshold: number;
  };
  
  // Memory Management
  memoryManagement: {
    enabled: boolean;
    maxUsage: number;
    cleanupInterval: number;
    aggressiveMode: boolean;
  };
  
  // Cleanup System
  cleanup: {
    enabled: boolean;
    schedules: {
      cache: number;
      oldData: number;
      logs: number;
      tempData: number;
    };
  };
  
  // Web Workers
  webWorkers: {
    enabled: boolean;
    maxWorkers: number;
    taskTimeout: number;
  };
  
  // Predictive Analysis
  predictiveAnalysis: {
    enabled: boolean;
    modelAccuracyThreshold: number;
    predictionHorizon: number;
  };
  
  // Performance Testing
  testing: {
    enabled: boolean;
    scheduledSuites: string[];
    regressionThreshold: number;
  };
}

export interface SystemStatus {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  components: {
    cache: ComponentStatus;
    monitoring: ComponentStatus;
    bugDetection: ComponentStatus;
    validation: ComponentStatus;
    yearManagement: ComponentStatus;
    memoryManagement: ComponentStatus;
    cleanup: ComponentStatus;
    webWorkers: ComponentStatus;
    predictiveAnalysis: ComponentStatus;
    testing: ComponentStatus;
  };
  metrics: {
    performanceScore: number;
    reliabilityScore: number;
    efficiencyScore: number;
    userExperienceScore: number;
  };
  recommendations: string[];
  lastUpdate: number;
}

export interface ComponentStatus {
  status: 'active' | 'inactive' | 'error' | 'warning';
  health: number; // 0-100
  lastActivity: number;
  metrics: { [key: string]: number };
  issues: string[];
}

export interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  configuration: Partial<SystemConfiguration>;
  targetScenario: 'development' | 'production' | 'testing' | 'low_resource' | 'high_performance';
}

class IntegratedPerformanceSystem {
  private configuration: SystemConfiguration;
  private status: SystemStatus;
  private profiles: Map<string, PerformanceProfile> = new Map();
  private activeProfile: string | null = null;
  private observers: ((status: SystemStatus) => void)[] = [];
  private isInitialized = false;
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
    this.status = this.getInitialStatus();
    this.initializeProfiles();
  }

  // Configuração padrão
  private getDefaultConfiguration(): SystemConfiguration {
    return {
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 300000,
        compressionEnabled: true,
        multiLevelEnabled: true
      },
      monitoring: {
        enabled: true,
        interval: 1000,
        alertThresholds: {
          renderTime: 100,
          memoryUsage: 150,
          cacheHitRate: 80,
          fps: 45
        }
      },
      bugDetection: {
        enabled: true,
        detectionInterval: 5000,
        autoCorrection: true,
        severityThreshold: 'medium'
      },
      validation: {
        enabled: true,
        level: 'standard',
        autoFix: true,
        scheduleInterval: 300000
      },
      yearManagement: {
        lazyLoading: true,
        preloadRadius: 2,
        optimizationEnabled: true,
        compressionThreshold: 1024
      },
      memoryManagement: {
        enabled: true,
        maxUsage: 200,
        cleanupInterval: 60000,
        aggressiveMode: false
      },
      cleanup: {
        enabled: true,
        schedules: {
          cache: 300000,
          oldData: 86400000,
          logs: 1800000,
          tempData: 600000
        }
      },
      webWorkers: {
        enabled: true,
        maxWorkers: navigator.hardwareConcurrency || 4,
        taskTimeout: 30000
      },
      predictiveAnalysis: {
        enabled: true,
        modelAccuracyThreshold: 0.7,
        predictionHorizon: 3600000
      },
      testing: {
        enabled: true,
        scheduledSuites: ['core_performance'],
        regressionThreshold: 20
      }
    };
  }

  // Status inicial
  private getInitialStatus(): SystemStatus {
    return {
      overall: 'good',
      components: {
        cache: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        monitoring: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        bugDetection: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        validation: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        yearManagement: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        memoryManagement: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        cleanup: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        webWorkers: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        predictiveAnalysis: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] },
        testing: { status: 'inactive', health: 100, lastActivity: 0, metrics: {}, issues: [] }
      },
      metrics: {
        performanceScore: 85,
        reliabilityScore: 90,
        efficiencyScore: 80,
        userExperienceScore: 85
      },
      recommendations: [],
      lastUpdate: Date.now()
    };
  }

  // Inicializar perfis
  private initializeProfiles(): void {
    // Perfil de desenvolvimento
    this.profiles.set('development', {
      id: 'development',
      name: 'Desenvolvimento',
      description: 'Configuração otimizada para desenvolvimento com debugging avançado',
      targetScenario: 'development',
      configuration: {
        monitoring: { enabled: true, interval: 500 },
        bugDetection: { enabled: true, detectionInterval: 2000, autoCorrection: false },
        validation: { level: 'comprehensive', autoFix: false },
        testing: { enabled: true, scheduledSuites: ['core_performance', 'financial_operations'] }
      }
    });

    // Perfil de produção
    this.profiles.set('production', {
      id: 'production',
      name: 'Produção',
      description: 'Configuração otimizada para ambiente de produção',
      targetScenario: 'production',
      configuration: {
        monitoring: { enabled: true, interval: 2000 },
        bugDetection: { enabled: true, detectionInterval: 10000, autoCorrection: true },
        validation: { level: 'standard', autoFix: true },
        cleanup: { enabled: true },
        predictiveAnalysis: { enabled: true }
      }
    });

    // Perfil de baixo recurso
    this.profiles.set('low_resource', {
      id: 'low_resource',
      name: 'Baixo Recurso',
      description: 'Configuração para dispositivos com recursos limitados',
      targetScenario: 'low_resource',
      configuration: {
        cache: { maxSize: 50, compressionEnabled: true },
        monitoring: { enabled: true, interval: 5000 },
        bugDetection: { enabled: true, detectionInterval: 30000 },
        webWorkers: { enabled: false },
        predictiveAnalysis: { enabled: false },
        testing: { enabled: false }
      }
    });

    // Perfil de alta performance
    this.profiles.set('high_performance', {
      id: 'high_performance',
      name: 'Alta Performance',
      description: 'Configuração para máxima performance',
      targetScenario: 'high_performance',
      configuration: {
        cache: { maxSize: 200, multiLevelEnabled: true },
        monitoring: { enabled: true, interval: 500 },
        yearManagement: { lazyLoading: true, preloadRadius: 3, optimizationEnabled: true },
        memoryManagement: { enabled: true, aggressiveMode: true },
        webWorkers: { enabled: true, maxWorkers: 8 },
        predictiveAnalysis: { enabled: true }
      }
    });
  }

  // Inicializar sistema
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Inicializando Sistema Integrado de Performance...');

    try {
      // Inicializar componentes na ordem correta
      await this.initializeCache();
      await this.initializeMonitoring();
      await this.initializeBugDetection();
      await this.initializeValidation();
      await this.initializeYearManagement();
      await this.initializeMemoryManagement();
      await this.initializeCleanup();
      await this.initializeWebWorkers();
      await this.initializePredictiveAnalysis();
      await this.initializeTesting();

      // Iniciar monitoramento de status
      this.startStatusMonitoring();

      this.isInitialized = true;
      console.log('✅ Sistema Integrado de Performance inicializado com sucesso');

    } catch (error) {
      console.error('❌ Erro na inicialização do sistema:', error);
      throw error;
    }
  }

  // Inicializar componentes individuais
  private async initializeCache(): Promise<void> {
    if (!this.configuration.cache.enabled) return;

    try {
      // Cache já é inicializado automaticamente
      this.updateComponentStatus('cache', 'active', 100, {
        hitRate: 0,
        size: 0,
        maxSize: this.configuration.cache.maxSize
      });

    } catch (error) {
      this.updateComponentStatus('cache', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeMonitoring(): Promise<void> {
    if (!this.configuration.monitoring.enabled) return;

    try {
      performanceMonitor.start();
      
      this.updateComponentStatus('monitoring', 'active', 100, {
        interval: this.configuration.monitoring.interval,
        alertsActive: 4
      });

    } catch (error) {
      this.updateComponentStatus('monitoring', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeBugDetection(): Promise<void> {
    if (!this.configuration.bugDetection.enabled) return;

    try {
      bugDetector.start();
      bugDetector.setDetectionInterval(this.configuration.bugDetection.detectionInterval);
      
      this.updateComponentStatus('bugDetection', 'active', 100, {
        detectionInterval: this.configuration.bugDetection.detectionInterval,
        autoCorrection: this.configuration.bugDetection.autoCorrection
      });

    } catch (error) {
      this.updateComponentStatus('bugDetection', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeValidation(): Promise<void> {
    if (!this.configuration.validation.enabled) return;

    try {
      // Executar validação inicial
      await dataValidator.validateData(this.configuration.validation.level);
      
      this.updateComponentStatus('validation', 'active', 100, {
        level: this.configuration.validation.level,
        autoFix: this.configuration.validation.autoFix
      });

    } catch (error) {
      this.updateComponentStatus('validation', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeYearManagement(): Promise<void> {
    try {
      if (this.configuration.yearManagement.lazyLoading) {
        yearLazyLoader.setPreloadStrategy({
          enabled: true,
          radius: this.configuration.yearManagement.preloadRadius
        });
      }

      this.updateComponentStatus('yearManagement', 'active', 100, {
        lazyLoading: this.configuration.yearManagement.lazyLoading,
        preloadRadius: this.configuration.yearManagement.preloadRadius,
        totalYears: 41
      });

    } catch (error) {
      this.updateComponentStatus('yearManagement', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeMemoryManagement(): Promise<void> {
    if (!this.configuration.memoryManagement.enabled) return;

    try {
      advancedMemoryManager.start();
      advancedMemoryManager.setMaxUsage(this.configuration.memoryManagement.maxUsage);
      
      this.updateComponentStatus('memoryManagement', 'active', 100, {
        maxUsage: this.configuration.memoryManagement.maxUsage,
        cleanupInterval: this.configuration.memoryManagement.cleanupInterval
      });

    } catch (error) {
      this.updateComponentStatus('memoryManagement', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeCleanup(): Promise<void> {
    if (!this.configuration.cleanup.enabled) return;

    try {
      // Sistema de limpeza já é inicializado automaticamente
      this.updateComponentStatus('cleanup', 'active', 100, {
        schedulesActive: Object.keys(this.configuration.cleanup.schedules).length
      });

    } catch (error) {
      this.updateComponentStatus('cleanup', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeWebWorkers(): Promise<void> {
    if (!this.configuration.webWorkers.enabled) return;

    try {
      // Web Workers já são inicializados automaticamente
      this.updateComponentStatus('webWorkers', 'active', 100, {
        maxWorkers: this.configuration.webWorkers.maxWorkers,
        taskTimeout: this.configuration.webWorkers.taskTimeout
      });

    } catch (error) {
      this.updateComponentStatus('webWorkers', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializePredictiveAnalysis(): Promise<void> {
    if (!this.configuration.predictiveAnalysis.enabled) return;

    try {
      // Análise preditiva já é inicializada automaticamente
      this.updateComponentStatus('predictiveAnalysis', 'active', 100, {
        modelsActive: 5,
        accuracyThreshold: this.configuration.predictiveAnalysis.modelAccuracyThreshold
      });

    } catch (error) {
      this.updateComponentStatus('predictiveAnalysis', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  private async initializeTesting(): Promise<void> {
    if (!this.configuration.testing.enabled) return;

    try {
      // Sistema de testes já é inicializado automaticamente
      this.updateComponentStatus('testing', 'active', 100, {
        scheduledSuites: this.configuration.testing.scheduledSuites.length,
        regressionThreshold: this.configuration.testing.regressionThreshold
      });

    } catch (error) {
      this.updateComponentStatus('testing', 'error', 0, {}, [`Erro na inicialização: ${error}`]);
    }
  }

  // Monitoramento de status
  private startStatusMonitoring(): void {
    this.updateInterval = setInterval(() => {
      this.updateSystemStatus();
    }, 10000); // A cada 10 segundos
  }

  private updateSystemStatus(): void {
    try {
      // Atualizar status dos componentes
      this.updateCacheStatus();
      this.updateMonitoringStatus();
      this.updateBugDetectionStatus();
      this.updateValidationStatus();
      this.updateYearManagementStatus();
      this.updateMemoryManagementStatus();
      this.updateCleanupStatus();
      this.updateWebWorkersStatus();
      this.updatePredictiveAnalysisStatus();
      this.updateTestingStatus();

      // Calcular métricas gerais
      this.calculateOverallMetrics();

      // Gerar recomendações
      this.generateRecommendations();

      // Atualizar timestamp
      this.status.lastUpdate = Date.now();

      // Notificar observadores
      this.notifyObservers();

    } catch (error) {
      console.error('Erro na atualização de status:', error);
    }
  }

  // Atualizar status de componentes específicos
  private updateCacheStatus(): void {
    if (!this.configuration.cache.enabled) return;

    try {
      const stats = advancedCache.getStats();
      const health = Math.min(stats.hitRate, 100);
      
      this.updateComponentStatus('cache', 'active', health, {
        hitRate: stats.hitRate,
        memoryUsage: stats.memoryUsage,
        l1Hits: stats.l1Hits,
        l2Hits: stats.l2Hits,
        l3Hits: stats.l3Hits
      });

    } catch (error) {
      this.updateComponentStatus('cache', 'error', 0, {}, [`Erro no cache: ${error}`]);
    }
  }

  private updateMonitoringStatus(): void {
    if (!this.configuration.monitoring.enabled) return;

    try {
      const metrics = performanceMonitor.getLatestMetrics();
      const alerts = performanceMonitor.getActiveAlerts();
      
      let health = 100;
      const issues: string[] = [];

      if (metrics) {
        if (metrics.renderTime > this.configuration.monitoring.alertThresholds.renderTime) {
          health -= 20;
          issues.push(`Tempo de render alto: ${metrics.renderTime}ms`);
        }
        
        if (metrics.memoryUsage > this.configuration.monitoring.alertThresholds.memoryUsage) {
          health -= 20;
          issues.push(`Uso de memória alto: ${metrics.memoryUsage}MB`);
        }
        
        if (metrics.fps < this.configuration.monitoring.alertThresholds.fps) {
          health -= 15;
          issues.push(`FPS baixo: ${metrics.fps}`);
        }
      }

      this.updateComponentStatus('monitoring', 'active', Math.max(health, 0), {
        renderTime: metrics?.renderTime || 0,
        memoryUsage: metrics?.memoryUsage || 0,
        fps: metrics?.fps || 0,
        activeAlerts: alerts.length
      }, issues);

    } catch (error) {
      this.updateComponentStatus('monitoring', 'error', 0, {}, [`Erro no monitoramento: ${error}`]);
    }
  }

  private updateBugDetectionStatus(): void {
    if (!this.configuration.bugDetection.enabled) return;

    try {
      const bugs = bugDetector.getBugs();
      const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
      const highBugs = bugs.filter(b => b.severity === 'high').length;
      
      let health = 100;
      const issues: string[] = [];

      if (criticalBugs > 0) {
        health -= criticalBugs * 30;
        issues.push(`${criticalBugs} bugs críticos detectados`);
      }
      
      if (highBugs > 0) {
        health -= highBugs * 15;
        issues.push(`${highBugs} bugs de alta severidade detectados`);
      }

      this.updateComponentStatus('bugDetection', 'active', Math.max(health, 0), {
        totalBugs: bugs.length,
        criticalBugs,
        highBugs,
        autoCorrection: this.configuration.bugDetection.autoCorrection
      }, issues);

    } catch (error) {
      this.updateComponentStatus('bugDetection', 'error', 0, {}, [`Erro na detecção de bugs: ${error}`]);
    }
  }

  private updateValidationStatus(): void {
    if (!this.configuration.validation.enabled) return;

    try {
      const lastReport = dataValidator.getLastValidation();
      
      let health = 100;
      const issues: string[] = [];

      if (lastReport) {
        health = lastReport.dataIntegrityScore;
        
        if (lastReport.summary.criticalIssues > 0) {
          issues.push(`${lastReport.summary.criticalIssues} problemas críticos`);
        }
        
        if (lastReport.summary.errors > 5) {
          issues.push(`${lastReport.summary.errors} erros detectados`);
        }
      }

      this.updateComponentStatus('validation', 'active', health, {
        integrityScore: lastReport?.dataIntegrityScore || 0,
        criticalIssues: lastReport?.summary.criticalIssues || 0,
        errors: lastReport?.summary.errors || 0,
        warnings: lastReport?.summary.warnings || 0
      }, issues);

    } catch (error) {
      this.updateComponentStatus('validation', 'error', 0, {}, [`Erro na validação: ${error}`]);
    }
  }

  private updateYearManagementStatus(): void {
    try {
      const stats = yearManager.getYearStatistics();
      const loadedYears = yearLazyLoader.getStatistics();
      
      let health = 100;
      const issues: string[] = [];

      if (stats.totalDataSize > 10 * 1024 * 1024) { // 10MB
        health -= 10;
        issues.push('Volume de dados alto');
      }

      this.updateComponentStatus('yearManagement', 'active', health, {
        totalYears: stats.totalYears,
        yearsWithData: stats.yearsWithData,
        loadedYears: stats.loadedYears,
        totalTransactions: stats.totalTransactions,
        averageLoadTime: loadedYears.averageLoadTime || 0
      }, issues);

    } catch (error) {
      this.updateComponentStatus('yearManagement', 'error', 0, {}, [`Erro no gerenciamento de anos: ${error}`]);
    }
  }

  private updateMemoryManagementStatus(): void {
    if (!this.configuration.memoryManagement.enabled) return;

    try {
      const stats = advancedMemoryManager.getStatistics();
      const currentUsage = stats.currentUsage;
      const maxUsage = this.configuration.memoryManagement.maxUsage;
      
      let health = 100;
      const issues: string[] = [];

      const usagePercent = (currentUsage / maxUsage) * 100;
      
      if (usagePercent > 90) {
        health -= 30;
        issues.push('Uso de memória crítico');
      } else if (usagePercent > 75) {
        health -= 15;
        issues.push('Uso de memória alto');
      }

      this.updateComponentStatus('memoryManagement', 'active', health, {
        currentUsage,
        maxUsage,
        usagePercent,
        cleanupCount: stats.cleanupCount,
        lastCleanup: stats.lastCleanup
      }, issues);

    } catch (error) {
      this.updateComponentStatus('memoryManagement', 'error', 0, {}, [`Erro no gerenciamento de memória: ${error}`]);
    }
  }

  private updateCleanupStatus(): void {
    if (!this.configuration.cleanup.enabled) return;

    try {
      const stats = cleanupSystem.getStatistics();
      
      let health = 100;
      const issues: string[] = [];

      if (stats.failedRuns > 0) {
        health -= stats.failedRuns * 10;
        issues.push(`${stats.failedRuns} limpezas falharam`);
      }

      this.updateComponentStatus('cleanup', 'active', health, {
        totalRuns: stats.totalRuns,
        itemsRemoved: stats.totalItemsRemoved,
        spaceSaved: stats.totalSpaceSaved,
        failedRuns: stats.failedRuns,
        lastCleanup: stats.lastCleanup
      }, issues);

    } catch (error) {
      this.updateComponentStatus('cleanup', 'error', 0, {}, [`Erro no sistema de limpeza: ${error}`]);
    }
  }

  private updateWebWorkersStatus(): void {
    if (!this.configuration.webWorkers.enabled) return;

    try {
      const stats = webWorkerManager.getWorkerStats();
      const activeCount = webWorkerManager.getActiveTaskCount();
      const queuedCount = webWorkerManager.getQueuedTaskCount();
      
      let health = 100;
      const issues: string[] = [];

      if (queuedCount > 10) {
        health -= 20;
        issues.push(`${queuedCount} tarefas na fila`);
      }

      const errorRate = stats.reduce((sum, s) => sum + s.tasksErrored, 0) / 
                       Math.max(stats.reduce((sum, s) => sum + s.tasksCompleted, 0), 1);
      
      if (errorRate > 0.1) {
        health -= 25;
        issues.push(`Taxa de erro alta: ${(errorRate * 100).toFixed(1)}%`);
      }

      this.updateComponentStatus('webWorkers', 'active', health, {
        activeWorkers: stats.length,
        activeTasks: activeCount,
        queuedTasks: queuedCount,
        errorRate: errorRate * 100
      }, issues);

    } catch (error) {
      this.updateComponentStatus('webWorkers', 'error', 0, {}, [`Erro nos web workers: ${error}`]);
    }
  }

  private updatePredictiveAnalysisStatus(): void {
    if (!this.configuration.predictiveAnalysis.enabled) return;

    try {
      const predictions = predictiveAnalysis.getActivePredictions();
      const trends = predictiveAnalysis.getTrends();
      const models = predictiveAnalysis.getModels();
      
      let health = 100;
      const issues: string[] = [];

      const criticalPredictions = predictions.filter(p => p.severity === 'critical').length;
      const highPredictions = predictions.filter(p => p.severity === 'high').length;

      if (criticalPredictions > 0) {
        health -= criticalPredictions * 25;
        issues.push(`${criticalPredictions} predições críticas`);
      }
      
      if (highPredictions > 2) {
        health -= 15;
        issues.push(`${highPredictions} predições de alta severidade`);
      }

      const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;

      this.updateComponentStatus('predictiveAnalysis', 'active', health, {
        activePredictions: predictions.length,
        criticalPredictions,
        trends: trends.length,
        modelAccuracy: avgAccuracy * 100
      }, issues);

    } catch (error) {
      this.updateComponentStatus('predictiveAnalysis', 'error', 0, {}, [`Erro na análise preditiva: ${error}`]);
    }
  }

  private updateTestingStatus(): void {
    if (!this.configuration.testing.enabled) return;

    try {
      const latestReport = performanceTesting.getLatestReport();
      
      let health = 100;
      const issues: string[] = [];

      if (latestReport) {
        const successRate = (latestReport.passedTests / latestReport.totalTests) * 100;
        health = successRate;
        
        if (latestReport.summary.regressions.length > 0) {
          issues.push(`${latestReport.summary.regressions.length} regressões detectadas`);
        }
        
        if (successRate < 80) {
          issues.push(`Taxa de sucesso baixa: ${successRate.toFixed(1)}%`);
        }
      }

      this.updateComponentStatus('testing', 'active', health, {
        lastTestTime: latestReport?.timestamp || 0,
        successRate: latestReport ? (latestReport.passedTests / latestReport.totalTests) * 100 : 0,
        regressions: latestReport?.summary.regressions.length || 0,
        performanceScore: latestReport?.summary.performanceScore || 0
      }, issues);

    } catch (error) {
      this.updateComponentStatus('testing', 'error', 0, {}, [`Erro nos testes: ${error}`]);
    }
  }

  // Atualizar status de componente
  private updateComponentStatus(
    component: keyof SystemStatus['components'],
    status: ComponentStatus['status'],
    health: number,
    metrics: { [key: string]: number } = {},
    issues: string[] = []
  ): void {
    this.status.components[component] = {
      status,
      health: Math.max(0, Math.min(100, health)),
      lastActivity: Date.now(),
      metrics,
      issues
    };
  }

  // Calcular métricas gerais
  private calculateOverallMetrics(): void {
    const components = Object.values(this.status.components);
    const activeComponents = components.filter(c => c.status === 'active');
    
    if (activeComponents.length === 0) {
      this.status.metrics = {
        performanceScore: 0,
        reliabilityScore: 0,
        efficiencyScore: 0,
        userExperienceScore: 0
      };
      this.status.overall = 'critical';
      return;
    }

    // Score de performance
    const performanceComponents = ['cache', 'monitoring', 'yearManagement', 'webWorkers'];
    const performanceHealth = performanceComponents
      .map(c => this.status.components[c as keyof SystemStatus['components']].health)
      .reduce((sum, h) => sum + h, 0) / performanceComponents.length;

    // Score de confiabilidade
    const reliabilityComponents = ['bugDetection', 'validation', 'testing'];
    const reliabilityHealth = reliabilityComponents
      .map(c => this.status.components[c as keyof SystemStatus['components']].health)
      .reduce((sum, h) => sum + h, 0) / reliabilityComponents.length;

    // Score de eficiência
    const efficiencyComponents = ['memoryManagement', 'cleanup', 'predictiveAnalysis'];
    const efficiencyHealth = efficiencyComponents
      .map(c => this.status.components[c as keyof SystemStatus['components']].health)
      .reduce((sum, h) => sum + h, 0) / efficiencyComponents.length;

    // Score de experiência do usuário
    const uxScore = (performanceHealth + reliabilityHealth) / 2;

    this.status.metrics = {
      performanceScore: Math.round(performanceHealth),
      reliabilityScore: Math.round(reliabilityHealth),
      efficiencyScore: Math.round(efficiencyHealth),
      userExperienceScore: Math.round(uxScore)
    };

    // Status geral
    const overallScore = (performanceHealth + reliabilityHealth + efficiencyHealth) / 3;
    
    if (overallScore >= 90) this.status.overall = 'excellent';
    else if (overallScore >= 75) this.status.overall = 'good';
    else if (overallScore >= 60) this.status.overall = 'fair';
    else if (overallScore >= 40) this.status.overall = 'poor';
    else this.status.overall = 'critical';
  }

  // Gerar recomendações
  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    // Recomendações baseadas no status dos componentes
    for (const [componentName, component] of Object.entries(this.status.components)) {
      if (component.health < 70) {
        recommendations.push(`Otimizar ${componentName}: saúde em ${component.health}%`);
      }
      
      if (component.issues.length > 0) {
        recommendations.push(`Resolver problemas em ${componentName}: ${component.issues[0]}`);
      }
    }

    // Recomendações baseadas nas métricas
    if (this.status.metrics.performanceScore < 80) {
      recommendations.push('Implementar otimizações de performance');
    }
    
    if (this.status.metrics.reliabilityScore < 85) {
      recommendations.push('Melhorar sistemas de detecção e correção');
    }
    
    if (this.status.metrics.efficiencyScore < 75) {
      recommendations.push('Otimizar uso de recursos e limpeza');
    }

    // Recomendações específicas
    const cacheComponent = this.status.components.cache;
    if (cacheComponent.metrics.hitRate < 80) {
      recommendations.push('Melhorar estratégia de cache');
    }

    const memoryComponent = this.status.components.memoryManagement;
    if (memoryComponent.metrics.usagePercent > 80) {
      recommendations.push('Implementar limpeza de memória mais agressiva');
    }

    this.status.recommendations = recommendations.slice(0, 5); // Top 5 recomendações
  }

  // Aplicar perfil
  async applyProfile(profileId: string): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Perfil não encontrado: ${profileId}`);
    }

    console.log(`Aplicando perfil: ${profile.name}`);

    // Mesclar configuração
    this.configuration = this.mergeConfigurations(this.configuration, profile.configuration);
    this.activeProfile = profileId;

    // Reinicializar componentes afetados
    await this.reinitializeComponents();

    console.log(`Perfil ${profile.name} aplicado com sucesso`);
  }

  // Mesclar configurações
  private mergeConfigurations(
    base: SystemConfiguration,
    override: Partial<SystemConfiguration>
  ): SystemConfiguration {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
      if (typeof value === 'object' && value !== null) {
        merged[key as keyof SystemConfiguration] = {
          ...merged[key as keyof SystemConfiguration],
          ...value
        };
      } else {
        (merged as any)[key] = value;
      }
    }
    
    return merged;
  }

  // Reinicializar componentes
  private async reinitializeComponents(): Promise<void> {
    // Reinicializar apenas componentes que mudaram
    // Por simplicidade, reinicializar todos
    await this.initialize();
  }

  // API pública
  getStatus(): SystemStatus {
    return { ...this.status };
  }

  getConfiguration(): SystemConfiguration {
    return { ...this.configuration };
  }

  updateConfiguration(updates: Partial<SystemConfiguration>): void {
    this.configuration = this.mergeConfigurations(this.configuration, updates);
  }

  getProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.values());
  }

  getActiveProfile(): PerformanceProfile | null {
    return this.activeProfile ? this.profiles.get(this.activeProfile) || null : null;
  }

  // Métodos de controle
  async start(): Promise<void> {
    await this.initialize();
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Parar componentes
    performanceMonitor.stop();
    bugDetector.stop();
    advancedMemoryManager.stop();
    webWorkerManager.terminate();
    
    this.isInitialized = false;
    console.log('Sistema Integrado de Performance parado');
  }

  // Observadores
  subscribe(callback: (status: SystemStatus) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) this.observers.splice(index, 1);
    };
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Erro no observer do sistema:', error);
      }
    });
  }
}

// Instância global
export const integratedPerformanceSystem = new IntegratedPerformanceSystem();

// Hook para usar o sistema integrado
export function useIntegratedPerformanceSystem() {
  const [status, setStatus] = useState<SystemStatus>(integratedPerformanceSystem.getStatus());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = integratedPerformanceSystem.subscribe(setStatus);

    // Inicializar sistema
    integratedPerformanceSystem.start().then(() => {
      setIsInitialized(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const applyProfile = useCallback(async (profileId: string) => {
    await integratedPerformanceSystem.applyProfile(profileId);
  }, []);

  const updateConfiguration = useCallback((updates: Partial<SystemConfiguration>) => {
    integratedPerformanceSystem.updateConfiguration(updates);
  }, []);

  return {
    status,
    isInitialized,
    configuration: integratedPerformanceSystem.getConfiguration(),
    profiles: integratedPerformanceSystem.getProfiles(),
    activeProfile: integratedPerformanceSystem.getActiveProfile(),
    applyProfile,
    updateConfiguration,
    start: integratedPerformanceSystem.start.bind(integratedPerformanceSystem),
    stop: integratedPerformanceSystem.stop.bind(integratedPerformanceSystem)
  };
}

export default integratedPerformanceSystem;