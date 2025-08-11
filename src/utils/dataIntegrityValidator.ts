import { Transaction, MonthlyData } from '../types/financial';

export interface ValidationError {
  type: 'BALANCE_MISMATCH' | 'CONTINUITY_BREAK' | 'INVALID_TRANSACTION' | 'RECURRING_ERROR' | 'FORMAT_ERROR';
  message: string;
  monthKey?: string;
  transactionId?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ValidationWarning {
  type: 'PERFORMANCE' | 'DATA_QUALITY' | 'SUGGESTION';
  message: string;
  monthKey?: string;
}

export interface IntegrityReport {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  summary: {
    totalMonths: number;
    validMonths: number;
    totalTransactions: number;
    invalidTransactions: number;
    balanceDiscrepancies: number;
  };
}

export class DataIntegrityValidator {
  private data: Map<string, MonthlyData>;

  constructor(data: Map<string, MonthlyData>) {
    this.data = data;
  }

  /**
   * Valida saldos mensais
   */
  validateMonthlyBalances(): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [monthKey, monthData] of this.data.entries()) {
      // Calcular saldo baseado nas transações
      let calculatedBalance = monthData.initialBalance;
      
      for (const transaction of monthData.transactions) {
        if (!this.isValidTransaction(transaction)) {
          errors.push({
            type: 'INVALID_TRANSACTION',
            message: `Transação inválida: ${transaction.description}`,
            monthKey,
            transactionId: transaction.id,
            severity: 'HIGH'
          });
          continue;
        }

        const amount = transaction.type === 'ENTRADA' ? transaction.amount : -transaction.amount;
        calculatedBalance += amount;
      }

      // Verificar se o saldo calculado bate com o armazenado
      const difference = Math.abs(calculatedBalance - monthData.finalBalance);
      if (difference > 0.01) {
        errors.push({
          type: 'BALANCE_MISMATCH',
          message: `Saldo inconsistente: calculado R$ ${calculatedBalance.toFixed(2)}, armazenado R$ ${monthData.finalBalance.toFixed(2)}`,
          monthKey,
          severity: 'CRITICAL'
        });
      }
    }

