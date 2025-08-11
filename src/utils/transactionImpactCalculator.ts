export interface TransactionImpact {
  transactionId: string;
  oldValue: number;
  newValue: number;
  difference: number;
  affectedPeriods: string[];
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  transactionDate: string;
  priority: number;
}

export interface ImpactCalculationResult {
  impacts: TransactionImpact[];
  totalAffectedMonths: number;
  estimatedProcessingTime: number;
  requiresFullRecalculation: boolean;
}

export interface TransactionOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  transaction: any;
  oldTransaction?: any;
}

export class TransactionImpactCalculator {
  calculateImpact(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    transaction: any,
    oldTransaction?: any
  ): TransactionImpact {
    console.log(`🧮 IMPACT: Calculating impact for ${operation} operation`);

    let oldValue = 0;
    let newValue = 0;
    let transactionDate = transaction.date;

    switch (operation) {
      case 'CREATE':
        oldValue = 0;
        newValue = this.getTransactionImpactValue(transaction);
        break;
        
      case 'UPDATE':
        if (!oldTransaction) {
          throw new Error('oldTransaction é obrigatório para operação UPDATE');
        }
        oldValue = this.getTransactionImpactValue(oldTransaction);
        newValue = this.getTransactionImpactValue(transaction);
        transactionDate = oldTransaction.date < transaction.date ? oldTransaction.date : transaction.date;
        break;
        
      case 'DELETE':
        oldValue = this.getTransactionImpactValue(transaction);
        newValue = 0;
        break;
    }

    const difference = newValue - oldValue;
    const affectedPeriods = this.calculateAffectedPeriods(transactionDate);
    const priority = this.calculatePriority(difference, affectedPeriods.length);

    return {
      transactionId: transaction.id,
      oldValue,
      newValue,
      difference,
      affectedPeriods,
      operationType: operation,
      transactionDate,
      priority
    };
  }

  calculateBatchImpact(operations: TransactionOperation[]): ImpactCalculationResult {
    console.log(`🧮 BATCH IMPACT: Calculating batch impact for ${operations.length} operations`);

    const impacts: TransactionImpact[] = [];
    const affectedMonthsSet = new Set<string>();
    let requiresFullRecalculation = false;

    for (const operation of operations) {
      try {
        const impact = this.calculateImpact(
          operation.type,
          operation.transaction,
          operation.oldTransaction
        );
        
        impacts.push(impact);
        impact.affectedPeriods.forEach(period => affectedMonthsSet.add(period));
        
        if (Math.abs(impact.difference) > 10000 || impact.affectedPeriods.length > 24) {
          requiresFullRecalculation = true;
        }
      } catch (error) {
        console.error(`❌ BATCH IMPACT: Error calculating impact:`, error);
      }
    }

    const optimizedImpacts = this.optimizeImpactOrder(impacts);
    const totalAffectedMonths = affectedMonthsSet.size;
    const estimatedProcessingTime = this.estimateProcessingTime(totalAffectedMonths, impacts.length);

    return {
      impacts: optimizedImpacts,
      totalAffectedMonths,
      estimatedProcessingTime,
      requiresFullRecalculation
    };
  }

  optimizeImpactOrder(impacts: TransactionImpact[]): TransactionImpact[] {
    return impacts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      if (a.transactionDate !== b.transactionDate) {
        return a.transactionDate.localeCompare(b.transactionDate);
      }
      
      return Math.abs(b.difference) - Math.abs(a.difference);
    });
  }

  private getTransactionImpactValue(transaction: any): number {
    switch (transaction.type) {
      case 'entrada':
        return transaction.amount;
      case 'saida':
      case 'diario':
        return -transaction.amount;
      default:
        return 0;
    }
  }

  private calculateAffectedPeriods(startDate: string): string[] {
    const periods: string[] = [];
    const start = new Date(startDate);
    const currentDate = new Date();
    const endDate = new Date(currentDate.getFullYear() + 2, 11, 31);
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= endDate) {
      const monthKey = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`;
      periods.push(monthKey);
      current.setMonth(current.getMonth() + 1);
    }

    return periods;
  }

  private calculatePriority(difference: number, affectedPeriodsCount: number): number {
    const magnitude = Math.abs(difference);
    
    if (magnitude > 1000 || affectedPeriodsCount > 12) {
      return 1;
    }
    
    if (magnitude > 100 || affectedPeriodsCount > 6) {
      return 2;
    }
    
    return 3;
  }

  private estimateProcessingTime(affectedMonths: number, operationsCount: number): number {
    const baseTime = (affectedMonths * 10) + (operationsCount * 5);
    const complexityFactor = operationsCount > 10 ? 1.5 : 1.0;
    return Math.round(baseTime * complexityFactor);
  }
}

export const transactionImpactCalculator = new TransactionImpactCalculator();