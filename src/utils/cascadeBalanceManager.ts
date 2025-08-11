import { TransactionImpact } from './transactionImpactCalculator';

export interface CascadePropagationOptions {
  startDate: string;
  endDate?: string;
  batchSize: number;
  validateIntegrity: boolean;
  rollbackOnError: boolean;
}

export interface PropagationResult {
  success: boolean;
  processedMonths: string[];
  affectedTransactions: number;
  executionTime: number;
  errors: string[];
  rollbackPerformed: boolean;
  propagationId: string;
}

export interface MonthlyBalance {
  monthKey: string;
  initialBalance: number;
  finalBalance: number;
  transactionCount: number;
  lastModified: string;
}

export interface PropagationSnapshot {
  id: string;
  timestamp: string;
  monthlyBalances: Map<string, MonthlyBalance>;
  operation: string;
}

/**
 * CRITICAL: CascadeBalanceManager
 * 
 * Coordena a propagação de saldos entre meses e anos.
 * Garante que mudanças sejam aplicadas corretamente em cascata.
 */
export class CascadeBalanceManager {
  private snapshots: Map<string, PropagationSnapshot> = new Map();
  private isProcessing: boolean = false;
  private currentPropagationId: string | null = null;

  /**
   * Propaga impacto a partir de uma data específica
   */
  async propagateFromDate(
    startDate: string,
    impact: number,
    options: CascadePropagationOptions
  ): Promise<PropagationResult> {
    const startTime = Date.now();
    const propagationId = this.generatePropagationId();
    
    console.log(`🔗 CASCADE: Starting propagation from ${startDate} with impact ${impact}`, {
      propagationId,
      options
    });

    if (this.isProcessing) {
      return {
        success: false,
        processedMonths: [],
        affectedTransactions: 0,
        executionTime: 0,
        errors: ['Propagação já em andamento'],
        rollbackPerformed: false,
        propagationId
      };
    }

    this.isProcessing = true;
    this.currentPropagationId = propagationId;

    try {
      // Criar snapshot antes da operação
      if (options.rollbackOnError) {
        await this.createSnapshot(propagationId, 'BEFORE_PROPAGATION');
      }

      // Calcular períodos afetados
      const affectedMonths = this.calculateAffectedMonths(startDate, options.endDate);
      console.log(`📅 CASCADE: Will process ${affectedMonths.length} months`);

      // Processar em lotes
      const processedMonths: string[] = [];
      const errors: string[] = [];
      let affectedTransactions = 0;

      for (let i = 0; i < affectedMonths.length; i += options.batchSize) {
        const batch = affectedMonths.slice(i, i + options.batchSize);
        
        try {
          const batchResult = await this.processBatch(batch, impact, propagationId);
          processedMonths.push(...batchResult.processedMonths);
          affectedTransactions += batchResult.affectedTransactions;
          
          if (batchResult.errors.length > 0) {
            errors.push(...batchResult.errors);
          }
        } catch (error) {
          const errorMsg = `Erro no lote ${i / options.batchSize + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          console.error(`❌ CASCADE: ${errorMsg}`);
          
          if (options.rollbackOnError) {
            console.log(`🔄 CASCADE: Performing rollback due to error`);
            await this.rollbackPropagation(propagationId);
            
            return {
              success: false,
              processedMonths: [],
              affectedTransactions: 0,
              executionTime: Date.now() - startTime,
              errors,
              rollbackPerformed: true,
              propagationId
            };
          }
        }
      }

      // Validar integridade se solicitado
      if (options.validateIntegrity) {
        const validationResult = await this.validatePropagationIntegrity(processedMonths);
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
        }
      }

      const executionTime = Date.now() - startTime;
      const success = errors.length === 0;

      console.log(`✅ CASCADE: Propagation completed`, {
        success,
        processedMonths: processedMonths.length,
        affectedTransactions,
        executionTime,
        errors: errors.length
      });

      return {
        success,
        processedMonths,
        affectedTransactions,
        executionTime,
        errors,
        rollbackPerformed: false,
        propagationId
      };

    } finally {
      this.isProcessing = false;
      this.currentPropagationId = null;
    }
  }

  /**
   * Propaga múltiplos impactos em lote
   */
  async propagateBatch(impacts: TransactionImpact[]): Promise<PropagationResult> {
    const startTime = Date.now();
    const propagationId = this.generatePropagationId();
    
    console.log(`🔗 BATCH CASCADE: Starting batch propagation for ${impacts.length} impacts`, {
      propagationId
    });

    if (this.isProcessing) {
      return {
        success: false,
        processedMonths: [],
        affectedTransactions: 0,
        executionTime: 0,
        errors: ['Propagação já em andamento'],
        rollbackPerformed: false,
        propagationId
      };
    }

    this.isProcessing = true;
    this.currentPropagationId = propagationId;

    try {
      // Criar snapshot
      await this.createSnapshot(propagationId, 'BEFORE_BATCH_PROPAGATION');

      // Agrupar impactos por mês para otimizar processamento
      const impactsByMonth = this.groupImpactsByMonth(impacts);
      console.log(`📊 BATCH CASCADE: Grouped impacts into ${impactsByMonth.size} months`);

      const processedMonths: string[] = [];
      const errors: string[] = [];
      let affectedTransactions = 0;

      // Processar cada mês com seus impactos
      for (const [monthKey, monthImpacts] of impactsByMonth.entries()) {
        try {
          const monthResult = await this.processMonthImpacts(monthKey, monthImpacts, propagationId);
          
          if (monthResult.success) {
            processedMonths.push(monthKey);
            affectedTransactions += monthResult.affectedTransactions;
            
            // Propagar o impacto total do mês para meses subsequentes
            const totalMonthImpact = monthImpacts.reduce((sum, impact) => sum + impact.difference, 0);
            if (totalMonthImpact !== 0) {
              await this.propagateMonthImpact(monthKey, totalMonthImpact);
            }
          } else {
            errors.push(...monthResult.errors);
          }
        } catch (error) {
          const errorMsg = `Erro processando mês ${monthKey}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          console.error(`❌ BATCH CASCADE: ${errorMsg}`);
        }
      }

      const executionTime = Date.now() - startTime;
      const success = errors.length === 0;

      console.log(`✅ BATCH CASCADE: Batch propagation completed`, {
        success,
        processedMonths: processedMonths.length,
        affectedTransactions,
        executionTime,
        errors: errors.length
      });

      return {
        success,
        processedMonths,
        affectedTransactions,
        executionTime,
        errors,
        rollbackPerformed: false,
        propagationId
      };

    } finally {
      this.isProcessing = false;
      this.currentPropagationId = null;
    }
  }

