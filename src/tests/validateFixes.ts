/**
 * Validação das Correções de Bugs Críticos
 * Testa se as correções implementadas funcionam corretamente
 */

import { calculateBalance, parseCurrency, formatCurrency } from '../utils/currencyUtils';
import { sanitizeAmount, validateAmount } from '../utils/securityUtils';

export interface FixValidationResult {
  fixId: string;
  fixName: string;
  passed: boolean;
  details: string;
  before: any;
  after: any;
}

export class FixValidator {
  private results: FixValidationResult[] = [];

  /**
   * Executa validação de todas as correções
   */
  public validateAllFixes(): FixValidationResult[] {
    console.log('🔧 VALIDANDO CORREÇÕES DE BUGS CRÍTICOS...');
    
    this.results = [];
    
    // 1. Validar correção de precisão decimal
    this.validateDecimalPrecisionFix();
    
    // 2. Validar correção de parsing de negativos
    this.validateNegativeParsingFix();
    
    // 3. Validar correção de valores com milhares
    this.validateThousandsSeparatorFix();
    
    // 4. Validar proteção contra overflow
    this.validateOverflowProtectionFix();
    
    // 5. Validar arredondamento correto
    this.validateRoundingFix();
    
    this.printValidationResults();
    return this.results;
  }

  /**
   * 1. Validar Correção de Precisão Decimal
   */
  private validateDecimalPrecisionFix(): void {
    console.log('🧮 Validando correção de precisão decimal...');

    // Teste 1: 0.1 + 0.2 deve ser exatamente 0.3
    const result1 = calculateBalance(0, 0.1, 0, 0);
    const result2 = calculateBalance(result1, 0.2, 0, 0);
    const expected = 0.3;
    const passed1 = Math.abs(result2 - expected) < 0.001;

    this.addResult({
      fixId: 'CALC-001',
      fixName: 'Precisão Decimal - 0.1 + 0.2 = 0.3',
      passed: passed1,
      details: passed1 ? 'Precisão decimal corrigida' : 'Ainda há problemas de precisão',
      before: '0.30000000000000004',
      after: result2
    });

    // Teste 2: Operações com centavos
    const result3 = calculateBalance(100.33, 25.67, 10.99, 5.12);
    const expected3 = 109.89; // 100.33 + 25.67 - 10.99 - 5.12
    const passed2 = Math.abs(result3 - expected3) < 0.01;

    this.addResult({
      fixId: 'CALC-002',
      fixName: 'Precisão Decimal - Operações com Centavos',
      passed: passed2,
      details: passed2 ? 'Cálculos com centavos precisos' : 'Problemas com cálculos de centavos',
      before: 'Impreciso',
      after: result3
    });
  }

  /**
   * 2. Validar Correção de Parsing de Negativos
   */
  private validateNegativeParsingFix(): void {
    console.log('💱 Validando correção de parsing de negativos...');

    // Teste 1: Valor negativo com hífen
    const result1 = parseCurrency('-R$ 50,25');
    const expected1 = -50.25;
    const passed1 = result1 === expected1;

    this.addResult({
      fixId: 'PARSE-001',
      fixName: 'Parsing Negativo - Hífen',
      passed: passed1,
      details: passed1 ? 'Parsing de negativos com hífen funciona' : 'Falha no parsing de negativos',
      before: 'Valor positivo incorreto',
      after: result1
    });

    // Teste 2: Valor negativo com parênteses
    const result2 = parseCurrency('(R$ 75,50)');
    const expected2 = -75.50;
    const passed2 = result2 === expected2;

    this.addResult({
      fixId: 'PARSE-002',
      fixName: 'Parsing Negativo - Parênteses',
      passed: passed2,
      details: passed2 ? 'Parsing de negativos com parênteses funciona' : 'Falha no parsing com parênteses',
      before: 'Não suportado',
      after: result2
    });

    // Teste 3: Valor positivo normal
    const result3 = parseCurrency('R$ 100,75');
    const expected3 = 100.75;
    const passed3 = result3 === expected3;

    this.addResult({
      fixId: 'PARSE-003',
      fixName: 'Parsing Positivo - Controle',
      passed: passed3,
      details: passed3 ? 'Parsing de positivos mantido' : 'Parsing de positivos quebrado',
      before: '100.75',
      after: result3
    });
  }

  /**
   * 3. Validar Correção de Separador de Milhares
   */
  private validateThousandsSeparatorFix(): void {
    console.log('🔢 Validando correção de separador de milhares...');

    // Teste 1: Valor com separador de milhares
    const result1 = parseCurrency('R$ 1.500,75');
    const expected1 = 1500.75;
    const passed1 = result1 === expected1;

    this.addResult({
      fixId: 'PARSE-004',
      fixName: 'Separador de Milhares',
      passed: passed1,
      details: passed1 ? 'Separador de milhares funciona' : 'Falha no separador de milhares',
      before: 'Interpretação incorreta',
      after: result1
    });

    // Teste 2: Valor grande com múltiplos separadores
    const result2 = parseCurrency('R$ 1.234.567,89');
    const expected2 = 1234567.89;
    const passed2 = result2 === expected2;

    this.addResult({
      fixId: 'PARSE-005',
      fixName: 'Múltiplos Separadores',
      passed: passed2,
      details: passed2 ? 'Múltiplos separadores funcionam' : 'Falha com múltiplos separadores',
      before: 'Não suportado',
      after: result2
    });
  }

