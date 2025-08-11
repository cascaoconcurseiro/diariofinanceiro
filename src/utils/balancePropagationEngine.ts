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
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
}

export interface BalanceSnapshot {
  monthKey: string;
  initialBalance: number;
  finalBalance: number;
  transactionCount: number;
  lastModified: string;
  checksum: string;
}

export interface CacheStats {
  totalSnapshots: number;
  invalidatedMonths: number;
  hitRate: number;
  lastFullRecalculation: string;
  memoryUsage: number;
}

/**
 * ENHANCED BALANCE PROPAGATION ENGINE
 * 
 * Sistema avançado de propagação de saldos com cache, performance otimizada
 * e validação de integridade automática.
 */
export class BalancePropagationEngine {
  private data: Map<string, MonthlyData> = new Map();
  private cache: PropagationCache;
  private impactCalculator: TransactionImpactCalculator;
  private cascadeManager: CascadeBalanceManager;

  constructor(initialData?: Map<string, MonthlyData>) {
    this.data = initialData ? new Map(initialData) : new Map();
    this.impactCalculator = new TransactionImpactCalculator();
    this.cascadeManager = new CascadeBalanceManager();
    
    // Inicializar cache
    this.cache = {
      snapshots: new Map(),
      invalidatedMonths: new Set(),
      lastFullRecalculation: new Date().toISOString(),
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0
    };

    console.log('🚀 ENHANCED ENGINE: Balance Propagation Engine initialized with cache');
  }

