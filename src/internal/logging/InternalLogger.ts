/**
 * SISTEMA DE LOGGING INTERNO OCULTO
 * Logs completamente invisíveis ao usuário final
 */

import { 
  InternalLogEntry, 
  HiddenTestResult, 
  CriticalIssue, 
  CorrectionResult, 
  PerformanceMetric,
  EncryptedDetails
} from '../types/TestTypes';
import { HIDDEN_TEST_CONFIG, internalLog, isDevelopmentMode } from '../config/HiddenTestConfig';
import { LogEncryption } from './LogEncryption';

export class InternalLogger {
  private static instance: InternalLogger | null = null;
  private logs: InternalLogEntry[] = [];
  private maxLogs: number = 1000;
  private storageKey = '__hidden_test_logs';
  private isInitialized = false;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): InternalLogger {
    if (!InternalLogger.instance) {
      InternalLogger.instance = new InternalLogger();
    }
    return InternalLogger.instance;
  }

  // Inicializar logger
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Carregar logs existentes
      await this.loadExistingLogs();
      
      // Configurar limpeza automática
      this.setupAutoCleanup();
      
      this.isInitialized = true;
      this.logInfo('internal_logger', 'Internal Logger initialized');
      
    } catch (error) {
      // Falha silenciosa - não impactar usuário
      internalLog('Failed to initialize Internal Logger:', error);
    }
  }

  // Log de resultado de teste
  public logTestResult(result: HiddenTestResult): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: result.status === 'pass' ? 'info' : result.status === 'critical' ? 'critical' : 'warn',
      category: 'test_result',
      message: `Test ${result.validator} in suite ${result.suite}: ${result.status}`,
      data: this.shouldEncryptData() ? LogEncryption.encrypt(result) : result,
      encrypted: this.shouldEncryptData()
    };

    this.addLogEntry(entry);
  }

  // Log de problema crítico
  public logCriticalIssue(issue: CriticalIssue): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: 'critical',
      category: 'critical_issue',
      message: `Critical issue: ${issue.description}`,
      data: this.shouldEncryptData() ? LogEncryption.encrypt(issue) : issue,
      encrypted: this.shouldEncryptData()
    };

    this.addLogEntry(entry);

    // Em desenvolvimento, também logar no console oculto
    if (isDevelopmentMode()) {
      internalLog(`CRITICAL ISSUE: ${issue.description}`, issue);
    }
  }

  // Log de auto-correção
  public logAutoCorrection(correction: CorrectionResult): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: correction.success ? 'info' : 'warn',
      category: 'auto_correction',
      message: `Auto-correction ${correction.success ? 'succeeded' : 'failed'}: ${correction.correctionId}`,
      data: this.shouldEncryptData() ? LogEncryption.encrypt(correction) : correction,
      encrypted: this.shouldEncryptData()
    };

    this.addLogEntry(entry);
  }

  // Log de métrica de performance
  public logPerformanceMetric(metric: PerformanceMetric): void {
    if (!this.isInitialized) return;

    // Só logar métricas se estiver em modo detalhado
    if (HIDDEN_TEST_CONFIG.logging.level !== 'detailed') return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: metric.impactScore > 5 ? 'warn' : 'info',
      category: 'performance',
      message: `Performance metric: CPU ${metric.cpuUsage}%, Memory ${metric.memoryUsage}MB`,
      data: this.shouldEncryptData() ? LogEncryption.encrypt(metric) : metric,
      encrypted: this.shouldEncryptData()
    };

    this.addLogEntry(entry);
  }

  // Log genérico de informação
  public logInfo(category: string, message: string, data?: any): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: 'info',
      category,
      message,
      data: data ? (this.shouldEncryptData() ? LogEncryption.encrypt(data) : data) : undefined,
      encrypted: this.shouldEncryptData() && !!data
    };

    this.addLogEntry(entry);
  }

  // Log de warning
  public logWarning(category: string, message: string, data?: any): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: 'warn',
      category,
      message,
      data: data ? (this.shouldEncryptData() ? LogEncryption.encrypt(data) : data) : undefined,
      encrypted: this.shouldEncryptData() && !!data
    };

    this.addLogEntry(entry);
  }

  // Log de erro
  public logError(category: string, message: string, data?: any): void {
    if (!this.isInitialized) return;

    const entry: InternalLogEntry = {
      timestamp: Date.now(),
      level: 'error',
      category,
      message,
      data: data ? (this.shouldEncryptData() ? LogEncryption.encrypt(data) : data) : undefined,
      encrypted: this.shouldEncryptData() && !!data
    };

    this.addLogEntry(entry);
  }

  // Exportar logs (apenas em desenvolvimento)
  public exportLogs(): any[] {
    if (!isDevelopmentMode()) {
      return []; // Não exportar em produção
    }

    return this.logs.map(log => {
      if (log.encrypted && log.data) {
        try {
          return {
            ...log,
            data: LogEncryption.decrypt(log.data as EncryptedDetails)
          };
        } catch {
          return log;
        }
      }
      return log;
    });
  }

  // Obter estatísticas dos logs
  public getLogStats(): any {
    if (!isDevelopmentMode()) {
      return {}; // Não fornecer stats em produção
    }

    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      criticalIssues: 0,
      autoCorrections: 0
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      if (log.level === 'critical') stats.criticalIssues++;
      if (log.category === 'auto_correction') stats.autoCorrections++;
    });

    return stats;
  }

  // Limpar logs antigos
  public clearOldLogs(): void {
    if (!this.isInitialized) return;

    const retentionMs = HIDDEN_TEST_CONFIG.logging.retention * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime);

    if (this.logs.length !== originalLength) {
      this.saveLogsToStorage();
      internalLog(`Cleared ${originalLength - this.logs.length} old log entries`);
    }
  }

  // Shutdown do logger
  public shutdown(): void {
    try {
      this.saveLogsToStorage();
      this.logs = [];
      this.isInitialized = false;
      LogEncryption.clearKey();
    } catch (error) {
      // Falha silenciosa
    }
  }

  // Adicionar entrada de log
  private addLogEntry(entry: InternalLogEntry): void {
    this.logs.push(entry);

    // Manter limite de logs em memória
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Salvar periodicamente
    if (this.logs.length % 10 === 0) {
      this.saveLogsToStorage();
    }
  }

  // Verificar se deve criptografar dados
  private shouldEncryptData(): boolean {
    return HIDDEN_TEST_CONFIG.logging.encryption && !isDevelopmentMode();
  }

  // Carregar logs existentes
  private async loadExistingLogs(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.logs = parsed;
          internalLog(`Loaded ${this.logs.length} existing log entries`);
        }
      }
    } catch (error) {
      internalLog('Failed to load existing logs:', error);
      this.logs = [];
    }
  }

  // Salvar logs no localStorage
  private saveLogsToStorage(): void {
    try {
      const dataToStore = this.logs.slice(-this.maxLogs); // Manter apenas os mais recentes
      localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      // Se localStorage está cheio, limpar logs antigos e tentar novamente
      try {
        this.clearOldLogs();
        const dataToStore = this.logs.slice(-Math.floor(this.maxLogs / 2)); // Manter apenas metade
        localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
      } catch (secondError) {
        // Falha silenciosa - não impactar usuário
        internalLog('Failed to save logs to storage:', secondError);
      }
    }
  }

  // Configurar limpeza automática
  private setupAutoCleanup(): void {
    // Limpar logs antigos a cada hora
    setInterval(() => {
      if (this.isInitialized) {
        this.clearOldLogs();
      }
    }, 60 * 60 * 1000); // 1 hora
  }
}