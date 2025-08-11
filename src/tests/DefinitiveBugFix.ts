/**
 * CORREÇÃO DEFINITIVA - PREVINE ACÚMULO DE BUGS
 * Implementação senior com limpeza de estado e prevenção de memory leaks
 */

import { TestStateManager } from './TestStateManager';
import { formatCurrency, parseCurrency, calculateBalance } from '../utils/currencyUtils';

class DefinitiveBugFixer {
  private stateManager: TestStateManager;
  private results: any[] = [];

  constructor() {
    this.stateManager = TestStateManager.getInstance();
  }

  // Executar correção com limpeza completa de estado
  public async runDefinitiveTests(): Promise<void> {
    // CRÍTICO: Verificar se pode executar
    if (!this.stateManager.canExecute()) {
      return;
    }

    try {
      // CRÍTICO: Limpar todo o estado anterior
      this.stateManager.clearAllState();
      this.stateManager.startExecution();
      
      console.log('🔧 INICIANDO CORREÇÃO DEFINITIVA DE BUGS...');
      console.log('=' .repeat(60));
      
      // Limpar resultados anteriores
      this.results = [];
      
      // Executar testes com isolamento
      await this.testCurrencyFormattingIsolated();
      await this.testBalanceCalculationIsolated();
      await this.testMonthlyTotalsIsolated();
      await this.testDecimalPrecisionIsolated();
      
      // Exibir resultados finais
      this.displayFinalResults();
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na correção:', error);
    } finally {
      // CRÍTICO: Sempre limpar estado no final
      this.stateManager.endExecution();
      this.cleanup();
    }
  }

