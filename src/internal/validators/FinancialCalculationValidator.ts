/**
 * VALIDADOR DE CÁLCULOS FINANCEIROS OCULTO
 * Valida precisão e correção dos cálculos financeiros em background
 */

import { 
  BackgroundValidator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue, 
  CorrectionResult 
} from '../types/TestTypes';
import { calculateBalance, formatCurrency, parseCurrency } from '../../utils/currencyUtils';
import { validateAmount, sanitizeAmount } from '../../utils/securityUtils';
import { internalLog } from '../config/HiddenTestConfig';

export class FinancialCalculationValidator implements BackgroundValidator {
  public readonly name = 'FinancialCalculationValidator';
  public readonly priority = 10; // Alta prioridade

  // Validar cálculos financeiros
  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const startTime = performance.now();
    const issues: ValidationIssue[] = [];

    try {
      // Teste 1: Validar cálculo básico de saldo
      await this.validateBasicBalanceCalculation(issues);
      
      // Teste 2: Validar precisão decimal
      await this.validateDecimalPrecision(issues);
      
      // Teste 3: Validar operações com valores extremos
      await this.validateExtremeValues(issues);
      
      // Teste 4: Validar consistência de round-trip
      await this.validateRoundTripConsistency(issues);
      
      // Teste 5: Validar proteção contra overflow
      await this.validateOverflowProtection(issues);

    } catch (error) {
      issues.push({
        id: 'validation_error',
        severity: 'critical',
        type: 'calculation_validation',
        description: 'Error during financial calculation validation',
        data: { error: error.message },
        autoCorrectible: false
      });
    }

    const executionTime = performance.now() - startTime;
    const memoryUsage = this.estimateMemoryUsage();

