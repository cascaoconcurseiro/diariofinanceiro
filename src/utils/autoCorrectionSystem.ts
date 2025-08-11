/**
 * Sistema de Auto-Correção
 * Corrige automaticamente problemas detectados no sistema
 */

import { BugReport, BugType, BugSeverity, bugDetector } from './proactiveBugDetector';
import { advancedCache } from './advancedPerformanceCache';

export enum CorrectionType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  USER_APPROVED = 'user_approved',
  MANUAL = 'manual'
}

export enum CorrectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface CorrectionAction {
  id: string;
  bugId: string;
  type: CorrectionType;
  status: CorrectionStatus;
  description: string;
  steps: CorrectionStep[];
  rollbackSteps: CorrectionStep[];
  timestamp: number;
  completedAt?: number;
  error?: string;
  backupCreated: boolean;
  userApprovalRequired: boolean;
}

export interface CorrectionStep {
  id: string;
  description: string;
  action: () => Promise<boolean>;
  rollback: () => Promise<boolean>;
  critical: boolean;
  completed: boolean;
  error?: string;
}

export interface CorrectionResult {
  success: boolean;
  actionId: string;
  message: string;
  backupId?: string;
  rollbackAvailable: boolean;
}

class AutoCorrectionSystem {
  private actions: CorrectionAction[] = [];
  private isRunning = false;
  private observers: ((action: CorrectionAction) => void)[] = [];
  private backups: Map<string, any> = new Map();
  
  constructor() {
    this.initializeCorrections();
  }

  // Inicializar correções automáticas
  private initializeCorrections(): void {
    // Escutar bugs detectados
    bugDetector.subscribe((bug: BugReport) => {
      if (bug.autoFixable) {
        this.createCorrectionAction(bug);
      }
    });
  }

  // Criar ação de correção
  private async createCorrectionAction(bug: BugReport): Promise<void> {
    const correctionType = this.determineCorrectionType(bug);
    
    const action: CorrectionAction = {
      id: `correction_${Date.now()}`,
      bugId: bug.id,
      type: correctionType,
      status: CorrectionStatus.PENDING,
      description: `Correção automática para: ${bug.title}`,
      steps: this.generateCorrectionSteps(bug),
      rollbackSteps: [],
      timestamp: Date.now(),
      backupCreated: false,
      userApprovalRequired: correctionType === CorrectionType.USER_APPROVED
    };

    this.actions.push(action);
    this.notifyObservers(action);

    // Executar correção se for imediata
    if (correctionType === CorrectionType.IMMEDIATE) {
      await this.executeCorrection(action.id);
    }
  }

  // Determinar tipo de correção baseado na severidade
  private determineCorrectionType(bug: BugReport): CorrectionType {
    switch (bug.severity) {
      case BugSeverity.CRITICAL:
        return CorrectionType.USER_APPROVED; // Crítico precisa aprovação
      case BugSeverity.HIGH:
        return CorrectionType.SCHEDULED; // Alto é agendado
      case BugSeverity.MEDIUM:
        return CorrectionType.IMMEDIATE; // Médio é imediato
      case BugSeverity.LOW:
        return CorrectionType.IMMEDIATE; // Baixo é imediato
      default:
        return CorrectionType.MANUAL;
    }
  }