    return errors;
  }

  /**
   * Valida progressão entre anos
   */
  validateYearlyProgression(): ValidationError[] {
    const errors: ValidationError[] = [];
    const sortedMonths = Array.from(this.data.keys()).sort();

    for (let i = 1; i < sortedMonths.length; i++) {
      const currentMonthKey = sortedMonths[i];
      const previousMonthKey = sortedMonths[i - 1];
      
      const currentMonth = this.data.get(currentMonthKey);
      const previousMonth = this.data.get(previousMonthKey);

      if (!currentMonth || !previousMonth) continue;

      // Verificar continuidade entre meses
      const difference = Math.abs(previousMonth.finalBalance - currentMonth.initialBalance);
      if (difference > 0.01) {
        errors.push({
          type: 'CONTINUITY_BREAK',
          message: `Quebra de continuidade entre ${previousMonthKey} (final: R$ ${previousMonth.finalBalance.toFixed(2)}) e ${currentMonthKey} (inicial: R$ ${currentMonth.initialBalance.toFixed(2)})`,
          monthKey: currentMonthKey,
          severity: 'CRITICAL'
        });
      }

      // Verificar mudança de ano
      const [prevYear] = previousMonthKey.split('-').map(Number);
      const [currYear] = currentMonthKey.split('-').map(Number);
      
      if (currYear > prevYear) {
        // Validar que o primeiro mês do novo ano tem o saldo correto
        const expectedInitialBalance = previousMonth.finalBalance;
        if (Math.abs(currentMonth.initialBalance - expectedInitialBalance) > 0.01) {
          errors.push({
            type: 'CONTINUITY_BREAK',
            message: `Saldo inicial do ano ${currYear} incorreto: esperado R$ ${expectedInitialBalance.toFixed(2)}, encontrado R$ ${currentMonth.initialBalance.toFixed(2)}`,
            monthKey: currentMonthKey,
            severity: 'CRITICAL'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Valida transações recorrentes
   */
  validateRecurringTransactions(): ValidationError[] {
    const errors: ValidationError[] = [];
    const recurringGroups = new Map<string, Transaction[]>();

    // Agrupar transações recorrentes
    for (const [monthKey, monthData] of this.data.entries()) {
      for (const transaction of monthData.transactions) {
        if (transaction.isRecurring && transaction.recurringId) {
          if (!recurringGroups.has(transaction.recurringId)) {
            recurringGroups.set(transaction.recurringId, []);
          }
          recurringGroups.get(transaction.recurringId)!.push(transaction);
        }
      }
    }

    // Validar cada grupo de recorrência
    for (const [recurringId, transactions] of recurringGroups.entries()) {
      if (transactions.length < 2) {
        errors.push({
          type: 'RECURRING_ERROR',
          message: `Transação recorrente ${recurringId} tem apenas uma ocorrência`,
          severity: 'MEDIUM'
        });
        continue;
      }

      // Verificar consistência entre transações recorrentes
      const firstTransaction = transactions[0];
      for (let i = 1; i < transactions.length; i++) {
        const transaction = transactions[i];
        
        if (transaction.amount !== firstTransaction.amount) {
          errors.push({
            type: 'RECURRING_ERROR',
            message: `Valor inconsistente na recorrência ${recurringId}: R$ ${transaction.amount.toFixed(2)} vs R$ ${firstTransaction.amount.toFixed(2)}`,
            transactionId: transaction.id,
            severity: 'MEDIUM'
          });
        }

        if (transaction.type !== firstTransaction.type) {
          errors.push({
            type: 'RECURRING_ERROR',
            message: `Tipo inconsistente na recorrência ${recurringId}: ${transaction.type} vs ${firstTransaction.type}`,
            transactionId: transaction.id,
            severity: 'HIGH'
          });
        }
      }

      // Verificar sequência temporal
      const sortedTransactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (let i = 1; i < sortedTransactions.length; i++) {
        const current = new Date(sortedTransactions[i].date);
        const previous = new Date(sortedTransactions[i - 1].date);
        
        const monthsDiff = (current.getFullYear() - previous.getFullYear()) * 12 + (current.getMonth() - previous.getMonth());
        
        if (monthsDiff !== 1) {
          errors.push({
            type: 'RECURRING_ERROR',
            message: `Intervalo incorreto na recorrência ${recurringId}: ${monthsDiff} meses entre transações`,
            transactionId: sortedTransactions[i].id,
            severity: 'MEDIUM'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Gera relatório completo de integridade
   */
  generateIntegrityReport(): IntegrityReport {
    const balanceErrors = this.validateMonthlyBalances();
    const yearlyErrors = this.validateYearlyProgression();
    const recurringErrors = this.validateRecurringTransactions();
    
    const allErrors = [...balanceErrors, ...yearlyErrors, ...recurringErrors];
    const warnings = this.generateWarnings();
    const suggestions = this.generateSuggestions(allErrors);

    // Calcular estatísticas
    const totalMonths = this.data.size;
    const totalTransactions = Array.from(this.data.values()).reduce((sum, month) => sum + month.transactions.length, 0);
    const invalidTransactions = allErrors.filter(e => e.type === 'INVALID_TRANSACTION').length;
    const balanceDiscrepancies = allErrors.filter(e => e.type === 'BALANCE_MISMATCH').length;
    const validMonths = totalMonths - new Set(allErrors.map(e => e.monthKey).filter(Boolean)).size;

    // Calcular score (0-100)
    const criticalErrors = allErrors.filter(e => e.severity === 'CRITICAL').length;
    const highErrors = allErrors.filter(e => e.severity === 'HIGH').length;
    const mediumErrors = allErrors.filter(e => e.severity === 'MEDIUM').length;
    
    let score = 100;
    score -= criticalErrors * 20;
    score -= highErrors * 10;
    score -= mediumErrors * 5;
    score = Math.max(0, score);

    return {
      isValid: allErrors.length === 0,
      score,
      errors: allErrors,
      warnings,
      suggestions,
      summary: {
        totalMonths,
        validMonths,
        totalTransactions,
        invalidTransactions,
        balanceDiscrepancies
      }
    };
  }

  /**
   * Verifica se uma transação é válida
   */
  private isValidTransaction(transaction: Transaction): boolean {
    // Verificar campos obrigatórios
    if (!transaction.id || !transaction.description || !transaction.date) {
      return false;
    }

    // Verificar valor
    if (isNaN(transaction.amount) || transaction.amount <= 0) {
      return false;
    }

    // Verificar tipo
    if (transaction.type !== 'ENTRADA' && transaction.type !== 'SAIDA') {
      return false;
    }

    // Verificar data
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
      return false;
    }

    return true;
  }

  /**
   * Gera avisos baseados na análise dos dados
   */
  private generateWarnings(): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Verificar performance
    const totalTransactions = Array.from(this.data.values()).reduce((sum, month) => sum + month.transactions.length, 0);
    if (totalTransactions > 1000) {
      warnings.push({
        type: 'PERFORMANCE',
        message: `Grande volume de transações (${totalTransactions}). Considere arquivar dados antigos.`
      });
    }

    // Verificar qualidade dos dados
    for (const [monthKey, monthData] of this.data.entries()) {
      if (monthData.transactions.length === 0) {
        warnings.push({
          type: 'DATA_QUALITY',
          message: 'Mês sem transações',
          monthKey
        });
      }

      // Verificar transações com descrições genéricas
      const genericDescriptions = monthData.transactions.filter(t => 
        t.description.length < 5 || 
        ['teste', 'test', 'abc', '123'].includes(t.description.toLowerCase())
      );

      if (genericDescriptions.length > 0) {
        warnings.push({
          type: 'DATA_QUALITY',
          message: `${genericDescriptions.length} transações com descrições genéricas`,
          monthKey
        });
      }
    }

    return warnings;
  }

  /**
   * Gera sugestões baseadas nos erros encontrados
   */
  private generateSuggestions(errors: ValidationError[]): string[] {
    const suggestions: string[] = [];

    if (errors.length === 0) {
      suggestions.push('✅ Dados íntegros! Sistema funcionando corretamente.');
      return suggestions;
    }

    const errorTypes = new Set(errors.map(e => e.type));

    if (errorTypes.has('BALANCE_MISMATCH')) {
      suggestions.push('🔧 Execute recálculo de saldos para corrigir inconsistências');
    }

    if (errorTypes.has('CONTINUITY_BREAK')) {
      suggestions.push('🔗 Verifique a propagação de saldos entre meses');
    }

    if (errorTypes.has('INVALID_TRANSACTION')) {
      suggestions.push('🧹 Remova ou corrija transações inválidas');
    }

    if (errorTypes.has('RECURRING_ERROR')) {
      suggestions.push('🔄 Revise configuração de transações recorrentes');
    }

    if (errorTypes.has('FORMAT_ERROR')) {
      suggestions.push('💱 Corrija formatação de valores monetários');
    }

    const criticalCount = errors.filter(e => e.severity === 'CRITICAL').length;
    if (criticalCount > 0) {
      suggestions.push(`⚠️ ${criticalCount} erros críticos encontrados - correção urgente necessária`);
    }

    return suggestions;
  }

  /**
   * Atualiza os dados para validação
   */
  updateData(newData: Map<string, MonthlyData>): void {
    this.data = newData;
  }
}