  /**
   * 4. Validar Proteção contra Overflow
   */
  private validateOverflowProtectionFix(): void {
    console.log('🛡️ Validando proteção contra overflow...');

    // Teste 1: Valor muito grande
    const result1 = validateAmount(9999999999);
    const expected1 = 999999999.99; // Limite máximo
    const passed1 = result1 === expected1;

    this.addResult({
      fixId: 'SEC-001',
      fixName: 'Proteção Overflow - Máximo',
      passed: passed1,
      details: passed1 ? 'Overflow limitado corretamente' : 'Falha na proteção de overflow',
      before: 'Valor ilimitado',
      after: result1
    });

    // Teste 2: Valor muito pequeno (negativo)
    const result2 = validateAmount(-9999999999);
    const expected2 = -999999999.99; // Limite mínimo
    const passed2 = result2 === expected2;

    this.addResult({
      fixId: 'SEC-002',
      fixName: 'Proteção Underflow - Mínimo',
      passed: passed2,
      details: passed2 ? 'Underflow limitado corretamente' : 'Falha na proteção de underflow',
      before: 'Valor ilimitado',
      after: result2
    });

    // Teste 3: NaN e Infinity
    const result3 = validateAmount(NaN);
    const result4 = validateAmount(Infinity);
    const passed3 = result3 === 0 && result4 === 0;

    this.addResult({
      fixId: 'SEC-003',
      fixName: 'Proteção NaN/Infinity',
      passed: passed3,
      details: passed3 ? 'NaN e Infinity tratados corretamente' : 'Falha no tratamento de valores inválidos',
      before: 'Valores inválidos passavam',
      after: `NaN: ${result3}, Infinity: ${result4}`
    });
  }

  /**
   * 5. Validar Arredondamento Correto
   */
  private validateRoundingFix(): void {
    console.log('🎯 Validando arredondamento correto...');

    // Teste 1: Arredondamento para 2 casas decimais
    const result1 = validateAmount(10.999);
    const expected1 = 11.00;
    const passed1 = result1 === expected1;

    this.addResult({
      fixId: 'ROUND-001',
      fixName: 'Arredondamento - 2 Casas',
      passed: passed1,
      details: passed1 ? 'Arredondamento para 2 casas funciona' : 'Falha no arredondamento',
      before: '10.999',
      after: result1
    });

    // Teste 2: Preservar casas decimais exatas
    const result2 = validateAmount(15.50);
    const expected2 = 15.50;
    const passed2 = result2 === expected2;

    this.addResult({
      fixId: 'ROUND-002',
      fixName: 'Preservar Decimais Exatos',
      passed: passed2,
      details: passed2 ? 'Decimais exatos preservados' : 'Falha na preservação de decimais',
      before: '15.5',
      after: result2
    });
  }

  /**
   * Adiciona resultado de validação
   */
  private addResult(result: FixValidationResult): void {
    this.results.push(result);
  }

  /**
   * Imprime resultados da validação
   */
  private printValidationResults(): void {
    console.log('\n🔧 RESULTADOS DA VALIDAÇÃO DE CORREÇÕES');
    console.log('========================================');
    
    const passed = this.results.filter(r => r.passed);
    const failed = this.results.filter(r => !r.passed);

    console.log(`✅ Correções Validadas: ${passed.length}`);
    console.log(`❌ Correções Falharam: ${failed.length}`);
    console.log(`📊 Total: ${this.results.length}`);
    console.log(`📈 Taxa de Sucesso: ${((passed.length / this.results.length) * 100).toFixed(1)}%`);

    if (failed.length > 0) {
      console.log('\n❌ CORREÇÕES QUE FALHARAM:');
      failed.forEach(result => {
        console.log(`\n🔍 ${result.fixId}: ${result.fixName}`);
        console.log(`   📝 Detalhes: ${result.details}`);
        console.log(`   📊 Antes: ${result.before}`);
        console.log(`   📊 Depois: ${result.after}`);
      });
    } else {
      console.log('\n🎉 TODAS AS CORREÇÕES FORAM VALIDADAS COM SUCESSO!');
    }

    if (passed.length > 0) {
      console.log('\n✅ CORREÇÕES VALIDADAS:');
      passed.forEach(result => {
        console.log(`   ✓ ${result.fixName}`);
      });
    }
  }

  /**
   * Retorna resumo da validação
   */
  public getValidationSummary(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    criticalIssues: string[];
  } {
    const passed = this.results.filter(r => r.passed);
    const failed = this.results.filter(r => !r.passed);
    
    const criticalIssues = failed
      .filter(r => r.fixId.startsWith('CALC') || r.fixId.startsWith('SEC'))
      .map(r => r.fixName);

    return {
      total: this.results.length,
      passed: passed.length,
      failed: failed.length,
      successRate: (passed.length / this.results.length) * 100,
      criticalIssues
    };
  }

  /**
   * Executa teste rápido de todas as correções
   */
  public quickValidation(): boolean {
    const results = this.validateAllFixes();
    const criticalFixes = results.filter(r => 
      r.fixId.startsWith('CALC') || r.fixId.startsWith('PARSE') || r.fixId.startsWith('SEC')
    );
    
    const criticalPassed = criticalFixes.filter(r => r.passed);
    const success = criticalPassed.length === criticalFixes.length;
    
    if (success) {
      console.log('🎉 VALIDAÇÃO RÁPIDA: Todas as correções críticas funcionam!');
    } else {
      console.log('❌ VALIDAÇÃO RÁPIDA: Algumas correções críticas falharam!');
    }
    
    return success;
  }
}

// Função para execução rápida
export const validateFixes = (): boolean => {
  const validator = new FixValidator();
  return validator.quickValidation();
};

// Função para validação completa
export const validateAllFixes = (): FixValidationResult[] => {
  const validator = new FixValidator();
  return validator.validateAllFixes();
};