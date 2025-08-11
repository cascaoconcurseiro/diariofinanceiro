import { TransactionEntry } from '../types/transactions';
import { TransactionImpactCalculator, TransactionImpact } from './transactionImpactCalculator';
import { CascadeBalanceManager, PropagationResult } from './cascadeBalanceManager';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA' | 'DIARIO';
  description?: string;
}

export interface MonthlyData {
  initialBalance: number;
  finalBalance: number;
  transactions: Transaction[];
  transactionCount: number;
  lastModified: string;
  checksum: string;
  isCalculated: boolean;
  calculationTime: number;
  propagationHistory: PropagationEvent[];
}

export interface PropagationEvent {
  timestamp: string;
  operation: string;
  impact: number;
  source: string;
}

export interface BalancePropagationResult {
  success: boolean;
  affectedMonths: string[];
  errors: string[];
  executionTime: number;
  propagationId: string;
  cacheHits: number;
  cacheMisses: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number;
}

export interface PropagationCache {
  snapshots: Map<string, BalanceSnapshot>;
  invalidatedMonths: Set<string>;
  lastFullRecalculation: string;
  hitCount: number;
  missCount: number;
}

export interface BalanceSnapshot {
  monthKey: string;
  initialBalance: number;
  finalBalance: number;
  transactionCount: number;
  lastModified: string;
  checksum: string;
}

export interface PropagationState {
  isProcessing: boolean;
  currentOperation: string;
  progress: number;
  estimatedTimeRemaining: number;
  lastError?: string;
  totalOperations: number;
  completedOperations: number;
  affectedMonths: string[];
  cacheHitRate: number;
  invalidatedMonths: number;
}

/**
 * ENHANCED: BalancePropagationEngine
 * 
 * Engine melhorada com cache multi-nível, performance otimizada
 * e sistema de propagação em cascata robusto.
 */
export class EnhancedBalancePropagationEngine {
  private data: Map<string, MonthlyData> = new Map();
  private cache: PropagationCache;
  private impactCalculator: TransactionImpactCalculator;
  private cascadeManager: CascadeBalanceManager;
  private state: PropagationState;

  constructor(initialData: Map<string, MonthlyData>) {
    console.log(`🚀 ENHANCED ENGINE: Initializing with ${initialData.size} months`);
    
    this.data = new Map(initialData);
    this.impactCalculator = new TransactionImpactCalculator();
    this.cascadeManager = new CascadeBalanceManager();
    
    this.cache = {
      snapshots: new Map(),
      invalidatedMonths: new Set(),
      lastFullRecalculation: new Date().toISOString(),
      hitCount: 0,
      missCount: 0
    };

    this.state = {
      isProcessing: false,
      currentOperation: '',
      progress: 0,
      estimatedTimeRemaining: 0,
      totalOperations: 0,
      completedOperations: 0,
      affectedMonths: [],
      cacheHitRate: 0,
      invalidatedMonths: 0
    };

    this.initializeCache();
  }

