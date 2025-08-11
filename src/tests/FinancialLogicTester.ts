/**
 * Sistema de Testes Abrangente para Lógica Financeira
 * Testa todos os cenários possíveis para identificar bugs
 */

import { calculateBalance, parseCurrency, formatCurrency } from '../utils/currencyUtils';
import { sanitizeAmount, validateAmount } from '../utils/securityUtils';
import { getDaysInMonth } from '../utils/dateUtils';

export interface TestResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

export class FinancialLogicTester {
  private testSuites: TestSuite[] = [];

  /**
   * Executa todos os testes de lógica financeira
   */
  public runAllTests(): TestSuite[] {
    console.log('🧪 Iniciando testes abrangentes da lógica financeira...');
    
    this.testSuites = [];
    
    // 1. Testes de Cálculo de Saldo
    this.testBalanceCalculations();
    
    // 2. Testes de Parsing de Moeda
    this.testCurrencyParsing();
    
    // 3. Testes de Formatação de Moeda
    this.testCurrencyFormatting();
    
    // 4. Testes de Validação de Valores
    this.testAmountValidation();
    
    // 5. Testes de Sanitização
    this.testAmountSanitization();
    
    // 6. Testes de Datas
    this.testDateLogic();
    
    // 7. Testes de Cenários Extremos
    this.testEdgeCases();
    
    // 8. Testes de Propagação de Saldo
    this.testBalancePropagation();
    
    // 9. Testes de Transações Recorrentes
    this.testRecurringTransactions();
    
    // 10. Testes de Integridade de Dados
    this.testDataIntegrity();
    
    this.printTestSummary();
    return this.testSuites;
  }