  // Teste isolado de formatação de moeda
  private async testCurrencyFormattingIsolated(): Promise<void> {
    console.log('\n💰 TESTE ISOLADO: Formatação de Moeda');
    
    const testCases = [
      { value: 100.50, name: 'Valor decimal' },
      { value: 0, name: 'Zero' },
      { value: -500.99, name: 'Valor negativo' },
      { value: 1000000.00, name: 'Valor grande' },
      { value: 0.01, name: 'Valor pequeno' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      try {
        // Teste isolado com timeout
        const result = await this.runWithTimeout(() => {
          const formatted = formatCurrency(testCase.value);
          const parsed = parseCurrency(formatted);
          const roundTrip = formatCurrency(parsed);
          
          return {
            original: testCase.value,
            formatted,
            parsed,
            roundTrip,
            valid: Math.abs(parsed - testCase.value) <= 0.01 && formatted === roundTrip
          };
        }, 1000);
        
        if (result.valid) {
          console.log(`✅ ${testCase.name}: ${result.formatted}`);
          passed++;
        } else {
          console.error(`❌ ${testCase.name}: ${result.formatted} → ${result.parsed}`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ ${testCase.name}: ERRO - ${error.message}`);
        failed++;
      }
      
      // Pequena pausa para evitar sobrecarga
      await this.sleep(10);
    }
    
    this.results.push({
      category: 'Formatação de Moeda',
      passed,
      failed,
      total: testCases.length
    });
  }

  // Teste isolado de cálculo de saldo
  private async testBalanceCalculationIsolated(): Promise<void> {
    console.log('\n🧮 TESTE ISOLADO: Cálculo de Saldo');
    
    const testCases = [
      { prev: 100, entrada: 50, saida: 20, diario: 10, expected: 120, name: 'Cálculo básico' },
      { prev: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000, name: 'Apenas entrada' },
      { prev: 500, entrada: 0, saida: 600, diario: 0, expected: -100, name: 'Saldo negativo' },
      { prev: 1000.50, entrada: 250.25, saida: 100.75, diario: 50.00, expected: 1100.00, name: 'Decimais complexos' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      try {
        const result = await this.runWithTimeout(() => {
          return calculateBalance(testCase.prev, testCase.entrada, testCase.saida, testCase.diario);
        }, 1000);
        
        const difference = Math.abs(result - testCase.expected);
        
        if (difference <= 0.01) {
          console.log(`✅ ${testCase.name}: ${result} (esperado: ${testCase.expected})`);
          passed++;
        } else {
          console.error(`❌ ${testCase.name}: ${result} ≠ ${testCase.expected} (diff: ${difference})`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ ${testCase.name}: ERRO - ${error.message}`);
        failed++;
      }
      
      await this.sleep(10);
    }
    
    this.results.push({
      category: 'Cálculo de Saldo',
      passed,
      failed,
      total: testCases.length
    });
  }

  // Teste isolado de totais mensais
  private async testMonthlyTotalsIsolated(): Promise<void> {
    console.log('\n📊 TESTE ISOLADO: Totais Mensais');
    
    // Simular dados limpos
    const cleanMonthData = {
      1: { entrada: 'R$ 1.000,00', saida: 'R$ 200,00', diario: 'R$ 50,00' },
      2: { entrada: 'R$ 500,00', saida: 'R$ 100,00', diario: 'R$ 25,00' },
      3: { entrada: 'R$ 0,00', saida: 'R$ 300,00', diario: 'R$ 75,00' }
    };
    
    try {
      const result = await this.runWithTimeout(() => {
        let totalEntradas = 0;
        let totalSaidas = 0;
        let totalDiario = 0;
        
        Object.values(cleanMonthData).forEach(dayData => {
          totalEntradas += parseCurrency(dayData.entrada);
          totalSaidas += parseCurrency(dayData.saida);
          totalDiario += parseCurrency(dayData.diario);
        });
        
        return {
          totalEntradas: Math.round(totalEntradas * 100) / 100,
          totalSaidas: Math.round(totalSaidas * 100) / 100,
          totalDiario: Math.round(totalDiario * 100) / 100
        };
      }, 1000);
      
      const expected = { totalEntradas: 1500, totalSaidas: 600, totalDiario: 150 };
      
      let passed = 0;
      let failed = 0;
      
      if (Math.abs(result.totalEntradas - expected.totalEntradas) <= 0.01) {
        console.log(`✅ Total Entradas: ${result.totalEntradas}`);
        passed++;
      } else {
        console.error(`❌ Total Entradas: ${result.totalEntradas} ≠ ${expected.totalEntradas}`);
        failed++;
      }
      
      if (Math.abs(result.totalSaidas - expected.totalSaidas) <= 0.01) {
        console.log(`✅ Total Saídas: ${result.totalSaidas}`);
        passed++;
      } else {
        console.error(`❌ Total Saídas: ${result.totalSaidas} ≠ ${expected.totalSaidas}`);
        failed++;
      }
      
      if (Math.abs(result.totalDiario - expected.totalDiario) <= 0.01) {
        console.log(`✅ Total Diário: ${result.totalDiario}`);
        passed++;
      } else {
        console.error(`❌ Total Diário: ${result.totalDiario} ≠ ${expected.totalDiario}`);
        failed++;
      }
      
      this.results.push({
        category: 'Totais Mensais',
        passed,
        failed,
        total: 3
      });
      
    } catch (error) {
      console.error('❌ ERRO no teste de totais mensais:', error);
      this.results.push({
        category: 'Totais Mensais',
        passed: 0,
        failed: 3,
        total: 3
      });
    }
  }

  // Teste isolado de precisão decimal
  private async testDecimalPrecisionIsolated(): Promise<void> {
    console.log('\n🔢 TESTE ISOLADO: Precisão Decimal');
    
    const testCases = [
      { a: 0.1, b: 0.2, expected: 0.3, name: 'Problema clássico JS' },
      { a: 1.1, b: 2.2, expected: 3.3, name: 'Decimais simples' },
      { a: 10.01, b: 20.02, expected: 30.03, name: 'Centavos' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      try {
        const result = await this.runWithTimeout(() => {
          return calculateBalance(0, testCase.a + testCase.b, 0, 0);
        }, 1000);
        
        const difference = Math.abs(result - testCase.expected);
        
        if (difference <= 0.001) {
          console.log(`✅ ${testCase.name}: ${result}`);
          passed++;
        } else {
          console.error(`❌ ${testCase.name}: ${result} ≠ ${testCase.expected} (diff: ${difference})`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ ${testCase.name}: ERRO - ${error.message}`);
        failed++;
      }
      
      await this.sleep(10);
    }
    
    this.results.push({
      category: 'Precisão Decimal',
      passed,
      failed,
      total: testCases.length
    });
  }

  // Executar função com timeout
  private async runWithTimeout<T>(fn: () => T, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeoutMs);
      
      try {
        const result = fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  // Sleep para evitar sobrecarga
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Exibir resultados finais
  private displayFinalResults(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESULTADOS FINAIS DA CORREÇÃO DEFINITIVA');
    console.log('=' .repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    this.results.forEach(result => {
      const successRate = ((result.passed / result.total) * 100).toFixed(1);
      console.log(`${result.category}: ${result.passed}/${result.total} (${successRate}%)`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += result.total;
    });
    
    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '-'.repeat(40));
    console.log(`TOTAL: ${totalPassed}/${totalTests} (${overallSuccessRate}%)`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 TODOS OS BUGS FORAM CORRIGIDOS!');
    } else {
      console.log(`\n⚠️ ${totalFailed} bugs ainda precisam ser corrigidos`);
    }
    
    console.log('=' .repeat(60));
  }

  // Limpeza final
  private cleanup(): void {
    this.results = [];
    
    // Limpar referências
    if ((window as any).__definitiveBugFixer) {
      delete (window as any).__definitiveBugFixer;
    }
  }
}

// Instância global única
let definitiveFixer: DefinitiveBugFixer | null = null;

// Função de execução única
export const runDefinitiveBugFix = async (): Promise<void> => {
  // Prevenir múltiplas execuções
  if (definitiveFixer) {
    console.warn('⚠️ Correção já em execução, ignorando...');
    return;
  }
  
  try {
    definitiveFixer = new DefinitiveBugFixer();
    await definitiveFixer.runDefinitiveBugFix();
  } finally {
    definitiveFixer = null;
  }
};

// Auto-executar apenas uma vez em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Delay maior para evitar conflitos
  setTimeout(() => {
    runDefinitiveBugFix();
  }, 5000);
}