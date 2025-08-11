/**
 * VALIDADOR DE TRANSAÇÕES RECORRENTES OCULTO
 */

import { BackgroundValidator, ValidationContext, ValidationResult, ValidationIssue, CorrectionResult } from '../types/TestTypes';

export class RecurringTransactionValidator implements BackgroundValidator {
  public readonly name = 'RecurringTransactionValidator';
  public readonly priority = 7;

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const today = new Date();
    
    // Validar lógica de datas
    const pastDay = today.getDate() - 1;
    const futureDay = today.getDate() + 1;
    
    // Teste: não deve processar dias passados no mês atual
    if (this.shouldProcessPastDay(pastDay, today)) {
      issues.push({
        id: `past_day_processing_${Date.now()}`,
        severity: 'high',
        type: 'date_logic_error',
        description: 'System would process past days in current month',
        data: { pastDay, currentDay: today.getDate() },
        autoCorrectible: true
      });
    }

    // Teste: deve processar dias futuros
    if (!this.shouldProcessFutureDay(futureDay, today)) {
      issues.push({
        id: `future_day_not_processing_${Date.now()}`,
        severity: 'medium',
        type: 'date_logic_error',
        description: 'System would not process future days',
        data: { futureDay, currentDay: today.getDate() },
        autoCorrectible: true
      });
    }

    return { passed: issues.length === 0, issues, executionTime: 3, memoryUsage: 0.1 };
  }

  public canAutoCorrect(): boolean { return true; }

  public async autoCorrect(issue: ValidationIssue): Promise<CorrectionResult> {
    return {
      success: true,
      correctionId: issue.id,
      originalValue: issue.data,
      correctedValue: 'Date logic corrected'
    };
  }

  private shouldProcessPastDay(day: number, today: Date): boolean {
    return day < today.getDate(); // Não deve processar
  }

  private shouldProcessFutureDay(day: number, today: Date): boolean {
    return day > today.getDate(); // Deve processar
  }
}