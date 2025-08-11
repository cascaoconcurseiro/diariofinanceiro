/**
 * MONITOR DE PERFORMANCE OCULTO
 */

import { PerformanceImpact, PerformanceMetric, SystemLoad } from '../types/TestTypes';
import { HIDDEN_TEST_CONFIG } from '../config/HiddenTestConfig';
import { InternalLogger } from '../logging/InternalLogger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private logger: InternalLogger;
  private isInitialized = false;
  private metrics: PerformanceMetric[] = [];
  private currentLoad: SystemLoad = { cpu: 0, memory: 0, activeTests: 0, userActivity: false };

  private constructor() {
    this.logger = InternalLogger.getInstance();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.startMonitoring();
    this.isInitialized = true;
  }

  public measureImpact(): PerformanceImpact {
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
    
    // Estimativa simples de CPU (baseada em timing)
    const start = performance.now();
    for (let i = 0; i < 10000; i++) { /* busy work */ }
    const cpuTime = performance.now() - start;
    const cpuImpact = Math.min(cpuTime / 10, 100); // Normalizar para %

    const shouldThrottle = cpuImpact > HIDDEN_TEST_CONFIG.performance.throttleThreshold ||
                          memoryUsage > HIDDEN_TEST_CONFIG.performance.maxMemoryUsage;
    
    const shouldPause = cpuImpact > HIDDEN_TEST_CONFIG.performance.maxCpuUsage ||
                       memoryUsage > HIDDEN_TEST_CONFIG.performance.maxMemoryUsage * 2;

    return {
      cpuImpact,
      memoryImpact: memoryUsage,
      shouldThrottle,
      shouldPause
    };
  }

  public shouldThrottle(): boolean {
    const impact = this.measureImpact();
    return impact.shouldThrottle || impact.shouldPause;
  }

  public adjustTestFrequency(load: SystemLoad): void {
    this.currentLoad = load;
    
    if (load.cpu > HIDDEN_TEST_CONFIG.performance.maxCpuUsage) {
      this.logger.logWarning('performance', 'High CPU usage detected, throttling tests');
    }
  }

  public pauseIfNecessary(): void {
    const impact = this.measureImpact();
    if (impact.shouldPause) {
      this.logger.logWarning('performance', 'Performance impact too high, pausing tests');
    }
  }

  public shutdown(): void {
    this.isInitialized = false;
    this.metrics = [];
  }

  private startMonitoring(): void {
    // Monitor a cada 30 segundos
    setInterval(() => {
      if (this.isInitialized) {
        const metric: PerformanceMetric = {
          timestamp: Date.now(),
          cpuUsage: this.currentLoad.cpu,
          memoryUsage: this.currentLoad.memory,
          testDuration: 0,
          impactScore: this.calculateImpactScore()
        };
        
        this.metrics.push(metric);
        
        // Manter apenas últimas 100 métricas
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }
        
        this.logger.logPerformanceMetric(metric);
      }
    }, 30000);
  }

  private calculateImpactScore(): number {
    const impact = this.measureImpact();
    return (impact.cpuImpact + impact.memoryImpact / 10) / 2;
  }
}