  /**
   * Processa mudança em transação com propagação automática
   */
  async processTransactionChange(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    transaction: TransactionEntry,
    oldTransaction?: TransactionEntry
  ): Promise<BalancePropagationResult> {
    const startTime = Date.now();
    const propagationId = this.generatePropagationId();
    
    console.log(`🔄 ENHANCED ENGINE: Processing ${operation} for transaction ${transaction.id}`, {
      propagationId,
      date: transaction.date,
      amount: transaction.amount
    });

    this.updateState({
      isProcessing: true,
      currentOperation: `${operation} Transaction`,
      progress: 0,
      totalOperations: 1,
      completedOperations: 0
    });

    try {
      // Calcular impacto da mudança
      const impact = this.impactCalculator.calculateImpact(operation, transaction, oldTransaction);
      
      console.log(`📊 ENHANCED ENGINE: Calculated impact`, {
        difference: impact.difference,
        affectedPeriods: impact.affectedPeriods.length
      });

      // Aplicar mudança nos dados mensais
      await this.applyTransactionChange(impact);

      // Propagar mudanças em cascata
      const propagationResult = await this.cascadeManager.propagateFromDate(
        impact.startDate,
        impact.difference,
        {
          startDate: impact.startDate,
          batchSize: 12, // Processar 12 meses por vez
          validateIntegrity: true,
          rollbackOnError: true
        }
      );

      // Invalidar cache para períodos afetados
      this.invalidateCache(impact.startDate);

      // Atualizar estatísticas
      this.updateCacheStats(propagationResult);

      const result: BalancePropagationResult = {
        success: propagationResult.success,
        affectedMonths: propagationResult.processedMonths,
        errors: propagationResult.errors,
        executionTime: Date.now() - startTime,
        propagationId,
        cacheHits: this.cache.hitCount,
        cacheMisses: this.cache.missCount
      };

      console.log(`✅ ENHANCED ENGINE: Transaction change processed`, {
        success: result.success,
        affectedMonths: result.affectedMonths.length,
        executionTime: result.executionTime,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error(`❌ ENHANCED ENGINE: Error processing transaction change:`, error);
      
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        executionTime: Date.now() - startTime,
        propagationId,
        cacheHits: this.cache.hitCount,
        cacheMisses: this.cache.missCount
      };
    } finally {
      this.updateState({
        isProcessing: false,
        currentOperation: '',
        progress: 100,
        completedOperations: 1
      });
    }
  }

  /**
   * Recalcula saldos a partir de uma data específica
   */
  async recalculateFromDate(startDate: string): Promise<BalancePropagationResult> {
    const startTime = Date.now();
    const propagationId = this.generatePropagationId();
    
    console.log(`🔄 ENHANCED ENGINE: Starting recalculation from ${startDate}`, {
      propagationId
    });

    this.updateState({
      isProcessing: true,
      currentOperation: 'Full Recalculation',
      progress: 0
    });

    try {
      // Obter todos os meses a partir da data
      const monthsToRecalculate = this.getMonthsFromDate(startDate);
      
      this.updateState({
        totalOperations: monthsToRecalculate.length,
        affectedMonths: monthsToRecalculate
      });

      console.log(`📅 ENHANCED ENGINE: Will recalculate ${monthsToRecalculate.length} months`);

      // Recalcular cada mês sequencialmente
      const processedMonths: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < monthsToRecalculate.length; i++) {
        const monthKey = monthsToRecalculate[i];
        
        try {
          await this.recalculateMonth(monthKey);
          processedMonths.push(monthKey);
          
          this.updateState({
            completedOperations: i + 1,
            progress: Math.round(((i + 1) / monthsToRecalculate.length) * 100)
          });
          
        } catch (error) {
          const errorMsg = `Erro recalculando mês ${monthKey}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          console.error(`❌ ENHANCED ENGINE: ${errorMsg}`);
        }
      }

      // Invalidar cache completamente
      this.invalidateCache(startDate);
      this.cache.lastFullRecalculation = new Date().toISOString();

      const result: BalancePropagationResult = {
        success: errors.length === 0,
        affectedMonths: processedMonths,
        errors,
        executionTime: Date.now() - startTime,
        propagationId,
        cacheHits: this.cache.hitCount,
        cacheMisses: this.cache.missCount
      };

      console.log(`✅ ENHANCED ENGINE: Recalculation completed`, {
        success: result.success,
        processedMonths: result.affectedMonths.length,
        executionTime: result.executionTime,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error(`❌ ENHANCED ENGINE: Critical error during recalculation:`, error);
      
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro crítico'],
        executionTime: Date.now() - startTime,
        propagationId,
        cacheHits: this.cache.hitCount,
        cacheMisses: this.cache.missCount
      };
    } finally {
      this.updateState({
        isProcessing: false,
        currentOperation: '',
        progress: 100
      });
    }
  }

  /**
   * Valida e corrige integridade dos dados
   */
  async validateAndCorrectIntegrity(): Promise<ValidationResult> {
    console.log(`🔍 ENHANCED ENGINE: Starting integrity validation and correction`);

    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validar continuidade de saldos
      const continuityResult = await this.validateBalanceContinuity();
      errors.push(...continuityResult.errors);
      warnings.push(...continuityResult.warnings);

      // Validar checksums
      const checksumResult = await this.validateChecksums();
      errors.push(...checksumResult.errors);
      warnings.push(...checksumResult.warnings);

      // Validar cálculos internos
      const calculationResult = await this.validateInternalCalculations();
      errors.push(...calculationResult.errors);
      warnings.push(...calculationResult.warnings);

      // Se há erros, tentar correção automática
      if (errors.length > 0) {
        console.log(`🔧 ENHANCED ENGINE: Found ${errors.length} errors, attempting auto-correction`);
        
        const correctionResult = await this.performAutoCorrection(errors);
        if (correctionResult.success) {
          suggestions.push(`Auto-correção aplicada: ${correctionResult.correctionsMade} correções realizadas`);
          
          // Re-validar após correção
          const revalidationResult = await this.validateAndCorrectIntegrity();
          return revalidationResult;
        } else {
          suggestions.push('Auto-correção falhou. Recálculo completo recomendado.');
        }
      }

      // Calcular score de integridade
      const totalChecks = this.data.size * 3; // 3 validações por mês
      const failedChecks = errors.length;
      const score = Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100));

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        score
      };

      console.log(`✅ ENHANCED ENGINE: Integrity validation completed`, {
        isValid: result.isValid,
        score: result.score,
        errors: errors.length,
        warnings: warnings.length,
        executionTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      console.error(`❌ ENHANCED ENGINE: Error during integrity validation:`, error);
      
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Erro na validação'],
        warnings,
        suggestions: ['Execute recálculo completo para corrigir problemas'],
        score: 0
      };
    }
  }

  /**
   * Obtém dados atualizados
   */
  getData(): Map<string, MonthlyData> {
    return new Map(this.data);
  }

  /**
   * Atualiza dados internos
   */
  updateData(newData: Map<string, MonthlyData>): void {
    console.log(`🔄 ENHANCED ENGINE: Updating internal data with ${newData.size} months`);
    this.data = new Map(newData);
    this.rebuildCache();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    snapshotCount: number;
    invalidatedMonths: number;
    lastFullRecalculation: string;
  } {
    const total = this.cache.hitCount + this.cache.missCount;
    const hitRate = total > 0 ? (this.cache.hitCount / total) * 100 : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.cache.hitCount,
      totalMisses: this.cache.missCount,
      snapshotCount: this.cache.snapshots.size,
      invalidatedMonths: this.cache.invalidatedMonths.size,
      lastFullRecalculation: this.cache.lastFullRecalculation
    };
  }

  /**
   * Obtém estado atual da propagação
   */
  getState(): PropagationState {
    return { ...this.state };
  }

  // Métodos privados

  private initializeCache(): void {
    console.log(`📸 ENHANCED ENGINE: Initializing cache`);
    
    for (const [monthKey, monthData] of this.data.entries()) {
      const snapshot: BalanceSnapshot = {
        monthKey,
        initialBalance: monthData.initialBalance,
        finalBalance: monthData.finalBalance,
        transactionCount: monthData.transactionCount,
        lastModified: monthData.lastModified,
        checksum: monthData.checksum
      };
      
      this.cache.snapshots.set(monthKey, snapshot);
    }
  }

  private async applyTransactionChange(impact: TransactionImpact): Promise<void> {
    const monthKey = impact.transactionDate.substring(0, 7); // YYYY-MM
    const monthData = this.data.get(monthKey);
    
    if (!monthData) {
      console.warn(`⚠️ ENHANCED ENGINE: Month data not found for ${monthKey}`);
      return;
    }

    // Aplicar mudança no mês da transação
    monthData.finalBalance += impact.difference;
    monthData.lastModified = new Date().toISOString();
    monthData.checksum = this.calculateChecksum(monthData);
    
    // Adicionar evento ao histórico
    monthData.propagationHistory.push({
      timestamp: new Date().toISOString(),
      operation: impact.operationType,
      impact: impact.difference,
      source: 'EnhancedBalancePropagationEngine'
    });

    console.log(`💰 ENHANCED ENGINE: Applied impact ${impact.difference} to month ${monthKey}`);
  }

  private async recalculateMonth(monthKey: string): Promise<void> {
    const monthData = this.data.get(monthKey);
    if (!monthData) return;

    // Obter saldo inicial do mês anterior
    const previousMonthKey = this.getPreviousMonthKey(monthKey);
    let initialBalance = 0;
    
    if (previousMonthKey) {
      const previousMonth = this.data.get(previousMonthKey);
      initialBalance = previousMonth?.finalBalance || 0;
    }

    // Recalcular saldo final baseado nas transações
    let finalBalance = initialBalance;
    for (const transaction of monthData.transactions) {
      const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
      finalBalance += amount;
    }

    // Atualizar dados do mês
    monthData.initialBalance = initialBalance;
    monthData.finalBalance = finalBalance;
    monthData.lastModified = new Date().toISOString();
    monthData.checksum = this.calculateChecksum(monthData);
    monthData.isCalculated = true;
    monthData.calculationTime = Date.now();

    console.log(`🧮 ENHANCED ENGINE: Recalculated month ${monthKey}: ${initialBalance} → ${finalBalance}`);
  }

  private async validateBalanceContinuity(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const sortedMonths = Array.from(this.data.keys()).sort();
    
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevMonth = sortedMonths[i - 1];
      const currentMonth = sortedMonths[i];
      
      const prevData = this.data.get(prevMonth);
      const currentData = this.data.get(currentMonth);
      
      if (prevData && currentData) {
        if (Math.abs(prevData.finalBalance - currentData.initialBalance) > 0.01) {
          errors.push(`Descontinuidade entre ${prevMonth} e ${currentMonth}`);
        }
      }
    }
    
    return { errors, warnings };
  }

  private async validateChecksums(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [monthKey, monthData] of this.data.entries()) {
      const calculatedChecksum = this.calculateChecksum(monthData);
      if (calculatedChecksum !== monthData.checksum) {
        errors.push(`Checksum inválido para mês ${monthKey}`);
      }
    }
    
    return { errors, warnings };
  }

  private async validateInternalCalculations(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [monthKey, monthData] of this.data.entries()) {
      let calculatedBalance = monthData.initialBalance;
      
      for (const transaction of monthData.transactions) {
        const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
        calculatedBalance += amount;
      }
      
      if (Math.abs(calculatedBalance - monthData.finalBalance) > 0.01) {
        errors.push(`Cálculo interno incorreto para mês ${monthKey}`);
      }
    }
    
    return { errors, warnings };
  }

  private async performAutoCorrection(errors: string[]): Promise<{ success: boolean; correctionsMade: number }> {
    console.log(`🔧 ENHANCED ENGINE: Performing auto-correction for ${errors.length} errors`);
    
    let correctionsMade = 0;
    
    try {
      // Recalcular todos os meses para corrigir problemas
      const sortedMonths = Array.from(this.data.keys()).sort();
      
      for (const monthKey of sortedMonths) {
        await this.recalculateMonth(monthKey);
        correctionsMade++;
      }
      
      return { success: true, correctionsMade };
    } catch (error) {
      console.error(`❌ ENHANCED ENGINE: Auto-correction failed:`, error);
      return { success: false, correctionsMade };
    }
  }

  private invalidateCache(fromDate: string): void {
    const monthsToInvalidate = this.getMonthsFromDate(fromDate);
    
    for (const monthKey of monthsToInvalidate) {
      this.cache.invalidatedMonths.add(monthKey);
      this.cache.snapshots.delete(monthKey);
    }
    
    console.log(`🗑️ ENHANCED ENGINE: Invalidated cache for ${monthsToInvalidate.length} months from ${fromDate}`);
  }

  private async rebuildCache(): Promise<void> {
    console.log(`🔄 ENHANCED ENGINE: Rebuilding cache`);
    
    this.cache.snapshots.clear();
    this.cache.invalidatedMonths.clear();
    this.initializeCache();
  }

  private updateState(updates: Partial<PropagationState>): void {
    this.state = { ...this.state, ...updates };
    
    // Calcular taxa de cache hit
    const total = this.cache.hitCount + this.cache.missCount;
    this.state.cacheHitRate = total > 0 ? (this.cache.hitCount / total) * 100 : 0;
    this.state.invalidatedMonths = this.cache.invalidatedMonths.size;
  }

  private updateCacheStats(result: PropagationResult): void {
    // Atualizar estatísticas baseado no resultado da propagação
    if (result.success) {
      this.cache.hitCount += result.processedMonths.length;
    } else {
      this.cache.missCount += result.errors.length;
    }
  }

  private generatePropagationId(): string {
    return `enhanced_prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getMonthsFromDate(startDate: string): string[] {
    const months: string[] = [];
    const start = new Date(startDate);
    const end = new Date(new Date().getFullYear() + 2, 11, 31);
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }

  private getPreviousMonthKey(monthKey: string): string | null {
    const [year, month] = monthKey.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month-2 porque month é 1-based
    
    return `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private calculateChecksum(monthData: MonthlyData): string {
    const data = `${monthData.initialBalance}_${monthData.finalBalance}_${monthData.transactionCount}_${monthData.lastModified}`;
    return btoa(data).substring(0, 16);
  }
}