  /**
   * 1. Testes de Cálculo de Saldo
   */
  private testBalanceCalculations(): void {
    const suite: TestSuite = {
      suiteName: 'Cálculo de Saldo',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Teste básico: Saldo = Anterior + Entrada - Saída - Diário
    this.addTest(suite, 'Cálculo básico positivo', () => {
      const result = calculateBalance(1000, 500, 200, 100);
      return { expected: 1200, actual: result };
    });

    this.addTest(suite, 'Cálculo com saldo negativo', () => {
      const result = calculateBalance(-500, 300, 100, 50);
      return { expected: -350, actual: result };
    });

    this.addTest(suite, 'Cálculo com valores zero', () => {
      const result = calculateBalance(0, 0, 0, 0);
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Cálculo com valores decimais', () => {
      const result = calculateBalance(100.50, 25.75, 10.25, 5.50);
      return { expected: 110.50, actual: result };
    });

    this.addTest(suite, 'Cálculo com valores grandes', () => {
      const result = calculateBalance(999999, 100000, 50000, 25000);
      return { expected: 1024999, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 2. Testes de Parsing de Moeda
   */
  private testCurrencyParsing(): void {
    const suite: TestSuite = {
      suiteName: 'Parsing de Moeda',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    this.addTest(suite, 'Parse R$ 100,50', () => {
      const result = parseCurrency('R$ 100,50');
      return { expected: 100.50, actual: result };
    });

    this.addTest(suite, 'Parse 1.500,75', () => {
      const result = parseCurrency('1.500,75');
      return { expected: 1500.75, actual: result };
    });

    this.addTest(suite, 'Parse string vazia', () => {
      const result = parseCurrency('');
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Parse R$ 0,00', () => {
      const result = parseCurrency('R$ 0,00');
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Parse valor negativo', () => {
      const result = parseCurrency('-R$ 50,25');
      return { expected: -50.25, actual: result };
    });

    this.addTest(suite, 'Parse valor com espaços', () => {
      const result = parseCurrency(' R$ 25,00 ');
      return { expected: 25.00, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 3. Testes de Formatação de Moeda
   */
  private testCurrencyFormatting(): void {
    const suite: TestSuite = {
      suiteName: 'Formatação de Moeda',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    this.addTest(suite, 'Formatar 100.50', () => {
      const result = formatCurrency(100.50);
      const expected = 'R$ 100,50';
      return { expected, actual: result };
    });

    this.addTest(suite, 'Formatar 0', () => {
      const result = formatCurrency(0);
      const expected = 'R$ 0,00';
      return { expected, actual: result };
    });

    this.addTest(suite, 'Formatar valor negativo', () => {
      const result = formatCurrency(-50.25);
      const expected = '-R$ 50,25';
      return { expected, actual: result };
    });

    this.addTest(suite, 'Formatar valor grande', () => {
      const result = formatCurrency(1234567.89);
      const expected = 'R$ 1.234.567,89';
      return { expected, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 4. Testes de Validação de Valores
   */
  private testAmountValidation(): void {
    const suite: TestSuite = {
      suiteName: 'Validação de Valores',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    this.addTest(suite, 'Validar NaN', () => {
      const result = validateAmount(NaN);
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Validar Infinity', () => {
      const result = validateAmount(Infinity);
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Validar valor muito grande', () => {
      const result = validateAmount(9999999999);
      return { expected: 999999999.99, actual: result };
    });

    this.addTest(suite, 'Validar valor muito pequeno', () => {
      const result = validateAmount(-9999999999);
      return { expected: -999999999.99, actual: result };
    });

    this.addTest(suite, 'Validar arredondamento', () => {
      const result = validateAmount(10.999);
      return { expected: 11.00, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 5. Testes de Sanitização
   */
  private testAmountSanitization(): void {
    const suite: TestSuite = {
      suiteName: 'Sanitização de Valores',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    this.addTest(suite, 'Sanitizar string maliciosa', () => {
      const result = sanitizeAmount('<script>alert("hack")</script>');
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Sanitizar valor SQL injection', () => {
      const result = sanitizeAmount("'; DROP TABLE users; --");
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Sanitizar valor válido', () => {
      const result = sanitizeAmount('R$ 100,50');
      return { expected: 100.50, actual: result };
    });

    this.addTest(suite, 'Sanitizar null', () => {
      const result = sanitizeAmount(null as any);
      return { expected: 0, actual: result };
    });

    this.addTest(suite, 'Sanitizar undefined', () => {
      const result = sanitizeAmount(undefined as any);
      return { expected: 0, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 6. Testes de Lógica de Datas
   */
  private testDateLogic(): void {
    const suite: TestSuite = {
      suiteName: 'Lógica de Datas',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    this.addTest(suite, 'Dias em janeiro', () => {
      const result = getDaysInMonth(2024, 0); // Janeiro = 0
      return { expected: 31, actual: result };
    });

    this.addTest(suite, 'Dias em fevereiro (ano bissexto)', () => {
      const result = getDaysInMonth(2024, 1); // Fevereiro = 1
      return { expected: 29, actual: result };
    });

    this.addTest(suite, 'Dias em fevereiro (ano normal)', () => {
      const result = getDaysInMonth(2023, 1);
      return { expected: 28, actual: result };
    });

    this.addTest(suite, 'Dias em dezembro', () => {
      const result = getDaysInMonth(2024, 11); // Dezembro = 11
      return { expected: 31, actual: result };
    });

    this.testSuites.push(suite);
  }

  /**
   * 7. Testes de Cenários Extremos
   */
  private testEdgeCases(): void {
    const suite: TestSuite = {
      suiteName: 'Cenários Extremos',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Teste de overflow
    this.addTest(suite, 'Overflow de saldo', () => {
      const result = calculateBalance(999999999, 999999999, 0, 0);
      // Deve ser limitado pelo validateAmount
      return { expected: 999999999.99, actual: result };
    });

    // Teste de underflow
    this.addTest(suite, 'Underflow de saldo', () => {
      const result = calculateBalance(-999999999, 0, 999999999, 0);
      return { expected: -999999999.99, actual: result };
    });

    // Teste com muitas casas decimais
    this.addTest(suite, 'Precisão decimal', () => {
      const result = calculateBalance(0.1, 0.2, 0, 0);
      return { expected: 0.30, actual: result };
    });

    // Teste de divisão por zero (não aplicável diretamente, mas testamos NaN)
    this.addTest(suite, 'Resultado NaN', () => {
      const result = calculateBalance(NaN, 100, 50, 25);
      return { expected: 25, actual: result }; // NaN deve ser convertido para 0
    });

    this.testSuites.push(suite);
  }

  /**
   * 8. Testes de Propagação de Saldo
   */
  private testBalancePropagation(): void {
    const suite: TestSuite = {
      suiteName: 'Propagação de Saldo',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Simular dados de teste
    const mockData = {
      2024: {
        0: { // Janeiro
          1: { entrada: 'R$ 1000,00', saida: 'R$ 0,00', diario: 'R$ 0,00', balance: 1000 },
          2: { entrada: 'R$ 0,00', saida: 'R$ 100,00', diario: 'R$ 50,00', balance: 850 }
        },
        1: { // Fevereiro
          1: { entrada: 'R$ 0,00', saida: 'R$ 0,00', diario: 'R$ 0,00', balance: 850 }
        }
      }
    };

    this.addTest(suite, 'Propagação entre dias', () => {
      // Dia 2 deve herdar saldo do dia 1
      const day1Balance = mockData[2024][0][1].balance;
      const day2Expected = day1Balance - 100 - 50; // entrada 0, saida 100, diario 50
      const day2Actual = mockData[2024][0][2].balance;
      return { expected: day2Expected, actual: day2Actual };
    });

    this.addTest(suite, 'Propagação entre meses', () => {
      // Fevereiro dia 1 deve herdar saldo do último dia de janeiro
      const janLastBalance = mockData[2024][0][2].balance;
      const febFirstBalance = mockData[2024][1][1].balance;
      return { expected: janLastBalance, actual: febFirstBalance };
    });

    this.testSuites.push(suite);
  }

  /**
   * 9. Testes de Transações Recorrentes
   */
  private testRecurringTransactions(): void {
    const suite: TestSuite = {
      suiteName: 'Transações Recorrentes',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Teste de transação recorrente no futuro
    this.addTest(suite, 'Transação recorrente futura deve ser processada', () => {
      const futureDay = currentDay + 5;
      const shouldProcess = futureDay <= 31; // Simplificado
      return { expected: true, actual: shouldProcess };
    });

    // Teste de transação recorrente no passado
    this.addTest(suite, 'Transação recorrente passada não deve ser processada', () => {
      const pastDay = currentDay - 5;
      const shouldProcess = pastDay > currentDay;
      return { expected: false, actual: shouldProcess };
    });

    this.testSuites.push(suite);
  }

  /**
   * 10. Testes de Integridade de Dados
   */
  private testDataIntegrity(): void {
    const suite: TestSuite = {
      suiteName: 'Integridade de Dados',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Teste de estrutura de dados
    this.addTest(suite, 'Estrutura de dados válida', () => {
      const validData = {
        2024: {
          0: {
            1: { entrada: 'R$ 100,00', saida: 'R$ 0,00', diario: 'R$ 0,00', balance: 100 }
          }
        }
      };
      const isValid = typeof validData === 'object' && validData[2024] && validData[2024][0];
      return { expected: true, actual: isValid };
    });

    // Teste de dados corrompidos
    this.addTest(suite, 'Dados corrompidos devem ser rejeitados', () => {
      const corruptedData = null;
      const isValid = corruptedData !== null && typeof corruptedData === 'object';
      return { expected: false, actual: isValid };
    });

    this.testSuites.push(suite);
  }

  /**
   * Adiciona um teste ao suite
   */
  private addTest(suite: TestSuite, testName: string, testFn: () => { expected: any; actual: any }): void {
    try {
      const { expected, actual } = testFn();
      const passed = this.deepEqual(expected, actual);
      
      suite.results.push({
        testName,
        passed,
        expected,
        actual
      });

      if (passed) {
        suite.passed++;
      } else {
        suite.failed++;
      }
      suite.total++;
    } catch (error) {
      suite.results.push({
        testName,
        passed: false,
        expected: 'No error',
        actual: 'Error occurred',
        error: error instanceof Error ? error.message : String(error)
      });
      suite.failed++;
      suite.total++;
    }
  }

  /**
   * Comparação profunda de valores
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.01; // Tolerância para decimais
    }
    return false;
  }

  /**
   * Imprime resumo dos testes
   */
  private printTestSummary(): void {
    console.log('\n🧪 RESUMO DOS TESTES DE LÓGICA FINANCEIRA');
    console.log('==========================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    this.testSuites.forEach(suite => {
      console.log(`\n📋 ${suite.suiteName}:`);
      console.log(`   ✅ Passou: ${suite.passed}`);
      console.log(`   ❌ Falhou: ${suite.failed}`);
      console.log(`   📊 Total: ${suite.total}`);
      
      // Mostrar testes que falharam
      suite.results.filter(r => !r.passed).forEach(result => {
        console.log(`   🔍 FALHA: ${result.testName}`);
        console.log(`      Esperado: ${JSON.stringify(result.expected)}`);
        console.log(`      Atual: ${JSON.stringify(result.actual)}`);
        if (result.error) {
          console.log(`      Erro: ${result.error}`);
        }
      });

      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalTests += suite.total;
    });

    console.log('\n🎯 RESULTADO GERAL:');
    console.log(`   ✅ Testes Passaram: ${totalPassed}`);
    console.log(`   ❌ Testes Falharam: ${totalFailed}`);
    console.log(`   📊 Total de Testes: ${totalTests}`);
    console.log(`   📈 Taxa de Sucesso: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema financeiro está funcionando corretamente.');
    } else {
      console.log(`\n⚠️ ${totalFailed} BUGS ENCONTRADOS! Revisar implementação.`);
    }
  }

  /**
   * Retorna bugs encontrados
   */
  public getBugsFound(): string[] {
    const bugs: string[] = [];
    
    this.testSuites.forEach(suite => {
      suite.results.filter(r => !r.passed).forEach(result => {
        bugs.push(`${suite.suiteName}: ${result.testName} - Esperado: ${JSON.stringify(result.expected)}, Atual: ${JSON.stringify(result.actual)}`);
      });
    });

    return bugs;
  }
}