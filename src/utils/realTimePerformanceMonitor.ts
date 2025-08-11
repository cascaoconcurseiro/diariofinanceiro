/**
 * Sistema de Monitoramento de Performance em Tempo Real
 * Monitora métricas vitais, detecta gargalos e gera alertas automáticos
 */

interface PerformanceMetrics {
  // Métricas de tempo
  renderTime: number;
  loadTime: number;
  navigationTime: number;
  
  // Métricas de memória
  memoryUsage: number;
  memoryLimit: number;
  memoryPressure: number;
  
  // Métricas de rede
  networkLatency: number;
  bandwidthUsage: number;
  
  // Métricas de cache
  cacheHitRate: number;
  cacheSize: number;
  
  // Métricas de UI
  fps: number;
  scrollPerformance: number;
  inputLatency: number;
  
  // Timestamp
  timestamp: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface PerformanceThresholds {
  renderTime: { warning: 100, error: 200, critical: 500 };
  memoryUsage: { warning: 100, error: 150, critical: 200 };
  cacheHitRate: { warning: 70, error: 50, critical: 30 };
  fps: { warning: 45, error: 30, critical: 15 };
  networkLatency: { warning: 500, error: 1000, critical: 2000 };
}

class RealTimePerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private alertObservers: ((alert: PerformanceAlert) => void)[] = [];
  
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly MONITORING_INTERVAL = 1000; // 1 segundo
  private readonly FPS_SAMPLE_SIZE = 60;
  
  private thresholds: PerformanceThresholds = {
    renderTime: { warning: 100, error: 200, critical: 500 },
    memoryUsage: { warning: 100, error: 150, critical: 200 },
    cacheHitRate: { warning: 70, error: 50, critical: 30 },
    fps: { warning: 45, error: 30, critical: 15 },
    networkLatency: { warning: 500, error: 1000, critical: 2000 }
  };
  
  private isMonitoring = false;
  private monitoringTimer?: NodeJS.Timeout;
  private fpsFrames: number[] = [];
  private lastFrameTime = 0;
  
  constructor() {
    this.initializeMonitoring();
  }

  // Inicializar monitoramento
  private initializeMonitoring(): void {
    // Monitorar FPS
    this.startFPSMonitoring();
    
    // Monitorar memória
    this.startMemoryMonitoring();
    
    // Monitorar rede
    this.startNetworkMonitoring();
    
    // Monitorar eventos de performance
    this.startPerformanceObserver();
  }