    return {
      passed: issues.length === 0,
      issues,
      executionTime,
      memoryUsage
    };
  }

  // Verificar se pode auto-corrigir
  public canAutoCorrect(): boolean {
    return true; // Este validador pode tentar algumas correções
  }

  // Tentar auto-correção
  public async autoCorrect(issue: ValidationIssue): Promise<CorrectionResult> {
    try {
      switch (issue.type) {
        case 'decimal_precision':
          return await this.correctDecimalPrecision(issue);
        
        case 'rounding_error':
          return await this.correctRoundingError(issue);
        
        case 'format_inconsistency':
          return await this.correctFormatInconsistency(issue);
        
        default:
          return {
            success: false,
            correctionId: issue.id,
            originalValue: issue.data,
            correctedValue: null,
            error: 'No auto-correction available for this issue type'
          };
      }
    } catch (error) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data,
        correctedValue: null,
        error: error.message
      };
    }
  }

  // Validar cálculo básico de saldo
  private async validateBasicBalanceCalculation(issues: ValidationIssue[]): Promise<void> {
    const testCases = [
      { previous: 100, entrada: 50, saida: 20, diario: 10, expected: 120 },
      { previous: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000 },
      { previous: 500, entrada: 0, saida: 600, diario: 0, expected: -100 },
      { previous: 1000.50, entrada: 250.25, saida: 100.75, diario: 50.00, expected: 1100.00 }
    ];

    for (const testCase of testCases) {
      const result = calculateBalance(
        testCase.previous, 
        testCase.entrada, 
        testCase.saida, 
        testCase.diario
      );

      const difference = Math.abs(result - testCase.expected);
      
      if (difference > 0.01) { // Tolerância de 1 centavo
        issues.push({
          id: `balance_calculation_${Date.now()}`,
          severity: 'high',
          type: 'calculation_error',
          description: `Balance calculation incorrect: expected ${testCase.expected}, got ${result}`,
          data: { testCase, result, difference },
          autoCorrectible: false // Erro de lógica não é auto-corrigível
        });
      }
    }
  }

  // Validar precisão decimal
  private async validateDecimalPrecision(issues: ValidationIssue[]): Promise<void> {
    const precisionTests = [
      { a: 0.1, b: 0.2, expected: 0.3 },
      { a: 1.1, b: 2.2, expected: 3.3 },
      { a: 10.01, b: 20.02, expected: 30.03 }
    ];

    for (const test of precisionTests) {
      // Testar usando nossa função de cálculo
      const result = calculateBalance(0, test.a + test.b, 0, 0);
      const difference = Math.abs(result - test.expected);

      if (difference > 0.001) { // Tolerância muito pequena para precisão
        issues.push({
          id: `decimal_precision_${Date.now()}`,
          severity: 'medium',
          type: 'decimal_precision',
          description: `Decimal precision issue: ${test.a} + ${test.b} = ${result}, expected ${test.expected}`,
          data: { test, result, difference },
          autoCorrectible: true
        });
      }
    }
  }

  // Validar valores extremos
  private async validateExtremeValues(issues: ValidationIssue[]): Promise<void> {
    const extremeTests = [
      { value: 999999999.99, description: 'Very large positive value' },
      { value: -999999999.99, description: 'Very large negative value' },
      { value: 0.01, description: 'Very small positive value' },
      { value: -0.01, description: 'Very small negative value' },
      { value: 0, description: 'Zero value' }
    ];

    for (const test of extremeTests) {
      try {
        const validated = validateAmount(test.value);
        const formatted = formatCurrency(validated);
        const parsed = parseCurrency(formatted);

        // Verificar se o valor se mantém após round-trip
        const difference = Math.abs(parsed - test.value);
        
        if (difference > 0.01) {
          issues.push({
            id: `extreme_value_${Date.now()}`,
            severity: 'medium',
            type: 'extreme_value_handling',
            description: `Extreme value handling issue: ${test.description}`,
            data: { original: test.value, validated, formatted, parsed, difference },
            autoCorrectible: true
          });
        }

      } catch (error) {
        issues.push({
          id: `extreme_value_error_${Date.now()}`,
          severity: 'high',
          type: 'extreme_value_error',
          description: `Error handling extreme value: ${test.description}`,
          data: { value: test.value, error: error.message },
          autoCorrectible: false
        });
      }
    }
  }

  // Validar consistência de round-trip (format -> parse -> format)
  private async validateRoundTripConsistency(issues: ValidationIssue[]): Promise<void> {
    const values = [1234.56, 0.99, 1000000.00, 0.01, 999.99];

    for (const value of values) {
      try {
        const formatted1 = formatCurrency(value);
        const parsed = parseCurrency(formatted1);
        const formatted2 = formatCurrency(parsed);

        if (formatted1 !== formatted2) {
          issues.push({
            id: `roundtrip_inconsistency_${Date.now()}`,
            severity: 'medium',
            type: 'format_inconsistency',
            description: `Round-trip inconsistency for value ${value}`,
            data: { original: value, formatted1, parsed, formatted2 },
            autoCorrectible: true
          });
        }

        // Verificar se o valor numérico se mantém
        const difference = Math.abs(parsed - value);
        if (difference > 0.01) {
          issues.push({
            id: `roundtrip_precision_${Date.now()}`,
            severity: 'high',
            type: 'rounding_error',
            description: `Round-trip precision loss for value ${value}`,
            data: { original: value, parsed, difference },
            autoCorrectible: true
          });
        }

      } catch (error) {
        issues.push({
          id: `roundtrip_error_${Date.now()}`,
          severity: 'high',
          type: 'roundtrip_error',
          description: `Error in round-trip test for value ${value}`,
          data: { value, error: error.message },
          autoCorrectible: false
        });
      }
    }
  }

  // Validar proteção contra overflow
  private async validateOverflowProtection(issues: ValidationIssue[]): Promise<void> {
    const overflowTests = [
      { value: Infinity, description: 'Positive infinity' },
      { value: -Infinity, description: 'Negative infinity' },
      { value: NaN, description: 'Not a Number' },
      { value: Number.MAX_SAFE_INTEGER, description: 'Maximum safe integer' },
      { value: Number.MIN_SAFE_INTEGER, description: 'Minimum safe integer' }
    ];

    for (const test of overflowTests) {
      try {
        const sanitized = sanitizeAmount(test.value);
        
        // Valores problemáticos devem ser sanitizados para 0 ou um valor seguro
        if (!Number.isFinite(sanitized)) {
          issues.push({
            id: `overflow_protection_${Date.now()}`,
            severity: 'high',
            type: 'overflow_protection',
            description: `Overflow protection failed for ${test.description}`,
            data: { original: test.value, sanitized },
            autoCorrectible: true
          });
        }

      } catch (error) {
        issues.push({
          id: `overflow_error_${Date.now()}`,
          severity: 'critical',
          type: 'overflow_error',
          description: `Error in overflow protection for ${test.description}`,
          data: { value: test.value, error: error.message },
          autoCorrectible: false
        });
      }
    }
  }

  // Correção de precisão decimal
  private async correctDecimalPrecision(issue: ValidationIssue): Promise<CorrectionResult> {
    try {
      const { test, result } = issue.data;
      
      // Tentar recalcular usando aritmética de centavos
      const correctedResult = Math.round((test.a + test.b) * 100) / 100;
      
      return {
        success: Math.abs(correctedResult - test.expected) <= 0.001,
        correctionId: issue.id,
        originalValue: result,
        correctedValue: correctedResult,
        rollbackData: { originalResult: result }
      };
    } catch (error) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data.result,
        correctedValue: null,
        error: error.message
      };
    }
  }

  // Correção de erro de arredondamento
  private async correctRoundingError(issue: ValidationIssue): Promise<CorrectionResult> {
    try {
      const { original, parsed } = issue.data;
      
      // Tentar corrigir usando arredondamento adequado
      const corrected = Math.round(parsed * 100) / 100;
      
      return {
        success: Math.abs(corrected - original) <= 0.01,
        correctionId: issue.id,
        originalValue: parsed,
        correctedValue: corrected,
        rollbackData: { originalParsed: parsed }
      };
    } catch (error) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data.parsed,
        correctedValue: null,
        error: error.message
      };
    }
  }

  // Correção de inconsistência de formato
  private async correctFormatInconsistency(issue: ValidationIssue): Promise<CorrectionResult> {
    try {
      const { original, formatted1, formatted2 } = issue.data;
      
      // Tentar reformatar usando a função padrão
      const correctedFormat = formatCurrency(original);
      
      return {
        success: true,
        correctionId: issue.id,
        originalValue: { formatted1, formatted2 },
        correctedValue: correctedFormat,
        rollbackData: { originalFormats: { formatted1, formatted2 } }
      };
    } catch (error) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data,
        correctedValue: null,
        error: error.message
      };
    }
  }

  // Estimar uso de memória
  private estimateMemoryUsage(): number {
    // Estimativa simples baseada no número de testes
    return 0.5; // MB
  }
}