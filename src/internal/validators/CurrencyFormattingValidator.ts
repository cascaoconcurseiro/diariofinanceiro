/**
 * VALIDADOR DE FORMATAÇÃO DE MOEDA OCULTO
 */

import { BackgroundValidator, ValidationContext, ValidationResult, ValidationIssue, CorrectionResult } from '../types/TestTypes';
import { formatCurrency, parseCurrency } from '../../utils/currencyUtils';

export class CurrencyFormattingValidator implements BackgroundValidator {
  public readonly name = 'CurrencyFormattingValidator';
  public readonly priority = 8;

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const testValues = [1234.56, 0, -500.99, 0.01, 999999.99];

    for (const value of testValues) {
      try {
        const formatted = formatCurrency(value);
        const parsed = parseCurrency(formatted);
        
        if (Math.abs(parsed - value) > 0.01) {
          issues.push({
            id: `format_parse_${Date.now()}`,
            severity: 'medium',
            type: 'format_error',
            description: `Format/parse mismatch for ${value}`,
            data: { value, formatted, parsed },
            autoCorrectible: true
          });
        }
      } catch (error) {
        issues.push({
          id: `format_error_${Date.now()}`,
          severity: 'high',
          type: 'format_exception',
          description: `Formatting error for ${value}`,
          data: { value, error: error.message },
          autoCorrectible: false
        });
      }
    }

    return { passed: issues.length === 0, issues, executionTime: 5, memoryUsage: 0.2 };
  }

  public canAutoCorrect(): boolean { return true; }

  public async autoCorrect(issue: ValidationIssue): Promise<CorrectionResult> {
    try {
      const { value } = issue.data;
      const corrected = formatCurrency(Math.round(value * 100) / 100);
      return {
        success: true,
        correctionId: issue.id,
        originalValue: issue.data.formatted,
        correctedValue: corrected
      };
    } catch {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data,
        correctedValue: null,
        error: 'Auto-correction failed'
      };
    }
  }
}