  // Iniciar monitoramento
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics();
    }, this.MONITORING_INTERVAL);
    
    console.log('🚀 Monitoramento de performance iniciado');
  }

  // Parar monitoramento
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    console.log('⏹️ Monitoramento de performance parado');
  }

  // Coletar métricas atuais
  private async collectMetrics(): Promise<void> {
    const metrics: PerformanceMetrics = {
      renderTime: this.measureRenderTime(),
      loadTime: this.measureLoadTime(),
      navigationTime: this.measureNavigationTime(),
      memoryUsage: this.measureMemoryUsage(),
      memoryLimit: this.getMemoryLimit(),
      memoryPressure: this.calculateMemoryPressure(),
      networkLatency: await this.measureNetworkLatency(),
      bandwidthUsage: this.estimateBandwidthUsage(),
      cacheHitRate: this.getCacheHitRate(),
      cacheSize: this.getCacheSize(),
      fps: this.getCurrentFPS(),
      scrollPerformance: this.measureScrollPerformance(),
      inputLatency: this.measureInputLatency(),
      timestamp: Date.now()
    };

    // Adicionar às métricas
    this.addMetrics(metrics);
    
    // Verificar alertas
    this.checkAlerts(metrics);
    
    // Notificar observadores
    this.notifyObservers(metrics);
  }

  // Medições específicas
  private measureRenderTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.loadEventEnd - navigation.loadEventStart;
    }
    return 0;
  }

  private measureLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.loadEventEnd - navigation.fetchStart;
    }
    return 0;
  }

  private measureNavigationTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }
    return 0;
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  private getMemoryLimit(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB
    }
    return 0;
  }

  private calculateMemoryPressure(): number {
    const usage = this.measureMemoryUsage();
    const limit = this.getMemoryLimit();
    return limit > 0 ? (usage / limit) * 100 : 0;
  }

  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = performance.now();
      await fetch('/api/ping', { method: 'HEAD' });
      return performance.now() - start;
    } catch {
      return 0;
    }
  }

  private estimateBandwidthUsage(): number {
    const resources = performance.getEntriesByType('resource');
    const recentResources = resources.filter(r => 
      r.startTime > Date.now() - this.MONITORING_INTERVAL
    );
    
    return recentResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  }

  private getCacheHitRate(): number {
    // Integração com o cache avançado
    try {
      const { advancedCache } = require('./advancedPerformanceCache');
      const stats = advancedCache.getStats();
      return stats.hitRate;
    } catch {
      return 0;
    }
  }

  private getCacheSize(): number {
    try {
      const { advancedCache } = require('./advancedPerformanceCache');
      const stats = advancedCache.getStats();
      return stats.memoryUsage;
    } catch {
      return 0;
    }
  }

  private getCurrentFPS(): number {
    if (this.fpsFrames.length === 0) return 0;
    
    const avgFrameTime = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;
    return Math.round(1000 / avgFrameTime);
  }

  private measureScrollPerformance(): number {
    // Medir performance de scroll baseado em eventos recentes
    const scrollEntries = performance.getEntriesByName('scroll');
    if (scrollEntries.length > 0) {
      const recent = scrollEntries.slice(-10);
      const avgDuration = recent.reduce((sum, entry) => sum + entry.duration, 0) / recent.length;
      return avgDuration;
    }
    return 0;
  }

  private measureInputLatency(): number {
    // Medir latência de input baseado em eventos recentes
    const inputEntries = performance.getEntriesByType('event');
    const recentInputs = inputEntries.filter(entry => 
      ['click', 'keydown', 'touchstart'].includes(entry.name) &&
      entry.startTime > Date.now() - this.MONITORING_INTERVAL
    );
    
    if (recentInputs.length > 0) {
      const avgLatency = recentInputs.reduce((sum, entry) => sum + entry.duration, 0) / recentInputs.length;
      return avgLatency;
    }
    return 0;
  }

  // Monitoramento de FPS
  private startFPSMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        this.fpsFrames.push(frameTime);
        
        if (this.fpsFrames.length > this.FPS_SAMPLE_SIZE) {
          this.fpsFrames.shift();
        }
      }
      
      this.lastFrameTime = timestamp;
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  }

  // Monitoramento de memória
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usage > this.thresholds.memoryUsage.critical) {
          this.triggerAlert('memoryUsage', usage, 'critical', 
            `Uso crítico de memória: ${usage.toFixed(1)}MB`);
        }
      }, 5000);
    }
  }

  // Monitoramento de rede
  private startNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.triggerAlert('networkLatency', 0, 'warning',
            `Conexão lenta detectada: ${effectiveType}`);
        }
      });
    }
  }

  // Observer de performance nativo
  private startPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            // Detectar long tasks
            if (entry.entryType === 'longtask' && entry.duration > 50) {
              this.triggerAlert('renderTime', entry.duration, 'warning',
                `Long task detectada: ${entry.duration.toFixed(1)}ms`);
            }
            
            // Detectar layout shifts
            if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
              this.triggerAlert('renderTime', (entry as any).value, 'warning',
                `Layout shift detectado: ${(entry as any).value.toFixed(3)}`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask', 'layout-shift', 'largest-contentful-paint'] });
      } catch (error) {
        console.warn('PerformanceObserver não suportado:', error);
      }
    }
  }

  // Gerenciamento de métricas
  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.shift();
    }
  }

  // Verificação de alertas
  private checkAlerts(metrics: PerformanceMetrics): void {
    Object.entries(this.thresholds).forEach(([metric, thresholds]) => {
      const value = metrics[metric as keyof PerformanceMetrics] as number;
      
      if (value > thresholds.critical) {
        this.triggerAlert(metric as keyof PerformanceMetrics, value, 'critical',
          `${metric} crítico: ${value}`);
      } else if (value > thresholds.error) {
        this.triggerAlert(metric as keyof PerformanceMetrics, value, 'error',
          `${metric} alto: ${value}`);
      } else if (value > thresholds.warning) {
        this.triggerAlert(metric as keyof PerformanceMetrics, value, 'warning',
          `${metric} elevado: ${value}`);
      }
    });
    
    // Verificações especiais para métricas invertidas (menor é pior)
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate.critical) {
      this.triggerAlert('cacheHitRate', metrics.cacheHitRate, 'critical',
        `Taxa de cache crítica: ${metrics.cacheHitRate.toFixed(1)}%`);
    }
    
    if (metrics.fps < this.thresholds.fps.critical) {
      this.triggerAlert('fps', metrics.fps, 'critical',
        `FPS crítico: ${metrics.fps}`);
    }
  }

  // Disparar alerta
  private triggerAlert(
    metric: keyof PerformanceMetrics,
    value: number,
    type: 'warning' | 'error' | 'critical',
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: `${metric}_${Date.now()}`,
      type,
      metric,
      value,
      threshold: this.thresholds[metric as keyof PerformanceThresholds]?.[type] || 0,
      message,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.push(alert);
    this.notifyAlertObservers(alert);
    
    // Log do alerta
    const emoji = type === 'critical' ? '🚨' : type === 'error' ? '⚠️' : '⚡';
    console.warn(`${emoji} Performance Alert: ${message}`);
  }

  // Observadores
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  subscribeToAlerts(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertObservers.push(callback);
    return () => {
      const index = this.alertObservers.indexOf(callback);
      if (index > -1) {
        this.alertObservers.splice(index, 1);
      }
    };
  }

  private notifyObservers(metrics: PerformanceMetrics): void {
    this.observers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Erro no observer de métricas:', error);
      }
    });
  }

  private notifyAlertObservers(alert: PerformanceAlert): void {
    this.alertObservers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Erro no observer de alertas:', error);
      }
    });
  }

  // API pública
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  clearAlerts(): void {
    this.alerts.length = 0;
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Relatórios
  getPerformanceReport(timeRange: number = 300000): {
    averageMetrics: Partial<PerformanceMetrics>;
    trends: { [key: string]: 'improving' | 'stable' | 'degrading' };
    alerts: { total: number; byType: { [key: string]: number } };
    recommendations: string[];
  } {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        averageMetrics: {},
        trends: {},
        alerts: { total: 0, byType: {} },
        recommendations: []
      };
    }

    // Calcular médias
    const averageMetrics: Partial<PerformanceMetrics> = {};
    const keys = Object.keys(recentMetrics[0]) as (keyof PerformanceMetrics)[];
    
    keys.forEach(key => {
      if (key !== 'timestamp' && typeof recentMetrics[0][key] === 'number') {
        const values = recentMetrics.map(m => m[key] as number);
        averageMetrics[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    // Calcular tendências
    const trends: { [key: string]: 'improving' | 'stable' | 'degrading' } = {};
    keys.forEach(key => {
      if (key !== 'timestamp' && typeof recentMetrics[0][key] === 'number') {
        const values = recentMetrics.map(m => m[key] as number);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = Math.abs(secondAvg - firstAvg) / firstAvg;
        
        if (change < 0.05) {
          trends[key] = 'stable';
        } else if (
          (key === 'renderTime' || key === 'memoryUsage' || key === 'networkLatency') 
          ? secondAvg < firstAvg 
          : secondAvg > firstAvg
        ) {
          trends[key] = 'improving';
        } else {
          trends[key] = 'degrading';
        }
      }
    });

    // Estatísticas de alertas
    const recentAlerts = this.alerts.filter(a => a.timestamp > cutoff);
    const alertsByType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Recomendações
    const recommendations: string[] = [];
    
    if (averageMetrics.renderTime && averageMetrics.renderTime > 100) {
      recommendations.push('Otimizar tempo de renderização com memoização');
    }
    
    if (averageMetrics.memoryUsage && averageMetrics.memoryUsage > 100) {
      recommendations.push('Implementar limpeza de memória mais agressiva');
    }
    
    if (averageMetrics.cacheHitRate && averageMetrics.cacheHitRate < 80) {
      recommendations.push('Melhorar estratégia de cache');
    }
    
    if (averageMetrics.fps && averageMetrics.fps < 50) {
      recommendations.push('Otimizar animações e transições');
    }

    return {
      averageMetrics,
      trends,
      alerts: {
        total: recentAlerts.length,
        byType: alertsByType
      },
      recommendations
    };
  }
}

// Instância global do monitor
export const performanceMonitor = new RealTimePerformanceMonitor();

// Hook para usar o monitor
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  
  useEffect(() => {
    const unsubscribeMetrics = performanceMonitor.subscribe(setMetrics);
    const unsubscribeAlerts = performanceMonitor.subscribeToAlerts((alert) => {
      setAlerts(prev => [...prev, alert]);
    });
    
    performanceMonitor.start();
    
    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      performanceMonitor.stop();
    };
  }, []);
  
  return {
    metrics,
    alerts,
    activeAlerts: alerts.filter(a => !a.resolved),
    resolveAlert: performanceMonitor.resolveAlert.bind(performanceMonitor),
    clearAlerts: performanceMonitor.clearAlerts.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor)
  };
}

export default performanceMonitor;