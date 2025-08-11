/**
 * SISTEMA DE MONITORAMENTO E LOGS AVANÇADO
 * 
 * Monitora performance, erros e atividades do sistema
 */

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  data?: any;
  userAgent?: string;
  url?: string;
  userId?: string;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  context?: any;
}

interface SystemAlert {
  id: string;
  timestamp: string;
  type: 'performance' | 'error' | 'security' | 'data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  resolved: boolean;
}

class MonitoringSystem {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private alerts: SystemAlert[] = [];
  private maxLogs = 1000;
  private maxMetrics = 500;
  private maxAlerts = 100;

  constructor() {
    this.loadFromStorage();
    this.setupPerformanceMonitoring();
    this.setupErrorMonitoring();
  }

  /**
   * Adiciona entrada de log
   */
  log(level: LogEntry['level'], category: string, message: string, data?: any): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.unshift(logEntry);

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' || level === 'critical' ? 'error' :
                           level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${category}] ${message}`, data || '');
    }

    // Salvar no localStorage periodicamente
    this.saveToStorage();

    // Verificar se precisa gerar alerta
    this.checkForAlerts(logEntry);
  }

  /**
   * Registra métrica de performance
   */
  recordMetric(metric: string, value: number, unit: string, context?: any): void {
    const metricEntry: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      context
    };

    this.metrics.unshift(metricEntry);

    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }

    this.saveToStorage();
  }

  /**
   * Cria alerta do sistema
   */
  createAlert(type: SystemAlert['type'], severity: SystemAlert['severity'], message: string, details?: any): void {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      details,
      resolved: false
    };

    this.alerts.unshift(alert);

    // Manter apenas os alertas mais recentes
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    // Log crítico para alertas de alta severidade
    if (severity === 'high' || severity === 'critical') {
      this.log('critical', 'ALERT', message, details);
    }

    this.saveToStorage();
  }

  /**
   * Resolve alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.log('info', 'ALERT', `Alerta resolvido: ${alert.message}`);
      this.saveToStorage();
    }
  }

  /**
   * Obtém logs filtrados
   */
  getLogs(filter?: {
    level?: LogEntry['level'];
    category?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category);
      }
      
      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filter.since!
        );
      }
      
      if (filter.limit) {
        filteredLogs = filteredLogs.slice(0, filter.limit);
      }
    }

    return filteredLogs;
  }

  /**
   * Obtém métricas filtradas
   */
  getMetrics(filter?: {
    metric?: string;
    since?: Date;
    limit?: number;
  }): PerformanceMetric[] {
    let filteredMetrics = [...this.metrics];

    if (filter) {
      if (filter.metric) {
        filteredMetrics = filteredMetrics.filter(m => m.metric === filter.metric);
      }
      
      if (filter.since) {
        filteredMetrics = filteredMetrics.filter(m => 
          new Date(m.timestamp) >= filter.since!
        );
      }
      
      if (filter.limit) {
        filteredMetrics = filteredMetrics.slice(0, filter.limit);
      }
    }

    return filteredMetrics;
  }

  /**
   * Obtém alertas não resolvidos
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats(): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    activeAlerts: number;
    criticalAlerts: number;
    avgResponseTime: number;
    memoryUsage: number;
  } {
    const errorCount = this.logs.filter(log => log.level === 'error' || log.level === 'critical').length;
    const warningCount = this.logs.filter(log => log.level === 'warn').length;
    const activeAlerts = this.getActiveAlerts().length;
    const criticalAlerts = this.alerts.filter(a => !a.resolved && a.severity === 'critical').length;
    
    const responseTimeMetrics = this.getMetrics({ metric: 'response_time', limit: 10 });
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0;

    const memoryUsage = (performance as any).memory ? 
      (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;

    return {
      totalLogs: this.logs.length,
      errorCount,
      warningCount,
      activeAlerts,
      criticalAlerts,
      avgResponseTime,
      memoryUsage
    };
  }

  /**
   * Configura monitoramento de performance
   */
  private setupPerformanceMonitoring(): void {
    // Monitorar tempo de resposta
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.recordMetric('response_time', endTime - startTime, 'ms', {
          url: args[0],
          status: response.status
        });
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.recordMetric('response_time', endTime - startTime, 'ms', {
          url: args[0],
          error: true
        });
        throw error;
      }
    };

    // Monitorar uso de memória
    setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB');
        
        // Alerta se uso de memória for muito alto
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          this.createAlert('performance', 'high', `Alto uso de memória: ${usagePercent.toFixed(1)}%`);
        }
      }
    }, 30000); // A cada 30 segundos

    // Monitorar performance de renderização
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric('render_time', entry.duration, 'ms', {
              name: entry.name
            });
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Configura monitoramento de erros
   */
  private setupErrorMonitoring(): void {
    // Capturar erros JavaScript
    window.addEventListener('error', (event) => {
      this.log('error', 'JS_ERROR', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'UNHANDLED_PROMISE', 'Promise rejeitada não tratada', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Verifica se precisa gerar alertas baseado nos logs
   */
  private checkForAlerts(logEntry: LogEntry): void {
    // Alerta para muitos erros em pouco tempo
    const recentErrors = this.logs.filter(log => 
      (log.level === 'error' || log.level === 'critical') &&
      Date.now() - new Date(log.timestamp).getTime() < 60000 // Últimos 60 segundos
    );

    if (recentErrors.length >= 5) {
      this.createAlert('error', 'high', `${recentErrors.length} erros nos últimos 60 segundos`);
    }

    // Alerta para erros críticos
    if (logEntry.level === 'critical') {
      this.createAlert('error', 'critical', `Erro crítico: ${logEntry.message}`, logEntry.data);
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        logs: this.logs.slice(0, 100), // Salvar apenas os 100 mais recentes
        metrics: this.metrics.slice(0, 50),
        alerts: this.alerts.slice(0, 20)
      };
      localStorage.setItem('monitoringData', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados de monitoramento:', error);
    }
  }

  /**
   * Carrega dados do localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('monitoringData');
      if (data) {
        const parsed = JSON.parse(data);
        this.logs = parsed.logs || [];
        this.metrics = parsed.metrics || [];
        this.alerts = parsed.alerts || [];
      }
    } catch (error) {
      console.error('Erro ao carregar dados de monitoramento:', error);
    }
  }

  /**
   * Limpa dados antigos
   */
  cleanup(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Manter apenas 7 dias

    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    this.metrics = this.metrics.filter(metric => new Date(metric.timestamp) > cutoffDate);
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) > cutoffDate);

    this.saveToStorage();
  }

  /**
   * Exporta dados de monitoramento
   */
  exportData(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      logs: this.logs,
      metrics: this.metrics,
      alerts: this.alerts,
      stats: this.getSystemStats()
    }, null, 2);
  }
}

// Instância global do sistema de monitoramento
export const monitoring = new MonitoringSystem();

// Funções de conveniência
export const logger = {
  debug: (category: string, message: string, data?: any) => 
    monitoring.log('debug', category, message, data),
  
  info: (category: string, message: string, data?: any) => 
    monitoring.log('info', category, message, data),
  
  warn: (category: string, message: string, data?: any) => 
    monitoring.log('warn', category, message, data),
  
  error: (category: string, message: string, data?: any) => 
    monitoring.log('error', category, message, data),
  
  critical: (category: string, message: string, data?: any) => 
    monitoring.log('critical', category, message, data)
};

// Limpeza automática a cada hora
setInterval(() => {
  monitoring.cleanup();
}, 60 * 60 * 1000);

// Log de inicialização
logger.info('SYSTEM', 'Sistema de monitoramento inicializado');