  /**
   * MÉTODO PRINCIPAL: Processa mudança de transação com propagação automática
   */
  async processTransactionChange(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    transaction: TransactionEntry,
    oldTransaction?: TransactionEntry
  ): Promise<BalancePropagationResult> {
    const startTime = Date.now();
    console.log(`🔄 ENGINE: Processing ${operation} for transaction ${transaction.id}`);

    try {
      // Calcular impacto da mudança
      const impact = this.impactCalculator.calculateImpact(operation, transaction, oldTransaction);
      
      // Invalidar cache para períodos afetados
      this.invalidateCache(impact.transactionDate);
      
      // Aplicar mudança nos dados locais
      await this.applyTransactionChange(operation, transaction, oldTransaction);
      
      // Propagar mudanças usando o cascade manager
      const propagationResult = await this.cascadeManager.propagateBatch([impact]);
      
      // Atualizar cache com novos dados
      await this.updateCacheAfterPropagation(impact.affectedPeriods);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ ENGINE: Transaction change processed successfully in ${executionTime}ms`);
      
      return {
        success: propagationResult.success,
        affectedMonths: propagationResult.processedMonths,
        errors: propagationResult.errors,
        executionTime,
        propagationId: propagationResult.propagationId
      };
      
    } catch (error) {
      console.error('❌ ENGINE: Error processing transaction change:', error);
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        executionTime: Date.now() - startTime,
        propagationId: 'error'
      };
    }
  }

  /**
   * Recalcula saldos a partir de uma data específica
   */
  async recalculateFromDate(startDate: string): Promise<BalancePropagationResult> {
    const startTime = Date.now();
    console.log(`🔄 ENGINE: Starting recalculation from ${startDate}`);

    try {
      // Invalidar cache a partir da data
      this.invalidateCache(startDate);
      
      // Recalcular todos os saldos a partir da data
      const result = await this.performFullRecalculation(startDate);
      
      // Atualizar timestamp da última recalculação completa
      this.cache.lastFullRecalculation = new Date().toISOString();
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ ENGINE: Recalculation completed in ${executionTime}ms`);
      
      return {
        success: result.success,
        affectedMonths: result.processedMonths,
        errors: result.errors,
        executionTime,
        propagationId: result.propagationId
      };
      
    } catch (error) {
      console.error('❌ ENGINE: Error during recalculation:', error);
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro na recalculação'],
        executionTime: Date.now() - startTime,
        propagationId: 'error'
      };
    }
  }

  /**
   * Valida e corrige integridade automaticamente
   */
  async validateAndCorrectIntegrity(): Promise<ValidationResult> {
    console.log('🔍 ENGINE: Starting integrity validation and correction');

    try {
      const validation = this.validateIntegrity();
      
      if (!validation.isValid) {
        console.log(`⚠️ ENGINE: Found ${validation.errors.length} integrity issues, attempting correction`);
        
        // Tentar correção automática
        const correctionResult = await this.performAutomaticCorrection(validation.errors);
        
        if (correctionResult.success) {
          // Re-validar após correção
          const revalidation = this.validateIntegrity();
          
          return {
            ...revalidation,
            suggestions: [
              ...revalidation.suggestions,
              `Correção automática aplicada: ${correctionResult.correctionsMade} correções`
            ]
          };
        } else {
          return {
            ...validation,
            suggestions: [
              ...validation.suggestions,
              'Correção automática falhou - intervenção manual necessária'
            ]
          };
        }
      }
      
      return validation;
      
    } catch (error) {
      console.error('❌ ENGINE: Error during validation:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Erro na validação'],
        warnings: [],
        suggestions: ['Executar diagnóstico manual do sistema'],
        score: 0
      };
    }
  }

  /**
   * Propaga uma transação para todos os meses subsequentes (método legado mantido para compatibilidade)
   */
  propagateTransaction(transaction: Transaction, startDate: Date): BalancePropagationResult {
    try {
      const affectedMonths: string[] = [];
      const startKey = this.getMonthKey(startDate);
      const transactionAmount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;

      // Obter todos os meses a partir da data de início
      const monthsToUpdate = this.getMonthsFromDate(startDate);

      for (const monthKey of monthsToUpdate) {
        const monthData = this.data.get(monthKey);
        if (monthData) {
          // Atualizar saldo final do mês
          monthData.finalBalance += transactionAmount;
          
          // Se não é o mês da transação, também atualizar saldo inicial
          if (monthKey !== startKey) {
            monthData.initialBalance += transactionAmount;
          }

          affectedMonths.push(monthKey);
        }
      }

      return {
        success: true,
        affectedMonths,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Recalcula todos os saldos a partir de uma data específica
   */
  recalculateFromDate(date: Date): BalancePropagationResult {
    try {
      const affectedMonths: string[] = [];
      const startKey = this.getMonthKey(date);
      
      // Obter saldo do mês anterior como base
      const previousMonth = this.getPreviousMonth(date);
      let carryOverBalance = 0;
      
      if (previousMonth) {
        const previousMonthData = this.data.get(this.getMonthKey(previousMonth));
        carryOverBalance = previousMonthData?.finalBalance || 0;
      }

      // Recalcular todos os meses a partir da data
      const monthsToRecalculate = this.getMonthsFromDate(date);

      for (const monthKey of monthsToRecalculate) {
        const monthData = this.data.get(monthKey);
        if (monthData) {
          // Definir saldo inicial
          monthData.initialBalance = carryOverBalance;

          // Calcular saldo final baseado nas transações
          let monthBalance = carryOverBalance;
          for (const transaction of monthData.transactions) {
            const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
            monthBalance += amount;
          }

          monthData.finalBalance = monthBalance;
          carryOverBalance = monthBalance;
          affectedMonths.push(monthKey);
        }
      }

      return {
        success: true,
        affectedMonths,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        affectedMonths: [],
        errors: [error instanceof Error ? error.message : 'Erro no recálculo']
      };
    }
  }

  /**
   * Valida a integridade dos saldos
   */
  validateIntegrity(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      const sortedMonths = Array.from(this.data.keys()).sort();

      for (let i = 0; i < sortedMonths.length; i++) {
        const monthKey = sortedMonths[i];
        const monthData = this.data.get(monthKey);
        
        if (!monthData) continue;

        // Validar consistência interna do mês
        let calculatedBalance = monthData.initialBalance;
        for (const transaction of monthData.transactions) {
          const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
          calculatedBalance += amount;
        }

        if (Math.abs(calculatedBalance - monthData.finalBalance) > 0.01) {
          errors.push(`Saldo inconsistente em ${monthKey}: calculado ${calculatedBalance.toFixed(2)}, armazenado ${monthData.finalBalance.toFixed(2)}`);
        }

        // Validar continuidade entre meses
        if (i > 0) {
          const previousMonthKey = sortedMonths[i - 1];
          const previousMonthData = this.data.get(previousMonthKey);
          
          if (previousMonthData && Math.abs(previousMonthData.finalBalance - monthData.initialBalance) > 0.01) {
            errors.push(`Descontinuidade entre ${previousMonthKey} e ${monthKey}: final anterior ${previousMonthData.finalBalance.toFixed(2)}, inicial atual ${monthData.initialBalance.toFixed(2)}`);
          }
        }

        // Verificar formatação de valores
        for (const transaction of monthData.transactions) {
          if (isNaN(transaction.amount) || transaction.amount < 0) {
            errors.push(`Valor inválido na transação ${transaction.id}: ${transaction.amount}`);
          }
        }
      }

      // Sugestões de melhoria
      if (errors.length === 0) {
        suggestions.push('Integridade dos dados validada com sucesso');
      } else {
        suggestions.push('Execute recalculateFromDate() para corrigir inconsistências');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Erro na validação'],
        warnings,
        suggestions: ['Verifique a integridade dos dados manualmente']
      };
    }
  }

  /**
   * Corrige inconsistências detectadas
   */
  fixInconsistencies(): BalancePropagationResult {
    const validation = this.validateIntegrity();
    
    if (validation.isValid) {
      return {
        success: true,
        affectedMonths: [],
        errors: []
      };
    }

    // Recalcular tudo desde o primeiro mês
    const sortedMonths = Array.from(this.data.keys()).sort();
    if (sortedMonths.length === 0) {
      return {
        success: true,
        affectedMonths: [],
        errors: []
      };
    }

    const firstMonthKey = sortedMonths[0];
    const [year, month] = firstMonthKey.split('-').map(Number);
    const firstDate = new Date(year, month - 1, 1);

    return this.recalculateFromDate(firstDate);
  }

  /**
   * Obtém a chave do mês no formato YYYY-MM
   */
  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  /**
   * Obtém todos os meses a partir de uma data
   */
  private getMonthsFromDate(startDate: Date): string[] {
    const months: string[] = [];
    const sortedMonths = Array.from(this.data.keys()).sort();
    const startKey = this.getMonthKey(startDate);

    for (const monthKey of sortedMonths) {
      if (monthKey >= startKey) {
        months.push(monthKey);
      }
    }

    return months;
  }

  /**
   * Obtém o mês anterior
   */
  private getPreviousMonth(date: Date): Date | null {
    const previousMonth = new Date(date);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    // Verificar se existe dados para o mês anterior
    const previousKey = this.getMonthKey(previousMonth);
    return this.data.has(previousKey) ? previousMonth : null;
  }

  /**
   * Obtém os dados atualizados
   */
  getData(): Map<string, MonthlyData> {
    return new Map(this.data);
  }

  /**
   * Atualiza os dados internos
   */
  updateData(newData: Map<string, MonthlyData>): void {
    this.data = new Map(newData);
  }

  // =================== MÉTODOS DE CACHE E PERFORMANCE ====================

  /**
   * Invalida cache a partir de uma data
   */
  invalidateCache(fromDate: string): void {
    const monthKey = fromDate.substring(0, 7); // YYYY-MM
    const sortedMonths = Array.from(this.data.keys()).sort();
    
    for (const month of sortedMonths) {
      if (month >= monthKey) {
        this.cache.invalidatedMonths.add(month);
        this.cache.snapshots.delete(month);
      }
    }
    
    console.log(`🗑️ CACHE: Invalidated cache from ${monthKey}, ${this.cache.invalidatedMonths.size} months affected`);
  }

  /**
   * Reconstrói cache completo
   */
  async rebuildCache(): Promise<void> {
    console.log('🔄 CACHE: Rebuilding complete cache');
    
    const startTime = Date.now();
    this.cache.snapshots.clear();
    this.cache.invalidatedMonths.clear();
    
    // Criar snapshots para todos os meses
    for (const [monthKey, monthData] of this.data.entries()) {
      const snapshot: BalanceSnapshot = {
        monthKey,
        initialBalance: monthData.initialBalance,
        finalBalance: monthData.finalBalance,
        transactionCount: monthData.transactionCount,
        lastModified: monthData.lastModified,
        checksum: this.calculateMonthChecksum(monthData)
      };
      
      this.cache.snapshots.set(monthKey, snapshot);
    }
    
    this.cache.lastFullRecalculation = new Date().toISOString();
    
    console.log(`✅ CACHE: Cache rebuilt in ${Date.now() - startTime}ms, ${this.cache.snapshots.size} snapshots created`);
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): CacheStats {
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      totalSnapshots: this.cache.snapshots.size,
      invalidatedMonths: this.cache.invalidatedMonths.size,
      hitRate: this.cache.hitRate,
      lastFullRecalculation: this.cache.lastFullRecalculation,
      memoryUsage
    };
  }

  // ==================== MÉTODOS PRIVADOS DE IMPLEMENTAÇÃO ====================

  private async applyTransactionChange(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    transaction: TransactionEntry,
    oldTransaction?: TransactionEntry
  ): Promise<void> {
    const monthKey = transaction.date.substring(0, 7);
    let monthData = this.data.get(monthKey);
    
    if (!monthData) {
      monthData = this.createEmptyMonthData();
      this.data.set(monthKey, monthData);
    }
    
    const transactionData: Transaction = {
      id: transaction.id,
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.type === 'entrada' ? 'ENTRADA' : 
            transaction.type === 'saida' ? 'SAIDA' : 'DIARIO',
      description: transaction.description
    };
    
    switch (operation) {
      case 'CREATE':
        monthData.transactions.push(transactionData);
        break;
        
      case 'UPDATE':
        const index = monthData.transactions.findIndex(t => t.id === transaction.id);
        if (index >= 0) {
          monthData.transactions[index] = transactionData;
        }
        break;
        
      case 'DELETE':
        monthData.transactions = monthData.transactions.filter(t => t.id !== transaction.id);
        break;
    }
    
    // Atualizar metadados
    monthData.transactionCount = monthData.transactions.length;
    monthData.lastModified = new Date().toISOString();
    monthData.checksum = this.calculateMonthChecksum(monthData);
    monthData.isCalculated = false; // Marcar para recálculo
    
    // Recalcular saldos do mês
    this.recalculateMonthBalances(monthData);
  }

  private async performFullRecalculation(startDate: string): Promise<PropagationResult> {
    console.log(`🔄 FULL RECALC: Starting full recalculation from ${startDate}`);
    
    // Usar o cascade manager para recalcular tudo
    return await this.cascadeManager.propagateFromDate(startDate, 0, {
      startDate,
      batchSize: 12, // Processar 12 meses por vez
      validateIntegrity: true,
      rollbackOnError: true
    });
  }

  private async performAutomaticCorrection(errors: string[]): Promise<{
    success: boolean;
    correctionsMade: number;
  }> {
    console.log(`🔧 AUTO CORRECT: Attempting to fix ${errors.length} errors`);
    
    let correctionsMade = 0;
    
    for (const error of errors) {
      try {
        if (error.includes('Saldo inconsistente')) {
          // Extrair mês do erro e recalcular
          const monthMatch = error.match(/(\d{4}-\d{2})/);
          if (monthMatch) {
            const monthKey = monthMatch[1];
            const monthData = this.data.get(monthKey);
            if (monthData) {
              this.recalculateMonthBalances(monthData);
              correctionsMade++;
            }
          }
        } else if (error.includes('Descontinuidade')) {
          // Recalcular sequência de meses
          const monthMatches = error.match(/(\d{4}-\d{2})/g);
          if (monthMatches && monthMatches.length >= 2) {
            await this.recalculateFromDate(`${monthMatches[0]}-01`);
            correctionsMade++;
          }
        }
      } catch (correctionError) {
        console.error(`❌ AUTO CORRECT: Error fixing "${error}":`, correctionError);
      }
    }
    
    console.log(`✅ AUTO CORRECT: Made ${correctionsMade} corrections`);
    
    return {
      success: correctionsMade > 0,
      correctionsMade
    };
  }

  private async updateCacheAfterPropagation(affectedPeriods: string[]): Promise<void> {
    for (const period of affectedPeriods) {
      const monthData = this.data.get(period);
      if (monthData) {
        const snapshot: BalanceSnapshot = {
          monthKey: period,
          initialBalance: monthData.initialBalance,
          finalBalance: monthData.finalBalance,
          transactionCount: monthData.transactionCount,
          lastModified: monthData.lastModified,
          checksum: monthData.checksum
        };
        
        this.cache.snapshots.set(period, snapshot);
        this.cache.invalidatedMonths.delete(period);
      }
    }
  }

  private createEmptyMonthData(): MonthlyData {
    return {
      initialBalance: 0,
      finalBalance: 0,
      transactions: [],
      transactionCount: 0,
      lastModified: new Date().toISOString(),
      checksum: '',
      isCalculated: false,
      calculationTime: 0,
      propagationHistory: []
    };
  }

  private recalculateMonthBalances(monthData: MonthlyData): void {
    const startTime = Date.now();
    
    let balance = monthData.initialBalance;
    
    for (const transaction of monthData.transactions) {
      const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
      balance += amount;
    }
    
    monthData.finalBalance = balance;
    monthData.isCalculated = true;
    monthData.calculationTime = Date.now() - startTime;
    monthData.checksum = this.calculateMonthChecksum(monthData);
  }

  private calculateMonthChecksum(monthData: MonthlyData): string {
    const data = {
      initialBalance: monthData.initialBalance,
      finalBalance: monthData.finalBalance,
      transactionCount: monthData.transactionCount,
      transactionIds: monthData.transactions.map(t => t.id).sort()
    };
    
    return btoa(JSON.stringify(data)).substring(0, 16);
  }

  private estimateMemoryUsage(): number {
    // Estimativa simples de uso de memória em bytes
    let usage = 0;
    
    for (const [key, data] of this.data.entries()) {
      usage += key.length * 2; // string key
      usage += JSON.stringify(data).length * 2; // data object
    }
    
    for (const [key, snapshot] of this.cache.snapshots.entries()) {
      usage += key.length * 2;
      usage += JSON.stringify(snapshot).length * 2;
    }
    
    return usage;
  }

  // ==================== MÉTODOS PÚBLICOS DE MONITORAMENTO ====================

  /**
   * Obtém estatísticas de performance
   */
  getPerformanceStats(): {
    totalMonths: number;
    cachedMonths: number;
    invalidatedMonths: number;
    cacheHitRate: number;
    memoryUsage: number;
    lastRecalculation: string;
  } {
    return {
      totalMonths: this.data.size,
      cachedMonths: this.cache.snapshots.size,
      invalidatedMonths: this.cache.invalidatedMonths.size,
      cacheHitRate: this.cache.hitRate,
      memoryUsage: this.estimateMemoryUsage(),
      lastRecalculation: this.cache.lastFullRecalculation
    };
  }

  /**
   * Força limpeza de cache
   */
  clearCache(): void {
    this.cache.snapshots.clear();
    this.cache.invalidatedMonths.clear();
    this.cache.hitRate = 0;
    this.cache.totalRequests = 0;
    this.cache.cacheHits = 0;
    
    console.log('🗑️ CACHE: Cache cleared completely');
  }

  /**
   * Obtém dados atualizados (método legado mantido para compatibilidade)
   */
  getData(): Map<string, MonthlyData> {
    return new Map(this.data);
  }

  /**
   * Atualiza dados internos (método legado mantido para compatibilidade)
   */
  updateData(newData: Map<string, MonthlyData>): void {
    this.data = new Map(newData);
    this.invalidateCache('1900-01'); // Invalidar todo o cache
  }
}