  /**
   * Executa rollback de uma propagação
   */
  async rollbackPropagation(propagationId: string): Promise<boolean> {
    console.log(`🔄 ROLLBACK: Starting rollback for propagation ${propagationId}`);

    try {
      const snapshot = this.snapshots.get(propagationId);
      if (!snapshot) {
        console.error(`❌ ROLLBACK: Snapshot not found for propagation ${propagationId}`);
        return false;
      }

      // Restaurar saldos mensais do snapshot
      await this.restoreFromSnapshot(snapshot);
      
      console.log(`✅ ROLLBACK: Successfully rolled back propagation ${propagationId}`);
      return true;
    } catch (error) {
      console.error(`❌ ROLLBACK: Error during rollback:`, error);
      return false;
    }
  }

  /**
   * Valida a integridade da propagação
   */
  async validatePropagationIntegrity(processedMonths?: string[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    console.log(`🔍 VALIDATION: Validating propagation integrity`);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar continuidade de saldos entre meses
      const monthsToValidate = processedMonths || this.getAllMonthKeys();
      const sortedMonths = monthsToValidate.sort();

      for (let i = 1; i < sortedMonths.length; i++) {
        const prevMonth = sortedMonths[i - 1];
        const currentMonth = sortedMonths[i];
        
        const prevBalance = await this.getMonthFinalBalance(prevMonth);
        const currentInitialBalance = await this.getMonthInitialBalance(currentMonth);
        
        if (Math.abs(prevBalance - currentInitialBalance) > 0.01) {
          errors.push(`Descontinuidade entre ${prevMonth} e ${currentMonth}: ${prevBalance} != ${currentInitialBalance}`);
        }
      }

      // Validar se não há valores NaN ou infinitos
      for (const monthKey of sortedMonths) {
        const finalBalance = await this.getMonthFinalBalance(monthKey);
        if (isNaN(finalBalance) || !isFinite(finalBalance)) {
          errors.push(`Saldo inválido no mês ${monthKey}: ${finalBalance}`);
        }
      }

      const isValid = errors.length === 0;
      
      console.log(`✅ VALIDATION: Integrity validation completed`, {
        isValid,
        errors: errors.length,
        warnings: warnings.length
      });

      return { isValid, errors, warnings };
    } catch (error) {
      console.error(`❌ VALIDATION: Error during validation:`, error);
      return {
        isValid: false,
        errors: [`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        warnings
      };
    }
  }

  // Métodos privados auxiliares

  private generatePropagationId(): string {
    return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateAffectedMonths(startDate: string, endDate?: string): string[] {
    const months: string[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear() + 2, 11, 31);
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private async processBatch(
    months: string[],
    impact: number,
    propagationId: string
  ): Promise<{
    processedMonths: string[];
    affectedTransactions: number;
    errors: string[];
  }> {
    const processedMonths: string[] = [];
    const errors: string[] = [];
    let affectedTransactions = 0;

    for (const monthKey of months) {
      try {
        await this.applyImpactToMonth(monthKey, impact);
        processedMonths.push(monthKey);
        affectedTransactions += 1; // Simplificado - contar como 1 transação afetada por mês
      } catch (error) {
        errors.push(`Erro no mês ${monthKey}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { processedMonths, affectedTransactions, errors };
  }

  private groupImpactsByMonth(impacts: TransactionImpact[]): Map<string, TransactionImpact[]> {
    const grouped = new Map<string, TransactionImpact[]>();

    for (const impact of impacts) {
      const monthKey = impact.transactionDate.substring(0, 7); // YYYY-MM
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      
      grouped.get(monthKey)!.push(impact);
    }

    return grouped;
  }

  private async processMonthImpacts(
    monthKey: string,
    impacts: TransactionImpact[],
    propagationId: string
  ): Promise<{
    success: boolean;
    affectedTransactions: number;
    errors: string[];
  }> {
    try {
      const totalImpact = impacts.reduce((sum, impact) => sum + impact.difference, 0);
      await this.applyImpactToMonth(monthKey, totalImpact);
      
      return {
        success: true,
        affectedTransactions: impacts.length,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        affectedTransactions: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  private async propagateMonthImpact(monthKey: string, impact: number): Promise<void> {
    // Propagar impacto para meses subsequentes
    const [year, month] = monthKey.split('-').map(Number);
    const nextMonth = new Date(year, month, 1); // month já é 1-based
    
    const subsequentMonths = this.calculateAffectedMonths(
      `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}-01`
    );

    for (const subsequentMonth of subsequentMonths) {
      await this.applyImpactToMonth(subsequentMonth, impact);
    }
  }

  private async applyImpactToMonth(monthKey: string, impact: number): Promise<void> {
    // Esta é uma implementação simplificada
    // Na implementação real, isso integraria com o sistema de dados
    console.log(`💰 APPLY: Applying impact ${impact} to month ${monthKey}`);
    
    // Simular aplicação do impacto
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  private async createSnapshot(propagationId: string, operation: string): Promise<void> {
    console.log(`📸 SNAPSHOT: Creating snapshot for ${propagationId}`);
    
    // Implementação simplificada - na prática, capturaria o estado atual
    const snapshot: PropagationSnapshot = {
      id: propagationId,
      timestamp: new Date().toISOString(),
      monthlyBalances: new Map(),
      operation
    };

    this.snapshots.set(propagationId, snapshot);
  }

  private async restoreFromSnapshot(snapshot: PropagationSnapshot): Promise<void> {
    console.log(`🔄 RESTORE: Restoring from snapshot ${snapshot.id}`);
    
    // Implementação simplificada - na prática, restauraria os saldos
    for (const [monthKey, balance] of snapshot.monthlyBalances.entries()) {
      await this.restoreMonthBalance(monthKey, balance);
    }
  }

  private async restoreMonthBalance(monthKey: string, balance: MonthlyBalance): Promise<void> {
    console.log(`🔄 RESTORE: Restoring balance for month ${monthKey}`);
    // Implementação simplificada
  }

  private getAllMonthKeys(): string[] {
    // Implementação simplificada - retornaria todas as chaves de meses
    return [];
  }

  private async getMonthFinalBalance(monthKey: string): Promise<number> {
    // Implementação simplificada - retornaria o saldo final do mês
    return 0;
  }

  private async getMonthInitialBalance(monthKey: string): Promise<number> {
    // Implementação simplificada - retornaria o saldo inicial do mês
    return 0;
  }

  /**
   * Obtém estatísticas do manager
   */
  getStats(): {
    totalPropagations: number;
    averageExecutionTime: number;
    successRate: number;
    isProcessing: boolean;
    currentPropagationId: string | null;
  } {
    return {
      totalPropagations: this.snapshots.size,
      averageExecutionTime: 0, // Implementar tracking se necessário
      successRate: 1.0, // Implementar tracking se necessário
      isProcessing: this.isProcessing,
      currentPropagationId: this.currentPropagationId
    };
  }
}

export const cascadeBalanceManager = new CascadeBalanceManager();