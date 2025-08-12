// Sistema de monitoramento simples
interface MetricData {
  timestamp: number;
  type: string;
  value: number;
  metadata?: any;
}

class MonitoringSystem {
  private metrics: MetricData[] = [];
  private readonly MAX_METRICS = 1000;

  // Registrar métrica
  track(type: string, value: number = 1, metadata?: any) {
    const metric: MetricData = {
      timestamp: Date.now(),
      type,
      value,
      metadata
    };

    this.metrics.push(metric);

    // Limitar tamanho
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS);
    }

    // Salvar localmente
    this.saveMetrics();
  }

  // Obter métricas
  getMetrics(type?: string, hours: number = 24): MetricData[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return this.metrics.filter(m => 
      m.timestamp > cutoff && 
      (!type || m.type === type)
    );
  }

  // Estatísticas
  getStats(type: string, hours: number = 24) {
    const metrics = this.getMetrics(type, hours);
    
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    return {
      count: metrics.length,
      total: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  // Salvar métricas
  private saveMetrics() {
    try {
      const recent = this.metrics.slice(-100); // Últimas 100
      localStorage.setItem('monitoring_metrics', JSON.stringify(recent));
    } catch {
      // Falha silenciosa
    }
  }

  // Carregar métricas
  loadMetrics() {
    try {
      const saved = localStorage.getItem('monitoring_metrics');
      if (saved) {
        this.metrics = JSON.parse(saved);
      }
    } catch {
      this.metrics = [];
    }
  }
}

export const monitoring = new MonitoringSystem();

// Inicializar
monitoring.loadMetrics();

// Métricas automáticas
export const trackEvent = (event: string, metadata?: any) => {
  monitoring.track(`event.${event}`, 1, metadata);
};

export const trackError = (error: string, metadata?: any) => {
  monitoring.track(`error.${error}`, 1, metadata);
};

export const trackPerformance = (operation: string, duration: number) => {
  monitoring.track(`performance.${operation}`, duration);
};