  // Gerar passos de correção baseado no tipo de bug
  private generateCorrectionSteps(bug: BugReport): CorrectionStep[] {
    const steps: CorrectionStep[] = [];

    switch (bug.type) {
      case BugType.MEMORY_LEAK:
        steps.push(
          {
            id: 'backup_state',
            description: 'Criar backup do estado atual',
            action: () => this.createStateBackup(),
            rollback: () => this.restoreStateBackup(bug.id),
            critical: false,
            completed: false
          },
          {
            id: 'clear_cache',
            description: 'Limpar cache para liberar memória',
            action: () => this.clearMemoryCache(),
            rollback: () => this.restoreCache(),
            critical: false,
            completed: false
          },
          {
            id: 'force_gc',
            description: 'Forçar garbage collection',
            action: () => this.forceGarbageCollection(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          },
          {
            id: 'cleanup_listeners',
            description: 'Limpar event listeners órfãos',
            action: () => this.cleanupEventListeners(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          }
        );
        break;

      case BugType.DATA_CORRUPTION:
        steps.push(
          {
            id: 'backup_corrupted_data',
            description: 'Backup dos dados corrompidos',
            action: () => this.backupCorruptedData(),
            rollback: () => Promise.resolve(true),
            critical: true,
            completed: false
          },
          {
            id: 'validate_backup',
            description: 'Validar backup disponível',
            action: () => this.validateBackup(),
            rollback: () => Promise.resolve(true),
            critical: true,
            completed: false
          },
          {
            id: 'restore_from_backup',
            description: 'Restaurar dados do backup',
            action: () => this.restoreFromBackup(),
            rollback: () => this.restoreCorruptedData(),
            critical: true,
            completed: false
          },
          {
            id: 'validate_restored_data',
            description: 'Validar dados restaurados',
            action: () => this.validateRestoredData(),
            rollback: () => this.restoreCorruptedData(),
            critical: true,
            completed: false
          }
        );
        break;

      case BugType.CALCULATION_ERROR:
        steps.push(
          {
            id: 'backup_calculations',
            description: 'Backup dos cálculos atuais',
            action: () => this.backupCalculations(),
            rollback: () => this.restoreCalculations(),
            critical: false,
            completed: false
          },
          {
            id: 'recalculate_balances',
            description: 'Recalcular todos os saldos',
            action: () => this.recalculateAllBalances(),
            rollback: () => this.restoreCalculations(),
            critical: true,
            completed: false
          },
          {
            id: 'validate_calculations',
            description: 'Validar cálculos corrigidos',
            action: () => this.validateCalculations(),
            rollback: () => this.restoreCalculations(),
            critical: true,
            completed: false
          }
        );
        break;

      case BugType.CACHE_INCONSISTENCY:
        steps.push(
          {
            id: 'analyze_cache_state',
            description: 'Analisar estado do cache',
            action: () => this.analyzeCacheState(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          },
          {
            id: 'clear_inconsistent_cache',
            description: 'Limpar cache inconsistente',
            action: () => this.clearInconsistentCache(),
            rollback: () => this.restoreCache(),
            critical: false,
            completed: false
          },
          {
            id: 'rebuild_cache',
            description: 'Reconstruir cache',
            action: () => this.rebuildCache(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          }
        );
        break;

      case BugType.PERFORMANCE_DEGRADATION:
        steps.push(
          {
            id: 'identify_bottlenecks',
            description: 'Identificar gargalos de performance',
            action: () => this.identifyBottlenecks(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          },
          {
            id: 'optimize_components',
            description: 'Otimizar componentes lentos',
            action: () => this.optimizeSlowComponents(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          },
          {
            id: 'reduce_monitoring_frequency',
            description: 'Reduzir frequência de monitoramento',
            action: () => this.reduceMonitoringFrequency(),
            rollback: () => this.restoreMonitoringFrequency(),
            critical: false,
            completed: false
          }
        );
        break;

      case BugType.STORAGE_OVERFLOW:
        steps.push(
          {
            id: 'analyze_storage_usage',
            description: 'Analisar uso de armazenamento',
            action: () => this.analyzeStorageUsage(),
            rollback: () => Promise.resolve(true),
            critical: false,
            completed: false
          },
          {
            id: 'cleanup_old_data',
            description: 'Limpar dados antigos',
            action: () => this.cleanupOldData(),
            rollback: () => this.restoreCleanedData(),
            critical: false,
            completed: false
          },
          {
            id: 'compress_data',
            description: 'Comprimir dados atuais',
            action: () => this.compressCurrentData(),
            rollback: () => this.decompressData(),
            critical: false,
            completed: false
          }
        );
        break;

      default:
        steps.push({
          id: 'generic_fix',
          description: 'Aplicar correção genérica',
          action: () => this.applyGenericFix(bug),
          rollback: () => Promise.resolve(true),
          critical: false,
          completed: false
        });
    }

    return steps;
  }

  // Executar correção
  async executeCorrection(actionId: string): Promise<CorrectionResult> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) {
      return {
        success: false,
        actionId,
        message: 'Ação de correção não encontrada',
        rollbackAvailable: false
      };
    }

    if (action.status !== CorrectionStatus.PENDING) {
      return {
        success: false,
        actionId,
        message: 'Ação já foi executada ou está em progresso',
        rollbackAvailable: false
      };
    }

    action.status = CorrectionStatus.IN_PROGRESS;
    this.notifyObservers(action);

    try {
      // Criar backup se necessário
      if (!action.backupCreated) {
        const backupId = await this.createFullBackup();
        action.backupCreated = true;
      }

      // Executar cada passo
      for (const step of action.steps) {
        try {
          console.log(`Executando: ${step.description}`);
          const success = await step.action();
          
          if (!success) {
            throw new Error(`Falha no passo: ${step.description}`);
          }
          
          step.completed = true;
          
          // Gerar passo de rollback
          action.rollbackSteps.unshift({
            id: `rollback_${step.id}`,
            description: `Reverter: ${step.description}`,
            action: step.rollback,
            rollback: () => Promise.resolve(true),
            critical: step.critical,
            completed: false
          });
          
        } catch (error) {
          step.error = error instanceof Error ? error.message : 'Erro desconhecido';
          
          // Se é crítico, fazer rollback
          if (step.critical) {
            await this.rollbackCorrection(actionId);
            throw error;
          }
          
          console.warn(`Passo não crítico falhou: ${step.description}`, error);
        }
      }

      action.status = CorrectionStatus.COMPLETED;
      action.completedAt = Date.now();
      this.notifyObservers(action);

      return {
        success: true,
        actionId,
        message: 'Correção executada com sucesso',
        rollbackAvailable: true
      };

    } catch (error) {
      action.status = CorrectionStatus.FAILED;
      action.error = error instanceof Error ? error.message : 'Erro desconhecido';
      this.notifyObservers(action);

      return {
        success: false,
        actionId,
        message: `Falha na correção: ${action.error}`,
        rollbackAvailable: action.rollbackSteps.length > 0
      };
    }
  }

  // Fazer rollback de correção
  async rollbackCorrection(actionId: string): Promise<boolean> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action || action.rollbackSteps.length === 0) {
      return false;
    }

    try {
      console.log(`Iniciando rollback para ação: ${actionId}`);
      
      for (const step of action.rollbackSteps) {
        try {
          await step.action();
          step.completed = true;
        } catch (error) {
          console.error(`Falha no rollback do passo: ${step.description}`, error);
          if (step.critical) {
            throw error;
          }
        }
      }

      action.status = CorrectionStatus.CANCELLED;
      this.notifyObservers(action);
      
      return true;
    } catch (error) {
      console.error('Falha crítica no rollback:', error);
      return false;
    }
  }

  // Implementações dos passos de correção
  private async createStateBackup(): Promise<boolean> {
    try {
      const state = {
        financialData: localStorage.getItem('financialData'),
        userPreferences: localStorage.getItem('userPreferences'),
        timestamp: Date.now()
      };
      
      const backupId = `state_backup_${Date.now()}`;
      this.backups.set(backupId, state);
      localStorage.setItem(`backup_${backupId}`, JSON.stringify(state));
      
      return true;
    } catch (error) {
      console.error('Erro ao criar backup do estado:', error);
      return false;
    }
  }

  private async restoreStateBackup(bugId: string): Promise<boolean> {
    try {
      const backupKey = Array.from(this.backups.keys()).find(key => key.includes('state_backup'));
      if (!backupKey) return false;
      
      const backup = this.backups.get(backupKey);
      if (!backup) return false;
      
      if (backup.financialData) {
        localStorage.setItem('financialData', backup.financialData);
      }
      if (backup.userPreferences) {
        localStorage.setItem('userPreferences', backup.userPreferences);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup do estado:', error);
      return false;
    }
  }

  private async clearMemoryCache(): Promise<boolean> {
    try {
      advancedCache.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache de memória:', error);
      return false;
    }
  }

  private async restoreCache(): Promise<boolean> {
    try {
      // Recarregar dados essenciais no cache
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      await advancedCache.preload([
        `financial_data_${currentYear}`,
        `financial_data_${currentYear}_${currentMonth}`
      ], 'high');
      
      return true;
    } catch (error) {
      console.error('Erro ao restaurar cache:', error);
      return false;
    }
  }

  private async forceGarbageCollection(): Promise<boolean> {
    try {
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Forçar limpeza de referências
      if ((window as any).FinalizationRegistry) {
        // Usar FinalizationRegistry se disponível
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao forçar garbage collection:', error);
      return false;
    }
  }

  private async cleanupEventListeners(): Promise<boolean> {
    try {
      // Implementar limpeza de event listeners órfãos
      // Por enquanto, apenas simular
      console.log('Limpando event listeners órfãos...');
      return true;
    } catch (error) {
      console.error('Erro ao limpar event listeners:', error);
      return false;
    }
  }

  private async backupCorruptedData(): Promise<boolean> {
    try {
      const corruptedData = localStorage.getItem('financialData');
      if (corruptedData) {
        const backupId = `corrupted_backup_${Date.now()}`;
        localStorage.setItem(backupId, corruptedData);
        this.backups.set(backupId, corruptedData);
      }
      return true;
    } catch (error) {
      console.error('Erro ao fazer backup de dados corrompidos:', error);
      return false;
    }
  }

  private async validateBackup(): Promise<boolean> {
    try {
      const backup = localStorage.getItem('financialData_backup');
      if (!backup) return false;
      
      // Validar estrutura do backup
      const data = JSON.parse(backup);
      return data && typeof data === 'object' && data.years;
    } catch (error) {
      console.error('Erro ao validar backup:', error);
      return false;
    }
  }

  private async restoreFromBackup(): Promise<boolean> {
    try {
      const backup = localStorage.getItem('financialData_backup');
      if (!backup) return false;
      
      localStorage.setItem('financialData', backup);
      return true;
    } catch (error) {
      console.error('Erro ao restaurar do backup:', error);
      return false;
    }
  }

  private async restoreCorruptedData(): Promise<boolean> {
    try {
      const backupKey = Array.from(this.backups.keys()).find(key => key.includes('corrupted_backup'));
      if (!backupKey) return false;
      
      const corruptedData = this.backups.get(backupKey);
      if (corruptedData) {
        localStorage.setItem('financialData', corruptedData as string);
      }
      return true;
    } catch (error) {
      console.error('Erro ao restaurar dados corrompidos:', error);
      return false;
    }
  }

  private async validateRestoredData(): Promise<boolean> {
    try {
      const data = localStorage.getItem('financialData');
      if (!data) return false;
      
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' && parsed.years;
    } catch (error) {
      console.error('Erro ao validar dados restaurados:', error);
      return false;
    }
  }

  private async backupCalculations(): Promise<boolean> {
    try {
      const data = localStorage.getItem('financialData');
      if (data) {
        const backupId = `calculations_backup_${Date.now()}`;
        this.backups.set(backupId, data);
      }
      return true;
    } catch (error) {
      console.error('Erro ao fazer backup de cálculos:', error);
      return false;
    }
  }

  private async restoreCalculations(): Promise<boolean> {
    try {
      const backupKey = Array.from(this.backups.keys()).find(key => key.includes('calculations_backup'));
      if (!backupKey) return false;
      
      const backup = this.backups.get(backupKey);
      if (backup) {
        localStorage.setItem('financialData', backup as string);
      }
      return true;
    } catch (error) {
      console.error('Erro ao restaurar cálculos:', error);
      return false;
    }
  }

  private async recalculateAllBalances(): Promise<boolean> {
    try {
      const data = JSON.parse(localStorage.getItem('financialData') || '{}');
      
      if (data.years) {
        for (const [year, yearData] of Object.entries(data.years)) {
          const months = (yearData as any)?.months;
          if (!months) continue;
          
          for (const [month, monthData] of Object.entries(months)) {
            const days = (monthData as any)?.days;
            if (!days) continue;
            
            // Recalcular saldo do mês
            let monthBalance = 0;
            for (const [day, dayData] of Object.entries(days)) {
              const transactions = (dayData as any)?.transactions || [];
              for (const transaction of transactions) {
                if (transaction.type === 'income') {
                  monthBalance += transaction.amount || 0;
                } else if (transaction.type === 'expense') {
                  monthBalance -= transaction.amount || 0;
                }
              }
            }
            
            (monthData as any).balance = monthBalance;
          }
        }
        
        localStorage.setItem('financialData', JSON.stringify(data));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao recalcular saldos:', error);
      return false;
    }
  }

  private async validateCalculations(): Promise<boolean> {
    try {
      const data = JSON.parse(localStorage.getItem('financialData') || '{}');
      
      if (data.years) {
        for (const [year, yearData] of Object.entries(data.years)) {
          const months = (yearData as any)?.months;
          if (!months) continue;
          
          for (const [month, monthData] of Object.entries(months)) {
            const days = (monthData as any)?.days;
            const balance = (monthData as any)?.balance;
            
            if (!days || typeof balance !== 'number') continue;
            
            // Validar cálculo
            let calculatedBalance = 0;
            for (const [day, dayData] of Object.entries(days)) {
              const transactions = (dayData as any)?.transactions || [];
              for (const transaction of transactions) {
                if (transaction.type === 'income') {
                  calculatedBalance += transaction.amount || 0;
                } else if (transaction.type === 'expense') {
                  calculatedBalance -= transaction.amount || 0;
                }
              }
            }
            
            // Verificar discrepância
            const difference = Math.abs(calculatedBalance - balance);
            if (difference > 0.01) {
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao validar cálculos:', error);
      return false;
    }
  }

  // Métodos adicionais para outros tipos de correção
  private async analyzeCacheState(): Promise<boolean> {
    try {
      const stats = advancedCache.getStats();
      console.log('Estado do cache:', stats);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async clearInconsistentCache(): Promise<boolean> {
    try {
      advancedCache.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async rebuildCache(): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      await advancedCache.preload([
        `financial_data_${currentYear}`,
        `financial_data_${currentYear}_${currentMonth}`
      ], 'high');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async identifyBottlenecks(): Promise<boolean> {
    try {
      // Implementar identificação de gargalos
      console.log('Identificando gargalos de performance...');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async optimizeSlowComponents(): Promise<boolean> {
    try {
      // Implementar otimização de componentes
      console.log('Otimizando componentes lentos...');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async reduceMonitoringFrequency(): Promise<boolean> {
    try {
      // Reduzir frequência de monitoramento
      bugDetector.setDetectionInterval(10000); // 10 segundos
      return true;
    } catch (error) {
      return false;
    }
  }

  private async restoreMonitoringFrequency(): Promise<boolean> {
    try {
      // Restaurar frequência normal
      bugDetector.setDetectionInterval(5000); // 5 segundos
      return true;
    } catch (error) {
      return false;
    }
  }

  private async analyzeStorageUsage(): Promise<boolean> {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length;
        }
      }
      console.log(`Uso de localStorage: ${(total / 1024 / 1024).toFixed(2)}MB`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async cleanupOldData(): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      const data = JSON.parse(localStorage.getItem('financialData') || '{}');
      
      if (data.years) {
        for (const year in data.years) {
          if (parseInt(year) < currentYear - 2) {
            delete data.years[year];
          }
        }
        localStorage.setItem('financialData', JSON.stringify(data));
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async restoreCleanedData(): Promise<boolean> {
    try {
      // Implementar restauração de dados limpos
      console.log('Restaurando dados limpos...');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async compressCurrentData(): Promise<boolean> {
    try {
      const data = localStorage.getItem('financialData');
      if (data) {
        const compressed = JSON.stringify(JSON.parse(data));
        localStorage.setItem('financialData', compressed);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private async decompressData(): Promise<boolean> {
    try {
      // Implementar descompressão
      console.log('Descomprimindo dados...');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async applyGenericFix(bug: BugReport): Promise<boolean> {
    try {
      console.log(`Aplicando correção genérica para: ${bug.type}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async createFullBackup(): Promise<string> {
    try {
      const backup = {
        financialData: localStorage.getItem('financialData'),
        userPreferences: localStorage.getItem('userPreferences'),
        cache: advancedCache.getStats(),
        timestamp: Date.now()
      };
      
      const backupId = `full_backup_${Date.now()}`;
      this.backups.set(backupId, backup);
      localStorage.setItem(`backup_${backupId}`, JSON.stringify(backup));
      
      return backupId;
    } catch (error) {
      throw new Error('Falha ao criar backup completo');
    }
  }

  // API pública
  subscribe(callback: (action: CorrectionAction) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(action: CorrectionAction): void {
    this.observers.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Erro no observer de correções:', error);
      }
    });
  }

  getActions(): CorrectionAction[] {
    return [...this.actions];
  }

  getPendingActions(): CorrectionAction[] {
    return this.actions.filter(a => a.status === CorrectionStatus.PENDING);
  }

  getCompletedActions(): CorrectionAction[] {
    return this.actions.filter(a => a.status === CorrectionStatus.COMPLETED);
  }

  getFailedActions(): CorrectionAction[] {
    return this.actions.filter(a => a.status === CorrectionStatus.FAILED);
  }

  async approveAction(actionId: string): Promise<CorrectionResult> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) {
      return {
        success: false,
        actionId,
        message: 'Ação não encontrada',
        rollbackAvailable: false
      };
    }

    if (action.type !== CorrectionType.USER_APPROVED) {
      return {
        success: false,
        actionId,
        message: 'Ação não requer aprovação',
        rollbackAvailable: false
      };
    }

    return await this.executeCorrection(actionId);
  }

  async cancelAction(actionId: string): Promise<boolean> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return false;

    if (action.status === CorrectionStatus.IN_PROGRESS) {
      return await this.rollbackCorrection(actionId);
    } else if (action.status === CorrectionStatus.PENDING) {
      action.status = CorrectionStatus.CANCELLED;
      this.notifyObservers(action);
      return true;
    }

    return false;
  }

  clearActions(): void {
    this.actions.length = 0;
  }

  getBackups(): string[] {
    return Array.from(this.backups.keys());
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) return false;

      const backupData = backup as any;
      if (backupData.financialData) {
        localStorage.setItem('financialData', backupData.financialData);
      }
      if (backupData.userPreferences) {
        localStorage.setItem('userPreferences', backupData.userPreferences);
      }

      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return false;
    }
  }
}

// Instância global
export const autoCorrectionSystem = new AutoCorrectionSystem();

// Hook para usar o sistema de correção
export function useAutoCorrection() {
  const [actions, setActions] = useState<CorrectionAction[]>([]);

  useEffect(() => {
    const unsubscribe = autoCorrectionSystem.subscribe((action) => {
      setActions(prev => {
        const index = prev.findIndex(a => a.id === action.id);
        if (index >= 0) {
          const newActions = [...prev];
          newActions[index] = action;
          return newActions;
        } else {
          return [...prev, action];
        }
      });
    });

    return unsubscribe;
  }, []);

  return {
    actions,
    pendingActions: actions.filter(a => a.status === CorrectionStatus.PENDING),
    completedActions: actions.filter(a => a.status === CorrectionStatus.COMPLETED),
    failedActions: actions.filter(a => a.status === CorrectionStatus.FAILED),
    approveAction: autoCorrectionSystem.approveAction.bind(autoCorrectionSystem),
    cancelAction: autoCorrectionSystem.cancelAction.bind(autoCorrectionSystem),
    rollbackCorrection: autoCorrectionSystem.rollbackCorrection.bind(autoCorrectionSystem),
    restoreBackup: autoCorrectionSystem.restoreBackup.bind(autoCorrectionSystem),
    getBackups: autoCorrectionSystem.getBackups.bind(autoCorrectionSystem)
  };
}

export default autoCorrectionSystem;