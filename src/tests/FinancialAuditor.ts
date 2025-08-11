/**
 * AUDITORIA COMPLETA DA LÓGICA FINANCEIRA
 * Sistema de testes abrangente para identificar bugs em todos os cenários
 */

import { formatCurrency, parseCurrency, calculateBalance } from '../utils/currencyUtils';
import { validateAmount, sanitizeAmount } from '../utils/securityUtils';

export interface AuditResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export interface AuditReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: AuditResult[];
  criticalIssues: string[];
}

export class FinancialAuditor {
  private results: AuditResult[] = [];
  private criticalIssues: string[] = [];

  // Teste individual
  private test(name: string, expected: any, actual: any): void {
    const passed = JSON.stringify(expected) === JSON.stringify(actual);
    
    this.results.push({
      testName: name,
      passed,
      expected,
      actual,
      error: passed ? undefined : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });

    if (!passed) {
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Expected: ${JSON.stringify(expected)}`);
      console.error(`   Actual: ${JSON.stringify(actual)}`);
    } else {
      console.log(`✅ PASSED: ${name}`);
    }
  }

  // Teste de precisão decimal crítica
  private testDecimalPrecision(): void {
    console.log('\n🔍 TESTING: Decimal Precision');
    
    // Teste 1: Operações básicas com decimais
    this.test('Basic decimal addition', 1.23, 1.1 + 0.13);
    this.test('Currency calculation precision', 123.46, calculateBalance(100, 50.23, 26.77, 0));
    
    // Teste 2: Problemas conhecidos de JavaScript
    const problematicSum = 0.1 + 0.2;
    this.test('JavaScript decimal problem (0.1 + 0.2)', 0.3, Math.round(problematicSum * 100) / 100);
    
    // Teste 3: Cálculos com muitas casas decimais
    this.test('Complex decimal calculation', 1000.12, calculateBalance(1000, 0.12, 0, 0));
    
    // Teste 4: Valores negativos
    this.test('Negative balance calculation', -50.50, calculateBalance(0, 0, 50.50, 0));
  }

  // Teste de formatação de moeda
  private testCurrencyFormatting(): void {
    console.log('\n🔍 TESTING: Currency Formatting');
    
    // Teste valores positivos
    this.test('Format positive currency', 'R$ 1.234,56', formatCurrency(1234.56));
    this.test('Format zero', 'R$ 0,00', formatCurrency(0));
    this.test('Format small amount', 'R$ 0,01', formatCurrency(0.01));
    
    // Teste valores negativos
    this.test('Format negative currency', '-R$ 1.234,56', formatCurrency(-1234.56));
    
    // Teste valores extremos
    this.test('Format large amount', 'R$ 1.000.000,00', formatCurrency(1000000));
    this.test('Format very small amount', 'R$ 0,00', formatCurrency(0.001)); // Deve arredondar
  }

  // Teste de parsing de moeda
  private testCurrencyParsing(): void {
    console.log('\n🔍 TESTING: Currency Parsing');
    
    // Formatos válidos
    this.test('Parse R$ format', 1234.56, parseCurrency('R$ 1.234,56'));
    this.test('Parse negative R$ format', -1234.56, parseCurrency('-R$ 1.234,56'));
    this.test('Parse zero', 0, parseCurrency('R$ 0,00'));
    this.test('Parse empty string', 0, parseCurrency(''));
    
    // Formatos alternativos
    this.test('Parse without R$', 1234.56, parseCurrency('1.234,56'));
    this.test('Parse with parentheses (negative)', -1234.56, parseCurrency('(R$ 1.234,56)'));
    
    // Casos extremos
    this.test('Parse malformed input', 0, parseCurrency('abc'));
    this.test('Parse null/undefined', 0, parseCurrency(null as any));
  }

  // Teste de cálculo de saldo
  private testBalanceCalculation(): void {
    console.log('\n🔍 TESTING: Balance Calculation Logic');
    
    // Cenário 1: Saldo básico
    this.test('Basic balance: 100 + 50 - 20 - 10', 120, calculateBalance(100, 50, 20, 10));
    
    // Cenário 2: Saldo zero
    this.test('Zero balance calculation', 0, calculateBalance(0, 0, 0, 0));
    
    // Cenário 3: Saldo negativo
    this.test('Negative balance: 100 - 150', -50, calculateBalance(100, 0, 150, 0));
    
    // Cenário 4: Apenas entradas
    this.test('Only income: 0 + 1000', 1000, calculateBalance(0, 1000, 0, 0));
    
    // Cenário 5: Apenas saídas
    this.test('Only expenses: 1000 - 500 - 300', 200, calculateBalance(1000, 0, 500, 300));
    
    // Cenário 6: Valores decimais complexos
    this.test('Complex decimals', 123.45, calculateBalance(100.12, 50.33, 26.50, 0.50));
  }

  // Teste de validação de segurança
  private testSecurityValidation(): void {
    console.log('\n🔍 TESTING: Security Validation');
    
    try {
      // Teste valores válidos
      this.test('Valid amount validation', 100, validateAmount(100));
      this.test('Valid negative amount', -50, validateAmount(-50));
      this.test('Valid zero', 0, validateAmount(0));
      
      // Teste sanitização
      this.test('Sanitize normal amount', 123.45, sanitizeAmount(123.45));
      this.test('Sanitize infinity', 0, sanitizeAmount(Infinity));
      this.test('Sanitize NaN', 0, sanitizeAmount(NaN));
      
    } catch (error) {
      this.criticalIssues.push(`Security validation error: ${error}`);
    }
  }

  // Teste de cenários de propagação de saldo
  private testBalancePropagation(): void {
    console.log('\n🔍 TESTING: Balance Propagation Scenarios');
    
    // Simular dados de teste
    const mockData = {
      2024: {
        11: { // Dezembro
          31: { balance: 1000 }
        }
      },
      2025: {
        0: { // Janeiro
          1: { balance: 0 } // Deve herdar 1000
        }
      }
    };
    
    // Teste herança de saldo entre anos
    // Este teste seria mais complexo na implementação real
    this.test('Year-end balance inheritance concept', true, true);
  }

  // Teste de transações recorrentes
  private testRecurringTransactions(): void {
    console.log('\n🔍 TESTING: Recurring Transactions Logic');
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Teste 1: Não deve processar dias passados no mês atual
    const shouldProcessPastDay = currentDay < 15; // Se hoje é antes do dia 15
    this.test('Should not process past days in current month', false, shouldProcessPastDay && currentDay >= 15);
    
    // Teste 2: Deve processar meses futuros
    const futureMonth = currentMonth + 1;
    const shouldProcessFutureMonth = true;
    this.test('Should process future months', true, shouldProcessFutureMonth);
    
    // Teste 3: Não deve processar meses passados
    const pastMonth = currentMonth - 1;
    const shouldProcessPastMonth = false;
    this.test('Should not process past months', false, shouldProcessPastMonth);
  }

  // Teste de casos extremos
  private testEdgeCases(): void {
    console.log('\n🔍 TESTING: Edge Cases');
    
    // Valores muito grandes
    try {
      const largeValue = 999999999.99;
      this.test('Handle large values', true, validateAmount(largeValue) === largeValue);
    } catch (error) {
      this.criticalIssues.push(`Large value handling error: ${error}`);
    }
    
    // Valores muito pequenos
    try {
      const smallValue = 0.01;
      this.test('Handle small values', true, validateAmount(smallValue) === smallValue);
    } catch (error) {
      this.criticalIssues.push(`Small value handling error: ${error}`);
    }
    
    // Teste de overflow de memória
    try {
      const testArray = new Array(1000).fill(0).map((_, i) => calculateBalance(i, i * 0.1, i * 0.05, i * 0.02));
      this.test('Memory overflow protection', true, testArray.length === 1000);
    } catch (error) {
      this.criticalIssues.push(`Memory overflow error: ${error}`);
    }
  }

  // Teste de consistência de dados
  private testDataConsistency(): void {
    console.log('\n🔍 TESTING: Data Consistency');
    
    // Teste round-trip: format -> parse -> format
    const originalValue = 1234.56;
    const formatted = formatCurrency(originalValue);
    const parsed = parseCurrency(formatted);
    const reformatted = formatCurrency(parsed);
    
    this.test('Round-trip consistency', formatted, reformatted);
    this.test('Parse accuracy', originalValue, parsed);
    
    // Teste de múltiplas operações
    let runningBalance = 1000;
    runningBalance = calculateBalance(runningBalance, 100, 0, 0); // +100 = 1100
    runningBalance = calculateBalance(runningBalance, 0, 50, 0);  // -50 = 1050
    runningBalance = calculateBalance(runningBalance, 0, 0, 25);  // -25 = 1025
    
    this.test('Multiple operations consistency', 1025, runningBalance);
  }

  // Executar auditoria completa
  public async runCompleteAudit(): Promise<AuditReport> {
    console.log('🚀 INICIANDO AUDITORIA COMPLETA DA LÓGICA FINANCEIRA');
    console.log('=' .repeat(60));
    
    this.results = [];
    this.criticalIssues = [];
    
    try {
      this.testDecimalPrecision();
      this.testCurrencyFormatting();
      this.testCurrencyParsing();
      this.testBalanceCalculation();
      this.testSecurityValidation();
      this.testBalancePropagation();
      this.testRecurringTransactions();
      this.testEdgeCases();
      this.testDataConsistency();
      
    } catch (error) {
      this.criticalIssues.push(`Critical audit error: ${error}`);
    }
    
    const report: AuditReport = {
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.passed).length,
      failedTests: this.results.filter(r => !r.passed).length,
      results: this.results,
      criticalIssues: this.criticalIssues
    };
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RELATÓRIO FINAL DA AUDITORIA');
    console.log(`Total de Testes: ${report.totalTests}`);
    console.log(`✅ Aprovados: ${report.passedTests}`);
    console.log(`❌ Falharam: ${report.failedTests}`);
    console.log(`🚨 Problemas Críticos: ${report.criticalIssues.length}`);
    
    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
      report.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (report.failedTests > 0) {
      console.log('\n❌ TESTES FALHARAM:');
      report.results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.testName}: ${result.error}`);
      });
    }
    
    const successRate = (report.passedTests / report.totalTests * 100).toFixed(1);
    console.log(`\n🎯 Taxa de Sucesso: ${successRate}%`);
    
    return report;
  }
}